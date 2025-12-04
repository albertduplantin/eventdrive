/**
 * Service d'intégration avec Radar API
 *
 * Radar API est utilisé pour :
 * - Géocoder des adresses (convertir adresse → coordonnées lat/lng)
 * - Calculer des distances et durées entre deux points
 * - Obtenir des informations de routage
 *
 * Plan gratuit : 100,000 requêtes/mois
 * Documentation : https://radar.com/documentation/api
 */

const RADAR_API_KEY = process.env.RADAR_API_KEY;
const RADAR_BASE_URL = 'https://api.radar.io/v1';

export interface RadarGeocodeResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  error?: string;
}

export interface RadarDistanceResult {
  success: boolean;
  distanceMeters?: number;
  distanceKm?: number;
  durationMinutes?: number;
  error?: string;
}

export interface RadarRouteResult {
  success: boolean;
  route?: {
    distanceMeters: number;
    durationMinutes: number;
    geometry: {
      type: string;
      coordinates: number[][];
    };
  };
  error?: string;
}

/**
 * Géocode une adresse en coordonnées lat/lng
 */
export async function geocodeAddress(address: string): Promise<RadarGeocodeResult> {
  if (!RADAR_API_KEY) {
    console.warn('RADAR_API_KEY not configured');
    return {
      success: false,
      error: 'API Radar non configurée',
    };
  }

  try {
    const response = await fetch(
      `${RADAR_BASE_URL}/geocode/forward?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'Authorization': RADAR_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Radar geocode error:', error);
      return {
        success: false,
        error: 'Erreur lors du géocodage',
      };
    }

    const data = await response.json();

    if (!data.addresses || data.addresses.length === 0) {
      return {
        success: false,
        error: 'Adresse non trouvée',
      };
    }

    const firstResult = data.addresses[0];

    return {
      success: true,
      latitude: firstResult.latitude,
      longitude: firstResult.longitude,
      formattedAddress: firstResult.formattedAddress,
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return {
      success: false,
      error: 'Erreur de connexion à l\'API',
    };
  }
}

/**
 * Calcule la distance et la durée entre deux points
 * Utilise le mode "car" par défaut
 */
export async function calculateDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: 'car' | 'foot' | 'bike' = 'car'
): Promise<RadarDistanceResult> {
  if (!RADAR_API_KEY) {
    console.warn('RADAR_API_KEY not configured');
    // Fallback to Haversine formula for distance only
    const distance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
    return {
      success: true,
      distanceKm: distance,
      distanceMeters: distance * 1000,
      // Rough estimation: assume average speed of 50 km/h for car
      durationMinutes: Math.round((distance / 50) * 60),
    };
  }

  try {
    const response = await fetch(
      `${RADAR_BASE_URL}/route/distance`,
      {
        method: 'POST',
        headers: {
          'Authorization': RADAR_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: {
            coordinates: [originLng, originLat], // Radar uses [lng, lat]
          },
          destination: {
            coordinates: [destLng, destLat],
          },
          modes: mode,
          units: 'metric',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Radar distance error:', error);
      // Fallback to Haversine
      const distance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
      return {
        success: true,
        distanceKm: distance,
        distanceMeters: distance * 1000,
        durationMinutes: Math.round((distance / 50) * 60),
      };
    }

    const data = await response.json();

    if (!data.routes || !data.routes[mode]) {
      return {
        success: false,
        error: 'Aucun itinéraire trouvé',
      };
    }

    const route = data.routes[mode];

    return {
      success: true,
      distanceMeters: route.distance.value,
      distanceKm: route.distance.value / 1000,
      durationMinutes: Math.round(route.duration.value / 60),
    };
  } catch (error) {
    console.error('Error calculating distance:', error);
    // Fallback to Haversine
    const distance = calculateHaversineDistance(originLat, originLng, destLat, destLng);
    return {
      success: true,
      distanceKm: distance,
      distanceMeters: distance * 1000,
      durationMinutes: Math.round((distance / 50) * 60),
    };
  }
}

/**
 * Obtient un itinéraire complet avec géométrie
 */
export async function getRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: 'car' | 'foot' | 'bike' = 'car'
): Promise<RadarRouteResult> {
  if (!RADAR_API_KEY) {
    console.warn('RADAR_API_KEY not configured');
    return {
      success: false,
      error: 'API Radar non configurée',
    };
  }

  try {
    const response = await fetch(
      `${RADAR_BASE_URL}/route/directions`,
      {
        method: 'POST',
        headers: {
          'Authorization': RADAR_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: {
            coordinates: [originLng, originLat],
          },
          destination: {
            coordinates: [destLng, destLat],
          },
          mode,
          units: 'metric',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Radar route error:', error);
      return {
        success: false,
        error: 'Erreur lors du calcul de l\'itinéraire',
      };
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return {
        success: false,
        error: 'Aucun itinéraire trouvé',
      };
    }

    const route = data.routes[0];

    return {
      success: true,
      route: {
        distanceMeters: route.distance,
        durationMinutes: Math.round(route.duration / 60),
        geometry: route.geometry,
      },
    };
  } catch (error) {
    console.error('Error getting route:', error);
    return {
      success: false,
      error: 'Erreur de connexion à l\'API',
    };
  }
}

/**
 * Calcule la distance à vol d'oiseau (formule de Haversine)
 * Utilisé comme fallback si l'API Radar n'est pas disponible
 */
function calculateHaversineDistance(
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
 * Batch geocode: géocode plusieurs adresses en une seule requête
 */
export async function batchGeocodeAddresses(
  addresses: string[]
): Promise<RadarGeocodeResult[]> {
  // Radar API ne supporte pas le batch geocoding dans le plan gratuit
  // On fait donc des requêtes séquentielles avec un délai
  const results: RadarGeocodeResult[] = [];

  for (const address of addresses) {
    const result = await geocodeAddress(address);
    results.push(result);

    // Pause de 100ms entre chaque requête pour éviter le rate limiting
    if (addresses.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Valide si une adresse peut être géocodée
 */
export async function validateAddress(address: string): Promise<boolean> {
  const result = await geocodeAddress(address);
  return result.success;
}

/**
 * Reverse geocoding : convertit des coordonnées en adresse
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<RadarGeocodeResult> {
  if (!RADAR_API_KEY) {
    console.warn('RADAR_API_KEY not configured');
    return {
      success: false,
      error: 'API Radar non configurée',
    };
  }

  try {
    const response = await fetch(
      `${RADAR_BASE_URL}/geocode/reverse?coordinates=${latitude},${longitude}`,
      {
        headers: {
          'Authorization': RADAR_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Radar reverse geocode error:', error);
      return {
        success: false,
        error: 'Erreur lors du reverse geocoding',
      };
    }

    const data = await response.json();

    if (!data.addresses || data.addresses.length === 0) {
      return {
        success: false,
        error: 'Adresse non trouvée',
      };
    }

    const firstResult = data.addresses[0];

    return {
      success: true,
      latitude: firstResult.latitude,
      longitude: firstResult.longitude,
      formattedAddress: firstResult.formattedAddress,
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return {
      success: false,
      error: 'Erreur de connexion à l\'API',
    };
  }
}
