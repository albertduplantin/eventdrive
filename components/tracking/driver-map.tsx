'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getDriverLocation } from '@/lib/actions/tracking';
import { calculateDistance, estimateETA, formatETA } from '@/lib/tracking-utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Navigation, Loader2 } from 'lucide-react';

// Import Leaflet dynamiquement pour éviter les erreurs SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

interface DriverMapProps {
  missionId: string;
  refreshInterval?: number; // en millisecondes
}

export function DriverMap({ missionId, refreshInterval = 10000 }: DriverMapProps) {
  const [location, setLocation] = useState<any>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [driverName, setDriverName] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Charger la position initiale et la destination
  useEffect(() => {
    loadLocation();
    const interval = setInterval(loadLocation, refreshInterval);
    return () => clearInterval(interval);
  }, [missionId, refreshInterval]);

  const loadLocation = async () => {
    try {
      const result = await getDriverLocation(missionId);

      if (result.success && result.location) {
        const locationData = {
          lat: parseFloat(result.location.lat),
          lng: parseFloat(result.location.lng),
          accuracy: result.location.accuracy ? parseFloat(result.location.accuracy) : null,
          heading: result.location.heading ? parseFloat(result.location.heading) : null,
          speed: result.location.speed ? parseFloat(result.location.speed) : null,
          timestamp: result.location.timestamp,
        };

        setLocation(locationData);
        setLastUpdate(new Date());

        // Nom du chauffeur
        if (result.driver) {
          const name = `${result.driver.firstName || ''} ${result.driver.lastName || ''}`.trim() || result.driver.email;
          setDriverName(name);
        }

        // Destination = pickup location
        if (result.transportRequest) {
          const pickupLat = result.transportRequest.pickupLat ? parseFloat(result.transportRequest.pickupLat) : 0;
          const pickupLng = result.transportRequest.pickupLng ? parseFloat(result.transportRequest.pickupLng) : 0;

          if (pickupLat !== 0 && pickupLng !== 0) {
            setDestination({ lat: pickupLat, lng: pickupLng });

            // Calculer distance et ETA
            const dist = calculateDistance(
              locationData.lat,
              locationData.lng,
              pickupLat,
              pickupLng
            );
            setDistance(dist);

            const etaMinutes = estimateETA(dist);
            setEta(formatETA(etaMinutes));
          }
        }

        setIsLoading(false);
      } else if (result.error) {
        console.error('Error loading location:', result.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading location:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Chargement de la carte...</p>
        </div>
      </Card>
    );
  }

  if (!location) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <div>
            <p className="font-semibold text-lg">Position du chauffeur non disponible</p>
            <p className="text-sm text-muted-foreground mt-2">
              Le chauffeur n'a pas encore activé le suivi GPS ou sa position n'a pas été mise à jour récemment.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const center: [number, number] = [location.lat, location.lng];

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Temps d'arrivée estimé</div>
                <div className="font-semibold text-xl text-blue-600">{eta || 'Calcul...'}</div>
              </div>
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">Distance</div>
                <div className="font-semibold">{distance.toFixed(1)} km</div>
              </div>
            </div>
            {location.speed !== null && location.speed > 0 && (
              <>
                <div className="h-8 w-px bg-border hidden md:block" />
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Vitesse</div>
                    <Badge variant="outline" className="mt-1">
                      {Math.round(location.speed)} km/h
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </div>
          {driverName && (
            <div className="text-sm">
              <span className="text-muted-foreground">Chauffeur: </span>
              <span className="font-medium">{driverName}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Map */}
      <div className="h-[500px] w-full rounded-lg overflow-hidden border shadow-lg">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marqueur Chauffeur */}
          <Marker position={center}>
            <Popup>
              <div className="text-center">
                <strong>{driverName || 'Votre chauffeur'}</strong>
                <br />
                {eta && <span>Arrivée dans {eta}</span>}
                {location.speed !== null && location.speed > 0 && (
                  <>
                    <br />
                    <span className="text-xs">Vitesse: {Math.round(location.speed)} km/h</span>
                  </>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Marqueur Destination */}
          {destination && (
            <Marker position={[destination.lat, destination.lng]}>
              <Popup>
                <strong>Point de rendez-vous</strong>
              </Popup>
            </Marker>
          )}

          {/* Ligne entre chauffeur et destination */}
          {destination && (
            <Polyline
              positions={[
                center,
                [destination.lat, destination.lng],
              ]}
              color="#3b82f6"
              weight={3}
              opacity={0.6}
              dashArray="10, 10"
            />
          )}
        </MapContainer>
      </div>

      {/* Dernière mise à jour */}
      <div className="text-xs text-muted-foreground text-center">
        Dernière mise à jour :{' '}
        {lastUpdate
          ? lastUpdate.toLocaleString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : 'Inconnue'}
        {' • Actualisation automatique toutes les 10 secondes'}
      </div>
    </div>
  );
}
