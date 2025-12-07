'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Navigation, Activity, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useDriverLocation } from '@/hooks/use-driver-location';
import { toast } from 'sonner';

export default function DriverTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = params.id as string;

  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [hasShownSuccessToast, setHasShownSuccessToast] = useState(false);

  const {
    latitude,
    longitude,
    accuracy,
    speed,
    error,
    isTracking,
    forceUpdate,
  } = useDriverLocation({
    missionId,
    enabled: trackingEnabled,
    updateInterval: 10000, // 10 secondes
    highAccuracy: true,
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
      setTrackingEnabled(false);
    }
  }, [error]);

  useEffect(() => {
    if (trackingEnabled && isTracking && !hasShownSuccessToast) {
      toast.success('Suivi GPS activé avec succès');
      setHasShownSuccessToast(true);
    }
  }, [trackingEnabled, isTracking, hasShownSuccessToast]);

  const handleToggleTracking = (checked: boolean) => {
    setTrackingEnabled(checked);
    if (!checked) {
      setHasShownSuccessToast(false);
      toast.info('Suivi GPS désactivé');
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/my-missions')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Suivi GPS de la Mission
          </h1>
          <p className="text-muted-foreground mt-1">
            Activez le suivi pour que le VIP puisse voir votre position
          </p>
        </div>
      </div>

      {/* Control Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="tracking-switch" className="text-lg font-semibold">
                Activer le suivi GPS
              </Label>
              <p className="text-sm text-muted-foreground">
                Votre position sera visible par le VIP et les coordinateurs
              </p>
            </div>
            <Switch
              id="tracking-switch"
              checked={trackingEnabled}
              onCheckedChange={handleToggleTracking}
            />
          </div>

          {trackingEnabled && (
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center gap-2">
                <Activity
                  className={`h-5 w-5 ${isTracking ? 'text-green-600 animate-pulse' : 'text-gray-400'}`}
                />
                <span className="font-medium">
                  {isTracking ? 'Suivi actif' : 'Connexion au GPS...'}
                </span>
                {isTracking && (
                  <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-300">
                    Position mise à jour toutes les 10s
                  </Badge>
                )}
              </div>

              {latitude && longitude && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Latitude</div>
                    <div className="font-mono font-semibold">{latitude.toFixed(6)}°</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Longitude</div>
                    <div className="font-mono font-semibold">{longitude.toFixed(6)}°</div>
                  </div>
                  {accuracy && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Précision</div>
                      <div className="font-semibold">
                        {Math.round(accuracy)}m
                        {accuracy < 10 && (
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-300 text-xs">
                            Excellente
                          </Badge>
                        )}
                        {accuracy >= 10 && accuracy < 50 && (
                          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-300 text-xs">
                            Bonne
                          </Badge>
                        )}
                        {accuracy >= 50 && (
                          <Badge variant="outline" className="ml-2 bg-orange-50 text-orange-700 border-orange-300 text-xs">
                            Moyenne
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {speed !== null && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Vitesse</div>
                      <div className="font-semibold">{Math.round(speed)} km/h</div>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={forceUpdate}
                variant="outline"
                className="w-full mt-4"
                disabled={!isTracking}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Forcer la mise à jour immédiate
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Conseils pour un suivi optimal</h3>
            <ul className="text-sm text-blue-700 mt-2 space-y-1.5 list-disc list-inside">
              <li>Gardez votre téléphone allumé pendant toute la mission</li>
              <li>Assurez-vous que le GPS est activé dans les paramètres de votre appareil</li>
              <li>Évitez de fermer complètement l'application</li>
              <li>Le suivi consomme de la batterie - pensez à recharger si nécessaire</li>
              <li>La précision est meilleure en extérieur qu'en intérieur</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Permission Card */}
      {!trackingEnabled && (
        <Card className="p-6 bg-orange-50 border-orange-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900">Autorisations requises</h3>
              <p className="text-sm text-orange-700 mt-1">
                Lorsque vous activez le suivi, votre navigateur vous demandera l'autorisation d'accéder à votre position.
                Vous devez <strong>autoriser</strong> cette demande pour que le suivi fonctionne.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
