'use client';

import { useState, useEffect } from 'react';
import { Car, MapPin, Calendar, User, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { suggestDrivers, createMission } from '@/lib/actions/missions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { TransportRequestWithRelations, AssignmentMethod } from '@/types';

interface AssignDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transportRequest: TransportRequestWithRelations | null;
  onSuccess?: () => void;
}

interface DriverSuggestion {
  driver: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
  score: number;
  reason: string;
  isAvailable: boolean;
  missionCount: number;
  distanceKm: number | null;
  breakdown?: {
    availability: number;
    equity: number;
    proximity: number;
    preference: number;
    continuity: number;
  };
}

export function AssignDriverDialog({
  open,
  onOpenChange,
  transportRequest,
  onSuccess,
}: AssignDriverDialogProps) {
  const [suggestions, setSuggestions] = useState<DriverSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  useEffect(() => {
    if (open && transportRequest) {
      loadSuggestions();
    }
  }, [open, transportRequest]);

  async function loadSuggestions() {
    if (!transportRequest) return;

    setIsLoading(true);
    try {
      const result = await suggestDrivers(transportRequest.id);
      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions as DriverSuggestion[]);
        // Auto-select best driver
        if (result.suggestions.length > 0) {
          setSelectedDriverId(result.suggestions[0].driver.id);
        }
      } else {
        toast.error(result.error || 'Erreur lors de la récupération des suggestions');
      }
    } catch (error) {
      toast.error('Erreur lors de la récupération des suggestions');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAssign() {
    if (!selectedDriverId || !transportRequest) return;

    setIsAssigning(true);
    try {
      const selectedSuggestion = suggestions.find(s => s.driver.id === selectedDriverId);

      const result = await createMission({
        transportRequestId: transportRequest.id,
        driverId: selectedDriverId,
        assignmentMethod: 'MANUAL' as AssignmentMethod,
        assignmentScore: selectedSuggestion?.score,
      });

      if (result.success) {
        toast.success('Chauffeur affecté avec succès', {
          description: 'Le chauffeur a été notifié par email',
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erreur lors de l\'affectation');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'affectation');
    } finally {
      setIsAssigning(false);
    }
  }

  function getDriverName(driver: DriverSuggestion['driver']) {
    if (driver.firstName && driver.lastName) {
      return `${driver.firstName} ${driver.lastName}`;
    }
    return driver.email;
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-700 bg-green-100 border-green-200';
    if (score >= 60) return 'text-blue-700 bg-blue-100 border-blue-200';
    if (score >= 40) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    return 'text-orange-700 bg-orange-100 border-orange-200';
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Car className="h-6 w-6" />
            Affecter un chauffeur
          </DialogTitle>
          {transportRequest && (
            <DialogDescription className="text-base mt-2">
              <div className="space-y-2 text-black dark:text-white">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {transportRequest.vip
                      ? `${transportRequest.vip.firstName} ${transportRequest.vip.lastName}`
                      : 'VIP supprimé'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    {transportRequest.pickupAddress} → {transportRequest.dropoffAddress}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {format(new Date(transportRequest.requestedDatetime), 'dd MMMM yyyy à HH:mm', {
                      locale: fr,
                    })}
                  </span>
                </div>
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* No suggestions */}
          {!isLoading && suggestions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun chauffeur disponible trouvé</p>
              <p className="text-sm mt-2">
                Vérifiez les disponibilités des chauffeurs ou créez de nouvelles disponibilités
              </p>
            </div>
          )}

          {/* Driver suggestions list */}
          {!isLoading && suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Chauffeurs suggérés</h3>
                <Badge variant="outline" className="text-xs">
                  {suggestions.length} disponible{suggestions.length > 1 ? 's' : ''}
                </Badge>
              </div>

              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.driver.id}
                  onClick={() => setSelectedDriverId(suggestion.driver.id)}
                  className={`
                    relative cursor-pointer rounded-lg border-2 p-4 transition-all
                    ${
                      selectedDriverId === suggestion.driver.id
                        ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                        : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
                    }
                  `}
                >
                  {/* Best match badge */}
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Meilleur choix
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Driver info */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black dark:bg-white">
                          <User className="h-5 w-5 text-white dark:text-black" />
                        </div>
                        <div>
                          <p className="font-semibold">{getDriverName(suggestion.driver)}</p>
                          {suggestion.driver.phone && (
                            <p className="text-xs text-muted-foreground">{suggestion.driver.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Score and reason */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`px-3 py-1 rounded-full border-2 font-semibold text-sm ${getScoreColor(suggestion.score)}`}>
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          {suggestion.score.toFixed(0)}%
                        </div>
                        {suggestion.distanceKm !== null && suggestion.distanceKm !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {suggestion.distanceKm.toFixed(1)} km
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {suggestion.missionCount} mission{suggestion.missionCount > 1 ? 's' : ''}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">{suggestion.reason}</p>

                      {/* Score breakdown */}
                      {suggestion.breakdown && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Disponibilité:</span>
                            <span className="font-medium">{suggestion.breakdown.availability}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Équité:</span>
                            <span className="font-medium">{suggestion.breakdown.equity}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Proximité:</span>
                            <span className="font-medium">{suggestion.breakdown.proximity}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Historique:</span>
                            <span className="font-medium">{suggestion.breakdown.continuity}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selection indicator */}
                    {selectedDriverId === suggestion.driver.id && (
                      <div className="flex-shrink-0">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black dark:bg-white">
                          <CheckCircle className="h-4 w-4 text-white dark:text-black" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning}>
            Annuler
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedDriverId || isAssigning}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Affectation...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Affecter ce chauffeur
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
