/**
 * Utilitaires pour le calcul de distance et ETA
 * Ces fonctions sont des utilitaires purs qui n'ont pas besoin d'être des Server Actions
 */

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
  return hours === 1 ? `1h ${mins}min` : `${hours}h ${mins}min`;
}
