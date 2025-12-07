'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, User, Clock, CheckCircle2, XCircle, Play, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getMissions, updateMissionStatus } from '@/lib/actions/missions';
import type { missions, transportRequests } from '@/lib/db/schema';
import { MissionStatus } from '@/types';
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

interface MissionWithDetails {
  mission: typeof missions.$inferSelect;
  transportRequest: typeof transportRequests.$inferSelect;
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
  PROPOSED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-300',
  DECLINED: 'bg-red-100 text-red-800 border-red-300',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-300',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300',
};

export default function MissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const missionId = params.id as string;

  const [mission, setMission] = useState<MissionWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    loadMission();
  }, [missionId]);

  const loadMission = async () => {
    setIsLoading(true);
    try {
      const result = await getMissions({});

      if (result.success) {
        const foundMission = result.missions.find((m) => m.mission.id === missionId);
        if (foundMission) {
          setMission(foundMission);
        } else {
          toast.error('Mission non trouvée');
          router.push('/dashboard/missions');
        }
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de la mission');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (status: MissionStatus, reason?: string) => {
    if (!mission) return;

    setIsUpdating(true);
    try {
      const result = await updateMissionStatus({
        missionId: mission.mission.id,
        status,
        declinedReason: reason,
      });

      if (result.success) {
        toast.success('Statut mis à jour avec succès');
        loadMission();
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecline = () => {
    setDeclineReason('');
    setShowDeclineDialog(true);
  };

  const confirmDecline = async () => {
    if (!declineReason.trim()) {
      toast.error('Veuillez indiquer une raison');
      return;
    }

    await handleStatusUpdate(MissionStatus.DECLINED, declineReason);
    setShowDeclineDialog(false);
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRequestLabel = (request: any) => {
    const typeLabels: Record<string, string> = {
      STATION_TO_VENUE: 'Gare → Site',
      VENUE_TO_STATION: 'Site → Gare',
      INTRA_CITY: 'Intra-ville',
      OTHER: 'Autre',
    };
    return typeLabels[request.type] || 'Transport';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="p-8">
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-semibold">Mission non trouvée</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/dashboard/missions')}
            >
              Retour aux missions
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const canUpdateStatus = mission.mission.status !== 'COMPLETED' && mission.mission.status !== 'DECLINED';

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/dashboard/missions')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-black">
              Détails de la Mission
            </h1>
            <Badge className={STATUS_COLORS[mission.mission.status as MissionStatus]}>
              {STATUS_LABELS[mission.mission.status as MissionStatus]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Mission #{mission.mission.id.slice(0, 8)}
          </p>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transport Details */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Informations du Transport
          </h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Type</div>
              <div className="font-medium">{getRequestLabel(mission.transportRequest)}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-green-600" />
                Départ
              </div>
              <div className="font-medium">{mission.transportRequest.pickupAddress}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-red-600" />
                Arrivée
              </div>
              <div className="font-medium">{mission.transportRequest.dropoffAddress}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date et heure
              </div>
              <div className="font-medium">
                {formatDateTime(mission.transportRequest.requestedDatetime)}
              </div>
            </div>

            {mission.transportRequest.passengerCount && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Nombre de passagers
                </div>
                <div className="font-medium">{mission.transportRequest.passengerCount}</div>
              </div>
            )}

            {mission.transportRequest.notes && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Notes</div>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {mission.transportRequest.notes}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Driver Details */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Chauffeur Affecté
          </h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Nom</div>
              <div className="font-medium">
                {mission.driver.firstName} {mission.driver.lastName}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
              <div className="font-medium">{mission.driver.email}</div>
            </div>

            {mission.driver.phone && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Téléphone</div>
                <div className="font-medium">{mission.driver.phone}</div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Méthode d'affectation
              </div>
              <Badge variant="outline">
                {mission.mission.assignmentMethod === 'AUTO' ? 'Automatique' : 'Manuelle'}
              </Badge>
            </div>

            {mission.mission.assignmentScore && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Score d'affectation
                </div>
                <div className="font-medium">{mission.mission.assignmentScore}</div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Chronologie
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
            <div className="flex-1">
              <div className="font-medium">Mission créée</div>
              <div className="text-sm text-muted-foreground">
                {formatDateTime(mission.mission.createdAt)}
              </div>
            </div>
          </div>

          {mission.mission.acceptedAt && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
              <div className="flex-1">
                <div className="font-medium">Mission acceptée</div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(mission.mission.acceptedAt)}
                </div>
              </div>
            </div>
          )}

          {mission.mission.declinedAt && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-600 mt-2" />
              <div className="flex-1">
                <div className="font-medium">Mission refusée</div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(mission.mission.declinedAt)}
                </div>
                {mission.mission.declinedReason && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                    <span className="font-medium text-red-900">Raison: </span>
                    <span className="text-red-700">{mission.mission.declinedReason}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {mission.mission.startedAt && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
              <div className="flex-1">
                <div className="font-medium">Mission démarrée</div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(mission.mission.startedAt)}
                </div>
              </div>
            </div>
          )}

          {mission.mission.completedAt && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
              <div className="flex-1">
                <div className="font-medium">Mission terminée</div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(mission.mission.completedAt)}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      {canUpdateStatus && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {mission.mission.status === 'PROPOSED' && (
              <>
                <Button
                  onClick={() => handleStatusUpdate(MissionStatus.ACCEPTED)}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accepter la mission
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  disabled={isUpdating}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser la mission
                </Button>
              </>
            )}

            {mission.mission.status === 'ACCEPTED' && (
              <Button
                onClick={() => handleStatusUpdate(MissionStatus.IN_PROGRESS)}
                disabled={isUpdating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Démarrer la mission
              </Button>
            )}

            {mission.mission.status === 'IN_PROGRESS' && (
              <Button
                onClick={() => handleStatusUpdate(MissionStatus.COMPLETED)}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Terminer la mission
              </Button>
            )}
          </div>
        </Card>
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
