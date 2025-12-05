'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Calendar, User, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getMissions } from '@/lib/actions/missions';
import type { missions, transportRequests, users } from '@/lib/db/schema';
import { MissionStatus } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

export default function MissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<MissionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MissionStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadMissions();
  }, [statusFilter]);

  const loadMissions = async () => {
    setIsLoading(true);
    try {
      const result = await getMissions({
        status: statusFilter === 'ALL' ? undefined : statusFilter as unknown as MissionStatus,
      });

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

  const filteredMissions = missions.filter((m) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      m.driver.firstName?.toLowerCase().includes(searchLower) ||
      m.driver.lastName?.toLowerCase().includes(searchLower) ||
      m.driver.email.toLowerCase().includes(searchLower) ||
      m.transportRequest.pickupAddress.toLowerCase().includes(searchLower) ||
      m.transportRequest.dropoffAddress.toLowerCase().includes(searchLower)
    );
  });

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
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Gestion des Missions
          </h1>
          <p className="text-muted-foreground mt-1">
            Affectations et suivi des transports
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/missions/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle affectation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {missions.filter((m) => m.mission.status === 'PROPOSED').length}
          </div>
          <div className="text-sm text-muted-foreground">Proposées</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {missions.filter((m) => m.mission.status === 'ACCEPTED').length}
          </div>
          <div className="text-sm text-muted-foreground">Acceptées</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {missions.filter((m) => m.mission.status === 'IN_PROGRESS').length}
          </div>
          <div className="text-sm text-muted-foreground">En cours</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {missions.filter((m) => m.mission.status === 'COMPLETED').length}
          </div>
          <div className="text-sm text-muted-foreground">Terminées</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {missions.filter((m) => m.mission.status === 'DECLINED').length}
          </div>
          <div className="text-sm text-muted-foreground">Refusées</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par chauffeur, artiste, lieu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as MissionStatus | 'ALL')}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="PROPOSED">Proposées</SelectItem>
              <SelectItem value="ACCEPTED">Acceptées</SelectItem>
              <SelectItem value="IN_PROGRESS">En cours</SelectItem>
              <SelectItem value="COMPLETED">Terminées</SelectItem>
              <SelectItem value="DECLINED">Refusées</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Missions List */}
      {filteredMissions.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune mission trouvée</p>
            <p className="text-sm mt-2">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Essayez de modifier vos filtres'
                : 'Créez votre première affectation'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMissions.map((item) => (
            <Card
              key={item.mission.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/missions/${item.mission.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          {getRequestLabel(item.transportRequest)}
                        </h3>
                        <Badge className={STATUS_COLORS[item.mission.status as MissionStatus]}>
                          {STATUS_LABELS[item.mission.status as MissionStatus]}
                        </Badge>
                        {item.mission.assignmentMethod === 'AUTO' && (
                          <Badge variant="outline" className="text-xs">
                            Affectation auto
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>
                          Chauffeur: {item.driver.firstName} {item.driver.lastName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transport Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Départ</div>
                        <div className="text-muted-foreground">
                          {item.transportRequest.pickupAddress}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Arrivée</div>
                        <div className="text-muted-foreground">
                          {item.transportRequest.dropoffAddress}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date and Info */}
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
                    {item.mission.assignmentScore && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Score: {item.mission.assignmentScore}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Declined Reason */}
                  {item.mission.status === 'DECLINED' && item.mission.declinedReason && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                      <span className="font-medium text-red-900">Raison du refus: </span>
                      <span className="text-red-700">{item.mission.declinedReason}</span>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    {item.mission.acceptedAt && (
                      <div>
                        Acceptée le {formatDateTime(item.mission.acceptedAt)}
                      </div>
                    )}
                    {item.mission.startedAt && (
                      <div>
                        Démarrée le {formatDateTime(item.mission.startedAt)}
                      </div>
                    )}
                    {item.mission.completedAt && (
                      <div>
                        Terminée le {formatDateTime(item.mission.completedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
