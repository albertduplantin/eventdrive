/**
 * Algorithme d'affectation automatique des chauffeurs
 *
 * Calcule un score pour chaque chauffeur disponible basé sur plusieurs critères :
 * - Disponibilité (100 points)
 * - Proximité géographique (0-50 points)
 * - Charge de travail (-10 points par mission)
 * - Préférences du chauffeur (20 points si correspondance)
 * - Taux de complétion (0-30 points)
 */

import { db } from '@/lib/db';
import { users, driverAvailabilities, missions, transportRequests } from '@/lib/db/schema';
import { eq, and, or, sql, gte, lte } from 'drizzle-orm';
import type { TransportType } from '@/types';

interface DriverScore {
  driverId: string;
  driver: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    geocodedLat: string | null;
    geocodedLng: string | null;
    preferences: any;
  };
  score: number;
  breakdown: {
    availability: number;
    proximity: number;
    workload: number;
    preferences: number;
    performance: number;
  };
  reason: string;
  isAvailable: boolean;
  currentMissionCount: number;
  distanceKm?: number;
}

interface AssignmentCriteria {
  transportRequestId: string;
  festivalId: string;
  requestedDatetime: Date;
  transportType: TransportType;
  pickupLat?: string | null;
  pickupLng?: string | null;
  preferDriver?: string; // ID du chauffeur préféré (optionnel)
}

/**
 * Calcule la distance approximative entre deux points géographiques (formule de Haversine)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Détermine le créneau horaire en fonction de l'heure
 */
function getTimeSlot(datetime: Date): 'MORNING' | 'AFTERNOON' | 'EVENING' {
  const hour = datetime.getHours();
  if (hour < 12) return 'MORNING';
  if (hour < 18) return 'AFTERNOON';
  return 'EVENING';
}

/**
 * Calcule le score de proximité géographique (0-50 points)
 */
function calculateProximityScore(distanceKm: number): number {
  if (distanceKm <= 5) return 50;
  if (distanceKm <= 10) return 40;
  if (distanceKm <= 20) return 30;
  if (distanceKm <= 30) return 20;
  if (distanceKm <= 50) return 10;
  return 0;
}

/**
 * Calcule le score de préférence (0-20 points)
 */
function calculatePreferenceScore(
  driverPreferences: any,
  transportType: TransportType
): number {
  if (!driverPreferences?.preferredMissionTypes) return 0;

  const preferredTypes = driverPreferences.preferredMissionTypes as string[];
  return preferredTypes.includes(transportType) ? 20 : 0;
}

/**
 * Calcule le score de performance (0-30 points)
 */
function calculatePerformanceScore(
  completedMissions: number,
  totalMissions: number
): number {
  if (totalMissions === 0) return 15; // Score neutre pour nouveaux chauffeurs

  const completionRate = completedMissions / totalMissions;
  return Math.round(completionRate * 30);
}

/**
 * Suggère les meilleurs chauffeurs pour une demande de transport
 */
export async function suggestDriversForAssignment(
  criteria: AssignmentCriteria
): Promise<DriverScore[]> {
  const {
    festivalId,
    requestedDatetime,
    transportType,
    pickupLat,
    pickupLng,
  } = criteria;

  // 1. Récupérer tous les chauffeurs du festival
  const allDrivers = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.festivalId, festivalId),
        eq(users.role, 'DRIVER')
      )
    );

  if (allDrivers.length === 0) {
    return [];
  }

  // 2. Déterminer le créneau horaire
  const requestDate = new Date(requestedDatetime);
  requestDate.setHours(0, 0, 0, 0);
  const slot = getTimeSlot(requestedDatetime);

  // 3. Récupérer les disponibilités pour cette date et ce créneau
  const availabilities = await db
    .select()
    .from(driverAvailabilities)
    .where(
      and(
        eq(driverAvailabilities.festivalId, festivalId),
        eq(driverAvailabilities.date, requestDate),
        eq(driverAvailabilities.slot, slot),
        eq(driverAvailabilities.isAvailable, true)
      )
    );

  const availableDriverIds = new Set(availabilities.map(a => a.driverId));

  // 4. Récupérer les missions existantes pour cette période
  const requestStart = new Date(requestedDatetime);
  requestStart.setHours(requestStart.getHours() - 2); // Buffer de 2h avant
  const requestEnd = new Date(requestedDatetime);
  requestEnd.setHours(requestEnd.getHours() + 2); // Buffer de 2h après

  const existingMissions = await db
    .select({
      mission: missions,
      request: transportRequests,
    })
    .from(missions)
    .innerJoin(transportRequests, eq(missions.transportRequestId, transportRequests.id))
    .where(
      and(
        eq(transportRequests.festivalId, festivalId),
        gte(transportRequests.requestedDatetime, requestStart),
        lte(transportRequests.requestedDatetime, requestEnd),
        or(
          eq(missions.status, 'ACCEPTED'),
          eq(missions.status, 'IN_PROGRESS'),
          eq(missions.status, 'PROPOSED')
        )
      )
    );

  // Compter les missions par chauffeur
  const missionCountByDriver = new Map<string, number>();
  existingMissions.forEach(({ mission }) => {
    const count = missionCountByDriver.get(mission.driverId) || 0;
    missionCountByDriver.set(mission.driverId, count + 1);
  });

  // 5. Calculer les statistiques de performance pour chaque chauffeur
  const driverStats = await Promise.all(
    allDrivers.map(async (driver) => {
      const [totalMissionsResult, completedMissionsResult] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(missions)
          .where(eq(missions.driverId, driver.id)),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(missions)
          .where(
            and(
              eq(missions.driverId, driver.id),
              eq(missions.status, 'COMPLETED')
            )
          ),
      ]);

      return {
        driverId: driver.id,
        totalMissions: Number(totalMissionsResult[0]?.count || 0),
        completedMissions: Number(completedMissionsResult[0]?.count || 0),
      };
    })
  );

  const statsMap = new Map(driverStats.map(s => [s.driverId, s]));

  // 6. Calculer le score pour chaque chauffeur
  const driverScores: DriverScore[] = allDrivers.map((driver) => {
    const isAvailable = availableDriverIds.has(driver.id);
    const currentMissionCount = missionCountByDriver.get(driver.id) || 0;
    const stats = statsMap.get(driver.id) || { totalMissions: 0, completedMissions: 0 };

    // Scores individuels
    const availabilityScore = isAvailable ? 100 : 0;

    let proximityScore = 0;
    let distanceKm: number | undefined;
    if (isAvailable && pickupLat && pickupLng && driver.geocodedLat && driver.geocodedLng) {
      distanceKm = calculateDistance(
        parseFloat(driver.geocodedLat),
        parseFloat(driver.geocodedLng),
        parseFloat(pickupLat),
        parseFloat(pickupLng)
      );
      proximityScore = calculateProximityScore(distanceKm);
    }

    const workloadScore = -currentMissionCount * 10;
    const preferenceScore = calculatePreferenceScore(driver.preferences, transportType);
    const performanceScore = calculatePerformanceScore(
      stats.completedMissions,
      stats.totalMissions
    );

    // Score total
    const totalScore =
      availabilityScore +
      proximityScore +
      workloadScore +
      preferenceScore +
      performanceScore;

    // Raison lisible
    let reason = '';
    if (!isAvailable) {
      reason = 'Non disponible pour ce créneau';
    } else if (currentMissionCount > 0) {
      reason = `Disponible (${currentMissionCount} mission(s) sur cette période)`;
    } else {
      reason = 'Disponible';
    }

    if (distanceKm !== undefined) {
      reason += ` - ${distanceKm.toFixed(1)} km`;
    }

    return {
      driverId: driver.id,
      driver: {
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        geocodedLat: driver.geocodedLat,
        geocodedLng: driver.geocodedLng,
        preferences: driver.preferences,
      },
      score: totalScore,
      breakdown: {
        availability: availabilityScore,
        proximity: proximityScore,
        workload: workloadScore,
        preferences: preferenceScore,
        performance: performanceScore,
      },
      reason,
      isAvailable,
      currentMissionCount,
      distanceKm,
    };
  });

  // 7. Trier par score décroissant
  driverScores.sort((a, b) => b.score - a.score);

  return driverScores;
}

/**
 * Affecte automatiquement le meilleur chauffeur disponible
 */
export async function autoAssignBestDriver(
  criteria: AssignmentCriteria,
  assignedById: string
): Promise<{
  success: boolean;
  driverId?: string;
  score?: number;
  error?: string;
}> {
  try {
    const suggestions = await suggestDriversForAssignment(criteria);

    if (suggestions.length === 0) {
      return {
        success: false,
        error: 'Aucun chauffeur disponible',
      };
    }

    // Prendre le chauffeur avec le meilleur score et qui est disponible
    const bestDriver = suggestions.find(s => s.isAvailable);

    if (!bestDriver) {
      return {
        success: false,
        error: 'Aucun chauffeur disponible pour ce créneau',
      };
    }

    // Créer la mission
    const [mission] = await db
      .insert(missions)
      .values({
        transportRequestId: criteria.transportRequestId,
        driverId: bestDriver.driverId,
        assignedById,
        assignmentMethod: 'AUTO',
        assignmentScore: String(bestDriver.score),
        status: 'PROPOSED',
      })
      .returning();

    // Mettre à jour le statut de la demande de transport
    await db
      .update(transportRequests)
      .set({ status: 'ASSIGNED', updatedAt: new Date() })
      .where(eq(transportRequests.id, criteria.transportRequestId));

    return {
      success: true,
      driverId: bestDriver.driverId,
      score: bestDriver.score,
    };
  } catch (error) {
    console.error('Error in autoAssignBestDriver:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'affectation automatique',
    };
  }
}

/**
 * Affecte automatiquement plusieurs demandes de transport en optimisant les affectations
 */
export async function autoAssignMultipleRequests(
  requestIds: string[],
  festivalId: string,
  assignedById: string
): Promise<{
  success: boolean;
  assignments: Array<{ requestId: string; driverId: string; score: number }>;
  errors: Array<{ requestId: string; error: string }>;
}> {
  const assignments: Array<{ requestId: string; driverId: string; score: number }> = [];
  const errors: Array<{ requestId: string; error: string }> = [];

  // Récupérer toutes les demandes
  const requests = await db
    .select()
    .from(transportRequests)
    .where(
      and(
        eq(transportRequests.festivalId, festivalId),
        sql`${transportRequests.id} = ANY(${requestIds})`
      )
    );

  // Trier par date/heure pour optimiser l'affectation
  requests.sort((a, b) =>
    new Date(a.requestedDatetime).getTime() - new Date(b.requestedDatetime).getTime()
  );

  // Affecter chaque demande
  for (const request of requests) {
    const result = await autoAssignBestDriver(
      {
        transportRequestId: request.id,
        festivalId: request.festivalId,
        requestedDatetime: request.requestedDatetime,
        transportType: request.type as unknown as TransportType,
        pickupLat: request.pickupLat,
        pickupLng: request.pickupLng,
      },
      assignedById
    );

    if (result.success && result.driverId && result.score !== undefined) {
      assignments.push({
        requestId: request.id,
        driverId: result.driverId,
        score: result.score,
      });
    } else {
      errors.push({
        requestId: request.id,
        error: result.error || 'Erreur inconnue',
      });
    }
  }

  return {
    success: errors.length === 0,
    assignments,
    errors,
  };
}
