'use client';

import { useState, useEffect } from 'react';
import { MapPin, Car, User, Calendar, Clock, Navigation, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getMissions } from '@/lib/actions/missions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
type MissionStatus = 'PROPOSED' | 'ACCEPTED' | 'DECLINED' | 'IN_PROGRESS' | 'COMPLETED';

interface Mission {
  mission: {
    id: string;
    status: MissionStatus;
    acceptedAt: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
  };
  transportRequest: {
    id: string;
    pickupAddress: string;
    dropoffAddress: string;
    requestedDatetime: Date;
    passengerCount: number | null;
  };
  driver: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
}

const STATUS_LABELS: Record<MissionStatus, string> = {
  PROPOSED: 'Proposée',
  ACCEPTED: 'Acceptée',
  DECLINED: 'Refusée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
};

const STATUS_COLORS: Record<MissionStatus, string> = {
  PROPOSED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
  DECLINED: 'bg-red-100 text-red-800 border-red-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function TrackingPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMissions();
    // Refresh every 30 seconds
    const interval = setInterval(loadMissions, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadMissions() {
    setIsLoading(true);
    try {
      const result = await getMissions();
      if (result.success && result.missions) {
        // Filter only active missions (not completed or declined)
        const activeMissions = result.missions.filter(
          (m: Mission) => m.mission.status !== 'COMPLETED' && m.mission.status !== 'DECLINED'
        );
        setMissions(activeMissions as Mission[]);
      }
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getDriverName(driver: Mission['driver']) {
    if (driver.firstName && driver.lastName) {
      return `${driver.firstName} ${driver.lastName}`;
    }
    return driver.email;
  }

  const inProgressMissions = missions.filter(m => m.mission.status === 'IN_PROGRESS');
  const acceptedMissions = missions.filter(m => m.mission.status === 'ACCEPTED');
  const proposedMissions = missions.filter(m => m.mission.status === 'PROPOSED');

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-3">
          <Navigation className="h-8 w-8" />
          Suivi en temps réel
        </h1>
        <p className="text-muted-foreground mt-1">
          Suivez toutes les missions actives en direct
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{inProgressMissions.length}</div>
            <p className="text-xs text-blue-700 mt-1">Missions actives</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900">Acceptées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{acceptedMissions.length}</div>
            <p className="text-xs text-green-700 mt-1">Prêtes à démarrer</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-900">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">{proposedMissions.length}</div>
            <p className="text-xs text-yellow-700 mt-1">En attente de confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Missions en cours */}
      {inProgressMissions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Car className="h-5 w-5" />
            Missions en cours
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inProgressMissions.map((mission) => (
              <Card key={mission.mission.id} className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                          <Car className="h-4 w-4 text-white" />
                        </div>
                        {getDriverName(mission.driver)}
                      </CardTitle>
                      {mission.driver.phone && (
                        <p className="text-sm text-muted-foreground">{mission.driver.phone}</p>
                      )}
                    </div>
                    <Badge className={`${STATUS_COLORS[mission.mission.status]} border-2`}>
                      {STATUS_LABELS[mission.mission.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Itinerary */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Départ</p>
                        <p className="text-sm text-muted-foreground">
                          {mission.transportRequest.pickupAddress}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-red-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Arrivée</p>
                        <p className="text-sm text-muted-foreground">
                          {mission.transportRequest.dropoffAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Time info */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(mission.transportRequest.requestedDatetime), 'dd MMM', {
                        locale: fr,
                      })}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {format(new Date(mission.transportRequest.requestedDatetime), 'HH:mm', {
                        locale: fr,
                      })}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-4 w-4" />
                      {mission.transportRequest.passengerCount || 1} pers.
                    </div>
                  </div>

                  {mission.mission.startedAt && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Démarrée {format(new Date(mission.mission.startedAt), 'à HH:mm', { locale: fr })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Missions acceptées */}
      {acceptedMissions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Missions acceptées
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {acceptedMissions.map((mission) => (
              <Card key={mission.mission.id} className="border-2 border-green-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{getDriverName(mission.driver)}</CardTitle>
                      {mission.driver.phone && (
                        <p className="text-sm text-muted-foreground">{mission.driver.phone}</p>
                      )}
                    </div>
                    <Badge className={`${STATUS_COLORS[mission.mission.status]} border-2`}>
                      {STATUS_LABELS[mission.mission.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-green-600" />
                      <p className="text-sm">{mission.transportRequest.pickupAddress}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-red-600" />
                      <p className="text-sm">{mission.transportRequest.dropoffAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(mission.transportRequest.requestedDatetime), 'dd MMM à HH:mm', {
                        locale: fr,
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Missions proposées */}
      {proposedMissions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            En attente de confirmation
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {proposedMissions.map((mission) => (
              <Card key={mission.mission.id} className="border-2 border-yellow-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{getDriverName(mission.driver)}</CardTitle>
                      {mission.driver.phone && (
                        <p className="text-sm text-muted-foreground">{mission.driver.phone}</p>
                      )}
                    </div>
                    <Badge className={`${STATUS_COLORS[mission.mission.status]} border-2`}>
                      {STATUS_LABELS[mission.mission.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-green-600" />
                      <p className="text-sm">{mission.transportRequest.pickupAddress}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-red-600" />
                      <p className="text-sm">{mission.transportRequest.dropoffAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(mission.transportRequest.requestedDatetime), 'dd MMM à HH:mm', {
                        locale: fr,
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && missions.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Navigation className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune mission active</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Il n&apos;y a actuellement aucune mission en cours. Les nouvelles missions apparaîtront ici
              automatiquement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
