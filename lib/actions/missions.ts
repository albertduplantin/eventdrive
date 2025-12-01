'use server';

import { db } from '@/lib/db';
import { missions, transportRequests, users, driverAvailabilities } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

type MissionStatus = 'PROPOSED' | 'ACCEPTED' | 'DECLINED' | 'IN_PROGRESS' | 'COMPLETED';
type AssignmentMethod = 'AUTO' | 'MANUAL';

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

    // Déterminer le créneau horaire
    const requestDate = new Date(request.requestedDatetime);
    requestDate.setHours(0, 0, 0, 0);
    const requestHour = new Date(request.requestedDatetime).getHours();

    let slot: 'MORNING' | 'AFTERNOON' | 'EVENING' = 'MORNING';
    if (requestHour >= 12 && requestHour < 18) {
      slot = 'AFTERNOON';
    } else if (requestHour >= 18) {
      slot = 'EVENING';
    }

    // Récupérer tous les chauffeurs du festival
    const drivers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.festivalId, userData.dbUser.festivalId),
          eq(users.role, 'DRIVER')
        )
      );

    // Récupérer les disponibilités pour cette date et ce créneau
    const availabilities = await db
      .select()
      .from(driverAvailabilities)
      .where(
        and(
          eq(driverAvailabilities.date, requestDate),
          eq(driverAvailabilities.slot, slot),
          eq(driverAvailabilities.isAvailable, true)
        )
      );

    // Récupérer les missions existantes pour cette période
    const existingMissions = await db
      .select({
        mission: missions,
        request: transportRequests,
      })
      .from(missions)
      .innerJoin(transportRequests, eq(missions.transportRequestId, transportRequests.id))
      .where(
        and(
          sql`DATE(${transportRequests.requestedDatetime}) = ${requestDate.toISOString().split('T')[0]}`,
          or(
            eq(missions.status, 'ACCEPTED'),
            eq(missions.status, 'IN_PROGRESS'),
            eq(missions.status, 'PROPOSED')
          )
        )
      );

    // Calculer un score pour chaque chauffeur
    const suggestions = drivers.map((driver) => {
      let score = 0;
      let reason = '';

      // Vérifier la disponibilité
      const isAvailable = availabilities.some((a) => a.driverId === driver.id);
      if (isAvailable) {
        score += 100;
        reason = 'Disponible';
      } else {
        reason = 'Non disponible';
      }

      // Vérifier les missions existantes
      const driverMissions = existingMissions.filter((m) => m.mission.driverId === driver.id);
      score -= driverMissions.length * 10; // Pénalité pour chaque mission

      return {
        driver,
        score,
        reason,
        isAvailable,
        missionCount: driverMissions.length,
      };
    });

    // Trier par score décroissant
    suggestions.sort((a, b) => b.score - a.score);

    return { success: true, suggestions };
  } catch (error) {
    console.error('Error suggesting drivers:', error);
    return { success: false, error: 'Erreur lors de la suggestion de chauffeurs', suggestions: [] };
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
