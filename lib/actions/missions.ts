'use server';

import { db } from '@/lib/db';
import { missions, transportRequests, users, driverAvailabilities } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { TransportType, MissionStatus, AssignmentMethod } from '@/types';

interface CreateMissionData {
  transportRequestId: string;
  driverId: string;
  assignmentMethod?: AssignmentMethod;
  assignmentScore?: number;
}

interface UpdateMissionStatusData {
  missionId: string;
  status: MissionStatus;
  declinedReason?: string;
}

/**
 * Récupère toutes les missions du festival
 */
export async function getMissions(filters?: {
  status?: MissionStatus;
  driverId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé', missions: [] };
    }

    let conditions = [];

    // Filter by driver for DRIVER role
    if (userData.dbUser.role === 'DRIVER') {
      conditions.push(eq(missions.driverId, userData.dbUser.id));
    }

    // Apply filters
    if (filters?.status) {
      conditions.push(eq(missions.status, filters.status));
    }

    if (filters?.driverId) {
      conditions.push(eq(missions.driverId, filters.driverId));
    }

    const result = await db
      .select({
        mission: missions,
        transportRequest: transportRequests,
        driver: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(missions)
      .innerJoin(transportRequests, eq(missions.transportRequestId, transportRequests.id))
      .innerJoin(users, eq(missions.driverId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${transportRequests.requestedDatetime} DESC`);

    // Filter by festival
    const filteredMissions = result.filter(
      (m) => m.transportRequest.festivalId === userData.dbUser.festivalId
    );

    return { success: true, missions: filteredMissions };
  } catch (error) {
    console.error('Error fetching missions:', error);
    return { success: false, error: 'Erreur lors de la récupération des missions', missions: [] };
  }
}

/**
 * Crée une nouvelle mission (affectation)
 */
export async function createMission(data: CreateMissionData) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que la demande de transport existe et appartient au même festival
    const request = await db
      .select()
      .from(transportRequests)
      .where(
        and(
          eq(transportRequests.id, data.transportRequestId),
          eq(transportRequests.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (request.length === 0) {
      return { success: false, error: 'Demande de transport non trouvée' };
    }

    // Vérifier que le chauffeur existe et appartient au même festival
    const driver = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, data.driverId),
          eq(users.festivalId, userData.dbUser.festivalId),
          eq(users.role, 'DRIVER')
        )
      )
      .limit(1);

    if (driver.length === 0) {
      return { success: false, error: 'Chauffeur non trouvé' };
    }

    // Créer la mission
    const [mission] = await db
      .insert(missions)
      .values({
        transportRequestId: data.transportRequestId,
        driverId: data.driverId,
        assignedById: userData.dbUser.id,
        assignmentMethod: data.assignmentMethod || 'MANUAL',
        assignmentScore: data.assignmentScore ? String(data.assignmentScore) : null,
        status: 'PROPOSED',
      })
      .returning();

    // Mettre à jour le statut de la demande de transport
    await db
      .update(transportRequests)
      .set({ status: 'ASSIGNED', updatedAt: new Date() })
      .where(eq(transportRequests.id, data.transportRequestId));

    // Envoyer une notification email au chauffeur
    try {
      const { sendMissionAssignedEmail } = await import('@/lib/services/email-service');

      const [requestDetails] = await db
        .select({
          request: transportRequests,
          vip: users,
        })
        .from(transportRequests)
        .leftJoin(users, eq(transportRequests.vipId, users.id))
        .where(eq(transportRequests.id, data.transportRequestId))
        .limit(1);

      if (requestDetails && driver[0]) {
        await sendMissionAssignedEmail({
          driverEmail: driver[0].email,
          driverName: `${driver[0].firstName || ''} ${driver[0].lastName || ''}`.trim() || driver[0].email,
          vipName: requestDetails.vip ? `${requestDetails.vip.firstName || ''} ${requestDetails.vip.lastName || ''}`.trim() : 'VIP',
          pickupAddress: requestDetails.request.pickupAddress,
          dropoffAddress: requestDetails.request.dropoffAddress,
          requestedDatetime: requestDetails.request.requestedDatetime,
          missionId: mission.id,
        });
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the mission creation if email fails
    }

    revalidatePath('/dashboard/missions');
    revalidatePath('/dashboard/transports');
    revalidatePath('/dashboard/my-missions');

    return { success: true, mission };
  } catch (error) {
    console.error('Error creating mission:', error);
    return { success: false, error: 'Erreur lors de la création de la mission' };
  }
}

/**
 * Met à jour le statut d'une mission
 */
export async function updateMissionStatus(data: UpdateMissionStatusData) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé' };
    }

    // Récupérer la mission
    const [mission] = await db
      .select({
        mission: missions,
        request: transportRequests,
      })
      .from(missions)
      .innerJoin(transportRequests, eq(missions.transportRequestId, transportRequests.id))
      .where(eq(missions.id, data.missionId))
      .limit(1);

    if (!mission) {
      return { success: false, error: 'Mission non trouvée' };
    }

    // Vérifier les autorisations
    if (userData.dbUser.role === 'DRIVER' && mission.mission.driverId !== userData.dbUser.id) {
      return { success: false, error: 'Non autorisé' };
    }

    if (mission.request.festivalId !== userData.dbUser.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    const updateData: any = {
      status: data.status,
      updatedAt: new Date(),
    };

    // Mettre à jour les champs selon le statut
    if (data.status === 'ACCEPTED') {
      updateData.acceptedAt = new Date();
      // Mettre à jour le statut de la demande
      await db
        .update(transportRequests)
        .set({ status: 'ACCEPTED', updatedAt: new Date() })
        .where(eq(transportRequests.id, mission.mission.transportRequestId));
    } else if (data.status === 'DECLINED') {
      updateData.declinedAt = new Date();
      updateData.declinedReason = data.declinedReason;
      // Remettre la demande en PENDING
      await db
        .update(transportRequests)
        .set({ status: 'PENDING', updatedAt: new Date() })
        .where(eq(transportRequests.id, mission.mission.transportRequestId));
    } else if (data.status === 'IN_PROGRESS') {
      updateData.startedAt = new Date();
      await db
        .update(transportRequests)
        .set({ status: 'IN_PROGRESS', updatedAt: new Date() })
        .where(eq(transportRequests.id, mission.mission.transportRequestId));
    } else if (data.status === 'COMPLETED') {
      updateData.completedAt = new Date();
      await db
        .update(transportRequests)
        .set({ status: 'COMPLETED', updatedAt: new Date() })
        .where(eq(transportRequests.id, mission.mission.transportRequestId));
    }

    // Mettre à jour la mission
    await db.update(missions).set(updateData).where(eq(missions.id, data.missionId));

    revalidatePath('/dashboard/missions');
    revalidatePath('/dashboard/transports');
    revalidatePath('/dashboard/my-missions');

    return { success: true };
  } catch (error) {
    console.error('Error updating mission status:', error);
    return { success: false, error: 'Erreur lors de la mise à jour de la mission' };
  }
}

/**
 * Suggère des chauffeurs disponibles pour une demande de transport
 * Utilise l'algorithme avancé d'affectation
 */
export async function suggestDrivers(transportRequestId: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé', suggestions: [] };
    }

    // Récupérer la demande de transport
    const [request] = await db
      .select()
      .from(transportRequests)
      .where(
        and(
          eq(transportRequests.id, transportRequestId),
          eq(transportRequests.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (!request) {
      return { success: false, error: 'Demande de transport non trouvée', suggestions: [] };
    }

    // Utiliser l'algorithme avancé
    const { suggestDriversForAssignment } = await import('@/lib/services/assignment-algorithm');

    const driverScores = await suggestDriversForAssignment({
      transportRequestId: request.id,
      festivalId: request.festivalId,
      requestedDatetime: request.requestedDatetime,
      transportType: request.type as unknown as TransportType,
      pickupLat: request.pickupLat,
      pickupLng: request.pickupLng,
    });

    // Formater les résultats pour correspondre à l'ancien format
    const suggestions = driverScores.map((ds) => ({
      driver: {
        id: ds.driver.id,
        firstName: ds.driver.firstName,
        lastName: ds.driver.lastName,
        email: ds.driver.email,
        phone: ds.driver.phone,
      },
      score: ds.score,
      reason: ds.reason,
      isAvailable: ds.isAvailable,
      missionCount: ds.currentMissionCount,
      distanceKm: ds.distanceKm,
      breakdown: ds.breakdown,
    }));

    return { success: true, suggestions };
  } catch (error) {
    console.error('Error suggesting drivers:', error);
    return { success: false, error: 'Erreur lors de la suggestion de chauffeurs', suggestions: [] };
  }
}

/**
 * Affecte automatiquement le meilleur chauffeur disponible
 */
export async function autoAssignDriver(transportRequestId: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé' };
    }

    // Récupérer la demande de transport
    const [request] = await db
      .select()
      .from(transportRequests)
      .where(
        and(
          eq(transportRequests.id, transportRequestId),
          eq(transportRequests.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (!request) {
      return { success: false, error: 'Demande de transport non trouvée' };
    }

    // Utiliser l'algorithme d'affectation automatique
    const { autoAssignBestDriver } = await import('@/lib/services/assignment-algorithm');

    const result = await autoAssignBestDriver(
      {
        transportRequestId: request.id,
        festivalId: request.festivalId,
        requestedDatetime: request.requestedDatetime,
        transportType: request.type as unknown as TransportType,
        pickupLat: request.pickupLat,
        pickupLng: request.pickupLng,
      },
      userData.dbUser.id
    );

    if (result.success) {
      revalidatePath('/dashboard/missions');
      revalidatePath('/dashboard/transports');
      revalidatePath('/dashboard/my-missions');
    }

    return result;
  } catch (error) {
    console.error('Error auto-assigning driver:', error);
    return { success: false, error: 'Erreur lors de l\'affectation automatique' };
  }
}

/**
 * Récupère les missions d'un chauffeur (pour l'interface chauffeur)
 */
export async function getMyMissions(filters?: { status?: MissionStatus }) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser || userData.dbUser.role !== 'DRIVER') {
      return { success: false, error: 'Non autorisé', missions: [] };
    }

    let conditions = [eq(missions.driverId, userData.dbUser.id)];

    if (filters?.status) {
      conditions.push(eq(missions.status, filters.status));
    }

    const result = await db
      .select({
        mission: missions,
        transportRequest: transportRequests,
      })
      .from(missions)
      .innerJoin(transportRequests, eq(missions.transportRequestId, transportRequests.id))
      .where(and(...conditions))
      .orderBy(sql`${transportRequests.requestedDatetime} DESC`);

    return { success: true, missions: result };
  } catch (error) {
    console.error('Error fetching my missions:', error);
    return { success: false, error: 'Erreur lors de la récupération des missions', missions: [] };
  }
}

/**
 * Récupère toutes les missions d'un chauffeur spécifique (pour l'interface admin)
 */
export async function getDriverMissions(driverId: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé', missions: [] };
    }

    // Vérifier que le chauffeur appartient au même festival
    const [driver] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, driverId),
          eq(users.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (!driver) {
      return { success: false, error: 'Chauffeur non trouvé', missions: [] };
    }

    const result = await db
      .select({
        id: missions.id,
        createdAt: missions.createdAt,
        updatedAt: missions.updatedAt,
        driverId: missions.driverId,
        status: missions.status,
        transportRequestId: missions.transportRequestId,
        assignedById: missions.assignedById,
        assignmentMethod: missions.assignmentMethod,
        assignmentScore: missions.assignmentScore,
        acceptedAt: missions.acceptedAt,
        declinedAt: missions.declinedAt,
        declinedReason: missions.declinedReason,
        startedAt: missions.startedAt,
        completedAt: missions.completedAt,
        scheduledDate: transportRequests.requestedDatetime,
        scheduledTime: sql<string>`TO_CHAR(${transportRequests.requestedDatetime}, 'HH24:MI')`.as('scheduledTime'),
        pickupLocation: transportRequests.pickupAddress,
        dropoffLocation: transportRequests.dropoffAddress,
      })
      .from(missions)
      .innerJoin(transportRequests, eq(missions.transportRequestId, transportRequests.id))
      .where(eq(missions.driverId, driverId))
      .orderBy(sql`${transportRequests.requestedDatetime} DESC`);

    return { success: true, missions: result };
  } catch (error) {
    console.error('Error fetching driver missions:', error);
    return { success: false, error: 'Erreur lors de la récupération des missions du chauffeur', missions: [] };
  }
}
