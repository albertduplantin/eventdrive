'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { updateDriverLocation } from '@/lib/actions/tracking';
import { toast } from 'sonner';

interface UseDriverLocationOptions {
  missionId: string;
  enabled: boolean;
  updateInterval?: number; // en millisecondes (par défaut: 10000 = 10s)
  highAccuracy?: boolean;
}

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  error: string | null;
  isTracking: boolean;
}

/**
 * Hook pour gérer la géolocalisation du chauffeur en temps réel
 * Émet la position GPS toutes les X secondes vers le serveur
 */
export function useDriverLocation({
  missionId,
  enabled,
  updateInterval = 10000, // 10 secondes par défaut
  highAccuracy = true,
}: UseDriverLocationOptions) {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    error: null,
    isTracking: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);

  // Fonction pour envoyer la position au serveur
  const sendLocationToServer = useCallback(async (position: GeolocationPosition) => {
    try {
      const result = await updateDriverLocation({
        missionId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // Convert m/s to km/h
      });

      if (!result.success) {
        console.error('Failed to update location:', result.error);
      }
    } catch (error) {
      console.error('Error sending location to server:', error);
    }
  }, [missionId]);

  // Callback de succès de géolocalisation
  const onSuccess = useCallback((position: GeolocationPosition) => {
    lastPositionRef.current = position;

    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed ? position.coords.speed * 3.6 : null, // Convert m/s to km/h
      timestamp: position.timestamp,
      error: null,
      isTracking: true,
    });
  }, []);

  // Callback d'erreur de géolocalisation
  const onError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Erreur de géolocalisation';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permission de géolocalisation refusée';
        toast.error('Veuillez autoriser l\'accès à votre position dans les paramètres du navigateur');
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Position non disponible';
        break;
      case error.TIMEOUT:
        errorMessage = 'Délai d\'attente dépassé';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      isTracking: false,
    }));

    console.error('Geolocation error:', errorMessage, error);
  }, []);

  // Démarrer le tracking
  useEffect(() => {
    if (!enabled || !missionId) {
      // Nettoyer si désactivé
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      setState(prev => ({ ...prev, isTracking: false }));
      return;
    }

    // Vérifier le support de la géolocalisation
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'La géolocalisation n\'est pas supportée par votre navigateur',
        isTracking: false,
      }));
      toast.error('Votre navigateur ne supporte pas la géolocalisation');
      return;
    }

    // Options de géolocalisation
    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 10000,
      maximumAge: 0,
    };

    // Démarrer le suivi de position
    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      options
    );

    // Envoyer la position au serveur à intervalle régulier
    intervalIdRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        sendLocationToServer(lastPositionRef.current);
      }
    }, updateInterval);

    // Nettoyage
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [enabled, missionId, highAccuracy, updateInterval, onSuccess, onError, sendLocationToServer]);

  // Fonction pour forcer une mise à jour manuelle
  const forceUpdate = useCallback(() => {
    if (lastPositionRef.current) {
      sendLocationToServer(lastPositionRef.current);
    }
  }, [sendLocationToServer]);

  return {
    ...state,
    forceUpdate,
  };
}
