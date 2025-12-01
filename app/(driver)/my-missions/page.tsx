'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Play, Calendar, MapPin, User, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getMyMissions, updateMissionStatus } from '@/lib/actions/missions';
import type { missions, transportRequests } from '@/lib/db/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type MissionStatus = 'PROPOSED' | 'ACCEPTED' | 'DECLINED' | 'IN_PROGRESS' | 'COMPLETED';

interface MissionWithRequest {
  mission: typeof missions.$inferSelect;
  transportRequest: typeof transportRequests.$inferSelect;
}

const STATUS_LABELS: Record<MissionStatus, string> = {
  PROPOSED: 'Proposée',
  ACCEPTED: 'Acceptée',
  DECLINED: 'Refusée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
};

const STATUS_COLORS: Record<MissionStatus, string> = {
  PROPOSED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-300',
  DECLINED: 'bg-red-100 text-red-800 border-red-300',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-300',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300',
};

export default function MyMissionsPage() {
  const [missions, setMissions] = useState<MissionWithRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<MissionWithRequest | null>(null);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    setIsLoading(true);
    try {
      const result = await getMyMissions();

      if (result.success) {
        setMissions(result.missions);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des missions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (mission: MissionWithRequest) => {
    setIsUpdating(true);
    try {
      const result = await updateMissionStatus({
        missionId: mission.mission.id,
        status: 'ACCEPTED',
      });

      if (result.success) {
        toast.success('Mission acceptée');
        loadMissions();
      } else {
        toast.error(result.error || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecline = (mission: MissionWithRequest) => {
    setSelectedMission(mission);
    setDeclineReason('');
    setShowDeclineDialog(true);
  };

  const confirmDecline = async () => {
    if (!selectedMission) return;

    if (!declineReason.trim()) {
      toast.error('Veuillez indiquer une raison');
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateMissionStatus({
        missionId: selectedMission.mission.id,
        status: 'DECLINED',
        declinedReason: declineReason,
      });

      if (result.success) {
        toast.success('Mission refusée');
        setShowDeclineDialog(false);
        loadMissions();
      } else {
        toast.error(result.error || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors du refus');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStart = async (mission: MissionWithRequest) => {
    setIsUpdating(true);
    try {
      const result = await updateMissionStatus({
        missionId: mission.mission.id,
        status: 'IN_PROGRESS',
      });

      if (result.success) {
        toast.success('Mission démarrée');
        loadMissions();
      } else {
        toast.error(result.error || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors du démarrage');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleComplete = async (mission: MissionWithRequest) => {
    setIsUpdating(true);
    try {
      const result = await updateMissionStatus({
        missionId: mission.mission.id,
        status: 'COMPLETED',
      });

      if (result.success) {
        toast.success('Mission terminée');
        loadMissions();
      } else {
        toast.error(result.error || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de la finalisation');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRequestLabel = (request: typeof transportRequests.$inferSelect) => {
    if (request.artistName) return request.artistName;
    if (request.guestName) return request.guestName;
    return 'Transport générique';
  };

  const proposedMissions = missions.filter(m => m.mission.status === 'PROPOSED');
  const acceptedMissions = missions.filter(m => m.mission.status === 'ACCEPTED');
  const inProgressMissions = missions.filter(m => m.mission.status === 'IN_PROGRESS');
  const completedMissions = missions.filter(m => m.mission.status === 'COMPLETED');
  const declinedMissions = missions.filter(m => m.mission.status === 'DECLINED');

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Mes Missions
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos missions et transports
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{proposedMissions.length}</div>
          <div className="text-sm text-muted-foreground">Proposées</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{acceptedMissions.length}</div>
          <div className="text-sm text-muted-foreground">Acceptées</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">{inProgressMissions.length}</div>
          <div className="text-sm text-muted-foreground">En cours</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{completedMissions.length}</div>
          <div className="text-sm text-muted-foreground">Terminées</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{declinedMissions.length}</div>
          <div className="text-sm text-muted-foreground">Refusées</div>
        </Card>
      </div>

      {missions.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-semibold">Aucune mission</p>
            <p className="text-sm mt-2">
              Vous n'avez pas encore de missions affectées.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Proposed Missions */}
          {proposedMissions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Missions proposées - Action requise
              </h2>
              <div className="space-y-3">
                {proposedMissions.map((item) => (
                  <Card key={item.mission.id} className="p-6 border-2 border-yellow-200 bg-yellow-50">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {getRequestLabel(item.transportRequest)}
                            </h3>
                            <Badge className={STATUS_COLORS[item.mission.status as MissionStatus]}>
                              {STATUS_LABELS[item.mission.status as MissionStatus]}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Départ</div>
                            <div className="text-muted-foreground">
                              {item.transportRequest.pickupLocation}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Arrivée</div>
                            <div className="text-muted-foreground">
                              {item.transportRequest.dropoffLocation}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(item.transportRequest.requestedDatetime)}</span>
                        </div>
                        {item.transportRequest.passengerCount && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{item.transportRequest.passengerCount} passagers</span>
                          </div>
                        )}
                      </div>

                      {item.transportRequest.notes && (
                        <div className="p-3 bg-white border rounded-lg text-sm">
                          <span className="font-medium">Notes: </span>
                          {item.transportRequest.notes}
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-4 border-t">
                        <Button
                          onClick={() => handleAccept(item)}
                          disabled={isUpdating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Accepter
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDecline(item)}
                          disabled={isUpdating}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Refuser
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Missions */}
          {acceptedMissions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                Missions acceptées
              </h2>
              <div className="space-y-3">
                {acceptedMissions.map((item) => (
                  <Card key={item.mission.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {getRequestLabel(item.transportRequest)}
                            </h3>
                            <Badge className={STATUS_COLORS[item.mission.status as MissionStatus]}>
                              {STATUS_LABELS[item.mission.status as MissionStatus]}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Départ</div>
                            <div className="text-muted-foreground">
                              {item.transportRequest.pickupLocation}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Arrivée</div>
                            <div className="text-muted-foreground">
                              {item.transportRequest.dropoffLocation}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(item.transportRequest.requestedDatetime)}</span>
                        </div>
                        {item.transportRequest.passengerCount && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{item.transportRequest.passengerCount} passagers</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t">
                        <Button
                          onClick={() => handleStart(item)}
                          disabled={isUpdating}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Démarrer la mission
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* In Progress Missions */}
          {inProgressMissions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Play className="h-5 w-5 text-purple-600" />
                Missions en cours
              </h2>
              <div className="space-y-3">
                {inProgressMissions.map((item) => (
                  <Card key={item.mission.id} className="p-6 border-2 border-purple-200">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {getRequestLabel(item.transportRequest)}
                            </h3>
                            <Badge className={STATUS_COLORS[item.mission.status as MissionStatus]}>
                              {STATUS_LABELS[item.mission.status as MissionStatus]}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Départ</div>
                            <div className="text-muted-foreground">
                              {item.transportRequest.pickupLocation}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Arrivée</div>
                            <div className="text-muted-foreground">
                              {item.transportRequest.dropoffLocation}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(item.transportRequest.requestedDatetime)}</span>
                        </div>
                        {item.transportRequest.passengerCount && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{item.transportRequest.passengerCount} passagers</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t">
                        <Button
                          onClick={() => handleComplete(item)}
                          disabled={isUpdating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Terminer la mission
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Missions */}
          {completedMissions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Missions terminées
              </h2>
              <div className="space-y-3">
                {completedMissions.map((item) => (
                  <Card key={item.mission.id} className="p-6 bg-green-50">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {getRequestLabel(item.transportRequest)}
                            </h3>
                            <Badge className={STATUS_COLORS[item.mission.status as MissionStatus]}>
                              {STATUS_LABELS[item.mission.status as MissionStatus]}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Départ</div>
                            <div className="text-muted-foreground">
                              {item.transportRequest.pickupLocation}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Arrivée</div>
                            <div className="text-muted-foreground">
                              {item.transportRequest.dropoffLocation}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(item.transportRequest.requestedDatetime)}</span>
                        </div>
                        {item.mission.completedAt && (
                          <div className="text-green-700 font-medium">
                            Terminée le {formatDateTime(item.mission.completedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la mission</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du refus de cette mission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Raison du refus</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Indisponible à cette date, problème de santé, autre engagement..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeclineDialog(false)}
              disabled={isUpdating}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDecline}
              disabled={isUpdating || !declineReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUpdating ? 'Refus en cours...' : 'Confirmer le refus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
