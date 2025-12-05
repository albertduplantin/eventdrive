'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Filter, Pencil, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TransportFormDialog } from '@/components/features/transport-form-dialog';
import { getTransportRequests, deleteTransportRequest, cancelTransportRequest } from '@/lib/actions/transports';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { TransportRequestWithRelations, RequestStatus, TransportType } from '@/types';

const STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: 'En attente',
  ASSIGNED: 'Assignée',
  ACCEPTED: 'Acceptée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

const STATUS_COLORS: Record<RequestStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const TYPE_LABELS: Record<TransportType, string> = {
  STATION_TO_VENUE: 'Gare/Aéroport → Venue',
  VENUE_TO_STATION: 'Venue → Gare/Aéroport',
  INTRA_CITY: 'Transport intra-ville',
  OTHER: 'Autre',
};

export default function TransportsPage() {
  const [transports, setTransports] = useState<TransportRequestWithRelations[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TransportType | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState<TransportRequestWithRelations | null>(null);

  const loadTransports = async () => {
    setIsLoading(true);
    try {
      const filters = {
        search: searchQuery || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
      };

      const result = await getTransportRequests(filters);
      if (result.success && result.requests) {
        setTransports(result.requests as TransportRequestWithRelations[]);
      } else {
        toast.error(result.error || 'Erreur lors du chargement des demandes');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransports();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      loadTransports();
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, statusFilter, typeFilter]);

  const handleCancel = async (id: string) => {
    const reason = prompt('Raison de l\'annulation :');
    if (!reason) return;

    const result = await cancelTransportRequest(id, reason);
    if (result.success) {
      toast.success('Demande annulée avec succès');
      loadTransports();
    } else {
      toast.error(result.error || 'Erreur lors de l\'annulation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      return;
    }

    const result = await deleteTransportRequest(id);
    if (result.success) {
      toast.success('Demande supprimée avec succès');
      loadTransports();
    } else {
      toast.error(result.error || 'Erreur lors de la suppression');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
  };

  const handleAdd = () => {
    setSelectedTransport(null);
    setIsFormOpen(true);
  };

  const handleEdit = (transport: TransportRequestWithRelations) => {
    setSelectedTransport(transport);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    loadTransports();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Demandes de Transport
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez toutes les demandes de transport VIP
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[250px]">
          <label className="text-sm font-medium mb-2 block">Recherche</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom du VIP, adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Statut</label>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequestStatus | 'ALL')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="ASSIGNED">Assignée</SelectItem>
              <SelectItem value="ACCEPTED">Acceptée</SelectItem>
              <SelectItem value="IN_PROGRESS">En cours</SelectItem>
              <SelectItem value="COMPLETED">Terminée</SelectItem>
              <SelectItem value="CANCELLED">Annulée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Type</label>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransportType | 'ALL')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              <SelectItem value="STATION_TO_VENUE">Gare/Aéroport → Venue</SelectItem>
              <SelectItem value="VENUE_TO_STATION">Venue → Gare/Aéroport</SelectItem>
              <SelectItem value="INTRA_CITY">Transport intra-ville</SelectItem>
              <SelectItem value="OTHER">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={resetFilters}>
          <Filter className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
          <div className="text-2xl font-bold text-purple-900">{transports.length}</div>
          <div className="text-sm text-purple-700">Total demandes</div>
        </div>
        <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
          <div className="text-2xl font-bold text-yellow-900">
            {transports.filter(t => t.status === 'PENDING').length}
          </div>
          <div className="text-sm text-yellow-700">En attente</div>
        </div>
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <div className="text-2xl font-bold text-blue-900">
            {transports.filter(t => t.status === 'ASSIGNED' || t.status === 'ACCEPTED').length}
          </div>
          <div className="text-sm text-blue-700">Assignées/Acceptées</div>
        </div>
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
          <div className="text-2xl font-bold text-green-900">
            {transports.filter(t => t.status === 'COMPLETED').length}
          </div>
          <div className="text-sm text-green-700">Terminées</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border-2 border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <TableRow>
              <TableHead className="font-semibold">VIP</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Départ</TableHead>
              <TableHead className="font-semibold">Arrivée</TableHead>
              <TableHead className="font-semibold">Date & Heure</TableHead>
              <TableHead className="font-semibold">Statut</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : transports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucune demande de transport trouvée
                </TableCell>
              </TableRow>
            ) : (
              transports.map((transport) => (
                <TableRow key={transport.id} className="hover:bg-purple-50/50">
                  <TableCell className="font-medium">
                    {transport.vip ? `${transport.vip.firstName} ${transport.vip.lastName}` : 'VIP supprimé'}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{TYPE_LABELS[transport.type]}</span>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="text-sm truncate" title={transport.pickupAddress}>
                      {transport.pickupAddress}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="text-sm truncate" title={transport.dropoffAddress}>
                      {transport.dropoffAddress}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(transport.requestedDatetime), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[transport.status]}>
                      {STATUS_LABELS[transport.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {transport.status !== 'ASSIGNED' && transport.status !== 'CANCELLED' && transport.status !== 'COMPLETED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transport)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {transport.status !== 'CANCELLED' && transport.status !== 'COMPLETED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(transport.id)}
                        >
                          <XCircle className="h-4 w-4 text-orange-600" />
                        </Button>
                      )}
                      {transport.status !== 'ASSIGNED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transport.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Transport Form Dialog */}
      <TransportFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        transport={selectedTransport}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
