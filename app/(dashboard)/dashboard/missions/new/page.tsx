'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Sparkles, User, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getTransportRequests } from '@/lib/actions/transports';
import { suggestDrivers, createMission } from '@/lib/actions/missions';
import type { transportRequests, users } from '@/lib/db/schema';
import { RequestStatus, AssignmentMethod } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  distanceKm?: number;
  breakdown?: {
    availability: number;
    proximity: number;
    workload: number;
    preferences: number;
    performance: number;
  };
}

export default function NewMissionPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Array<typeof transportRequests.$inferSelect>>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [suggestions, setSuggestions] = useState<DriverSuggestion[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (selectedRequestId) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setSelectedDriverId('');
    }
  }, [selectedRequestId]);

  const loadRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const result = await getTransportRequests({
        status: RequestStatus.PENDING,
      });

      if (result.success && result.requests) {
        setRequests(result.requests);
      } else {
        toast.error(result.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setSuggestions([]);
    setSelectedDriverId('');
    try {
      const result = await suggestDrivers(selectedRequestId);

      if (result.success) {
        setSuggestions(result.suggestions);
        // Auto-select the best driver if available
        if (result.suggestions.length > 0 && result.suggestions[0].isAvailable) {
          setSelectedDriverId(result.suggestions[0].driver.id);
        }
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Erreur lors de la suggestion de chauffeurs');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleCreateMission = async () => {
    if (!selectedRequestId || !selectedDriverId) {
      toast.error('Veuillez sélectionner une demande et un chauffeur');
      return;
    }

    setIsCreating(true);
    try {
      const selectedSuggestion = suggestions.find(s => s.driver.id === selectedDriverId);

      const result = await createMission({
        transportRequestId: selectedRequestId,
        driverId: selectedDriverId,
        assignmentMethod: AssignmentMethod.MANUAL,
        assignmentScore: selectedSuggestion?.score,
      });

      if (result.success) {
        toast.success('Mission créée avec succès');
        router.push('/dashboard/missions');
      } else {
        toast.error(result.error || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création de la mission');
    } finally {
      setIsCreating(false);
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

  const getRequestLabel = (request: any) => {
    // If request has vip data (from join)
    if (request.vip) {
      return `${request.vip.firstName} ${request.vip.lastName}`;
    }
    // Fallback to type description
    const typeLabels: Record<string, string> = {
      STATION_TO_VENUE: 'Gare → Site',
      VENUE_TO_STATION: 'Site → Gare',
      INTRA_CITY: 'Intra-ville',
      OTHER: 'Autre',
    };
    return typeLabels[request.type] || 'Transport';
  };

  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  if (isLoadingRequests) {
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
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/dashboard/missions')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Nouvelle Affectation
          </h1>
          <p className="text-muted-foreground mt-1">
            Affectez un chauffeur à une demande de transport
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-semibold">Aucune demande en attente</p>
            <p className="text-sm mt-2">
              Toutes les demandes ont déjà été affectées ou il n'y a pas encore de demandes.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/dashboard/transports')}
            >
              Voir toutes les demandes
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Step 1: Select Transport Request */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className="text-xl font-semibold">Sélectionnez une demande de transport</h2>
              </div>

              <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une demande..." />
                </SelectTrigger>
                <SelectContent>
                  {requests.map((request) => (
                    <SelectItem key={request.id} value={request.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getRequestLabel(request)}</span>
                        <span className="text-muted-foreground text-sm">
                          - {formatDateTime(request.requestedDatetime)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedRequest && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="font-semibold text-blue-900">
                    {getRequestLabel(selectedRequest)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Départ</div>
                        <div className="text-muted-foreground">{selectedRequest.pickupAddress}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Arrivée</div>
                        <div className="text-muted-foreground">{selectedRequest.dropoffAddress}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateTime(selectedRequest.requestedDatetime)}</span>
                    </div>
                    {selectedRequest.passengerCount && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{selectedRequest.passengerCount} passagers</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Step 2: Select Driver */}
          {selectedRequestId && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <h2 className="text-xl font-semibold">Choisissez un chauffeur</h2>
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                </div>

                {isLoadingSuggestions ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Recherche des meilleurs chauffeurs disponibles...</p>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun chauffeur disponible pour cette période</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.driver.id}
                        onClick={() => setSelectedDriverId(suggestion.driver.id)}
                        className={`
                          p-4 border-2 rounded-lg cursor-pointer transition-all
                          ${selectedDriverId === suggestion.driver.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                          ${!suggestion.isAvailable ? 'opacity-60' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {index === 0 && suggestion.isAvailable && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Recommandé
                              </Badge>
                            )}
                            <div>
                              <div className="font-semibold">
                                {suggestion.driver.firstName} {suggestion.driver.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {suggestion.driver.email}
                              </div>
                              {suggestion.driver.phone && (
                                <div className="text-sm text-muted-foreground">
                                  {suggestion.driver.phone}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge
                              className={
                                suggestion.isAvailable
                                  ? 'bg-green-100 text-green-800 border-green-300'
                                  : 'bg-gray-100 text-gray-800 border-gray-300'
                              }
                            >
                              {suggestion.reason}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              {suggestion.missionCount} missions ce jour
                            </div>
                            {suggestion.distanceKm !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                Distance: {suggestion.distanceKm.toFixed(1)} km
                              </div>
                            )}
                            <div className="text-xs font-semibold text-purple-600">
                              Score: {suggestion.score}
                            </div>
                            {suggestion.breakdown && (
                              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                <div>Disponibilité: +{suggestion.breakdown.availability}</div>
                                <div>Proximité: +{suggestion.breakdown.proximity}</div>
                                <div>Charge: {suggestion.breakdown.workload}</div>
                                <div>Préférences: +{suggestion.breakdown.preferences}</div>
                                <div>Performance: +{suggestion.breakdown.performance}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          {selectedRequestId && selectedDriverId && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Le chauffeur recevra une notification et pourra accepter ou refuser la mission.
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/missions')}
                    disabled={isCreating}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateMission}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      'Créer l\'affectation'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
