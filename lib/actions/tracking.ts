'use server';

import { db } from '@/lib/db';
import { realTimeTracking, missions, users, transportRequests } from '@/lib/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

interface LocationUpdate {
  missionId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

/**
 * Met à jour la position GPS du chauffeur pour une mission
 */
export async function updateDriverLocation(data: LocationUpdate) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser || userData.dbUser.role !== 'DRIVER') {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que la mission appartient au chauffeur
    const [mission] = await db
      .select()
      .from(missions)
      .where(
        and(
          eq(missions.id, data.missionId),
          eq(missions.driverId, userData.dbUser.id)
        )
      )
      .limit(1);

    if (!mission) {
      return { success: false, error: 'Mission non trouvée' };
    }

    // Vérifier que la mission est en cours
    if (mission.status !== 'ACCEPTED' && mission.status !== 'IN_PROGRESS') {
      return { success: false, error: 'La mission n\'est pas active' };
    }

    // Insérer la position
    await db.insert(realTimeTracking).values({
      missionId: data.missionId,
      driverId: userData.dbUser.id,
      lat: String(data.latitude),
      lng: String(data.longitude),
      accuracy: data.accuracy ? String(data.accuracy) : null,
      heading: data.heading ? String(data.heading) : null,
      speed: data.speed ? String(data.speed) : null,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating driver location:', error);
    return { success: false, error: 'Erreur lors de la mise à jour de la position' };
  }
}

/**
 * Récupère la dernière position connue d'un chauffeur pour une mission
 */
export async function getDriverLocation(missionId: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé', location: null };
    }

    // Récupérer la mission avec détails
    const [missionData] = await db
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
      .where(eq(missions.id, missionId))
      .limit(1);

    if (!missionData) {
      return { success: false, error: 'Mission non trouvée', location: null };
    }

    // Vérifier les permissions
    const isDriver = userData.dbUser.role === 'DRIVER' && missionData.mission.driverId === userData.dbUser.id;
    const isVIP = userData.dbUser.role === 'VIP' && missionData.transportRequest.vipId === userData.dbUser.id;
    const isCoordinator = ['FESTIVAL_ADMIN', 'GENERAL_COORDINATOR', 'DRIVER_MANAGER'].includes(userData.dbUser.role);

    if (!isDriver && !isVIP && !isCoordinator) {
      // Vérifier que le festival correspond
      if (missionData.transportRequest.festivalId !== userData.dbUser.festivalId) {
        return { success: false, error: 'Non autorisé', location: null };
      }
    }

    // Récupérer la dernière position (moins de 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [lastLocation] = await db
      .select()
      .from(realTimeTracking)
      .where(
        and(
          eq(realTimeTracking.missionId, missionId),
          gte(realTimeTracking.timestamp, fiveMinutesAgo)
        )
      )
      .orderBy(desc(realTimeTracking.timestamp))
      .limit(1);

    return {
      success: true,
      location: lastLocation,
      mission: missionData.mission,
      transportRequest: missionData.transportRequest,
      driver: missionData.driver,
    };
  } catch (error) {
    console.error('Error getting driver location:', error);
    return {
      success: false,
      error: 'Erreur lors de la récupération de la position',
      location: null,
    };
  }
}

/**
 * Récupère l'historique des positions pour une mission
 */
export async function getLocationHistory(missionId: string, limit: number = 100) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé', history: [] };
    }

    // Vérifier que la mission existe et appartient au même festival
    const [mission] = await db
      .select({
        mission: missions,
        request: transportRequests,
      })
      .from(missions)
      .innerJoin(transportRequests, eq(missions.transportRequestId, transportRequests.id))
      .where(eq(missions.id, missionId))
      .limit(1);

    if (!mission) {
      return { success: false, error: 'Mission non trouvée', history: [] };
    }

    if (mission.request.festivalId !== userData.dbUser.festivalId) {
      return { success: false, error: 'Non autorisé', history: [] };
    }

    // Récupérer l'historique
    const history = await db
      .select()
      .from(realTimeTracking)
      .where(eq(realTimeTracking.missionId, missionId))
      .orderBy(desc(realTimeTracking.timestamp))
      .limit(limit);

    return { success: true, history };
  } catch (error) {
    console.error('Error getting location history:', error);
    return { success: false, error: 'Erreur lors de la récupération de l\'historique', history: [] };
  }
}

/**
 * Calcule la distance entre deux points GPS (formule de Haversine)
 */
export function calculateDistance(
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
 * Estime le temps d'arrivée (ETA) en fonction de la distance et de la vitesse moyenne
 */
export function estimateETA(distanceKm: number, averageSpeedKmH: number = 30): number {
  // Retourne le temps en minutes
  return Math.ceil((distanceKm / averageSpeedKmH) * 60);
}

/**
 * Formate l'ETA en texte lisible
 */
export function formatETA(minutes: number): string {
  if (minutes < 1) return 'Arrivée imminente';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) return hours === 1 ? '1 heure' : `${hours} heures`;
  return hours === 1
    ? `1h ${mins}min`
    : `${hours}h ${mins}min`;
}
