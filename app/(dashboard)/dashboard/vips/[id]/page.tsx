'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Building, Tag, Calendar, MapPin, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface VIP {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  organization: string | null;
  title: string | null;
  category: string | null;
  notes: string | null;
  createdAt: Date;
}

interface Transport {
  id: string;
  type: string;
  pickupAddress: string;
  dropoffAddress: string;
  requestedDatetime: Date;
  status: string;
  passengerCount: number | null;
  notes: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  ASSIGNED: 'Assignée',
  ACCEPTED: 'Acceptée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-300',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-300',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-300',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
};

const TYPE_LABELS: Record<string, string> = {
  STATION_TO_VENUE: 'Gare → Site',
  VENUE_TO_STATION: 'Site → Gare',
  INTRA_CITY: 'Intra-ville',
  OTHER: 'Autre',
};

export default function VIPDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vipId = params.id as string;

  const [vip, setVIP] = useState<VIP | null>(null);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVIPDetails();
  }, [vipId]);

  const loadVIPDetails = async () => {
    setIsLoading(true);
    try {
      // Load VIP details
      const vipResponse = await fetch(`/api/vips/${vipId}`);
      if (vipResponse.ok) {
        const vipData = await vipResponse.json();
        setVIP(vipData);
      } else {
        toast.error('VIP non trouvé');
        router.push('/dashboard/vips');
        return;
      }

      // Load transports
      const transportsResponse = await fetch(`/api/vips/${vipId}/transports`);
      if (transportsResponse.ok) {
        const transportsData = await transportsResponse.json();
        setTransports(transportsData);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      </div>
    );
  }

  if (!vip) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-muted-foreground">
          VIP non trouvé
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
          onClick={() => router.push('/dashboard/vips')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {vip.firstName} {vip.lastName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Détails et historique des transports
          </p>
        </div>
        <Button onClick={() => router.push(`/dashboard/transports/new?vipId=${vip.id}`)}>
          Créer une demande de transport
        </Button>
      </div>

      {/* VIP Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vip.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{vip.email}</div>
                  </div>
                </div>
              )}

              {vip.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Téléphone</div>
                    <div className="font-medium">{vip.phone}</div>
                  </div>
                </div>
              )}

              {vip.organization && (
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Organisation</div>
                    <div className="font-medium">{vip.organization}</div>
                  </div>
                </div>
              )}

              {vip.title && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Fonction</div>
                    <div className="font-medium">{vip.title}</div>
                  </div>
                </div>
              )}

              {vip.category && (
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Catégorie</div>
                    <div className="font-medium">{vip.category}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Créé le</div>
                  <div className="font-medium">
                    {new Date(vip.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {vip.notes && (
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">Notes</div>
                <div className="text-sm">{vip.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total transports</span>
                <span className="text-2xl font-bold">{transports.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Terminés</span>
                <span className="text-xl font-semibold text-green-600">
                  {transports.filter(t => t.status === 'COMPLETED').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En cours</span>
                <span className="text-xl font-semibold text-blue-600">
                  {transports.filter(t => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(t.status)).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Annulés</span>
                <span className="text-xl font-semibold text-red-600">
                  {transports.filter(t => t.status === 'CANCELLED').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transport History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des transports</CardTitle>
          <CardDescription>
            Tous les transports demandés pour ce VIP
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun transport enregistré</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transports.map((transport) => (
                <div
                  key={transport.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/transports/${transport.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className={STATUS_COLORS[transport.status]}>
                          {STATUS_LABELS[transport.status]}
                        </Badge>
                        <span className="text-sm font-medium">
                          {TYPE_LABELS[transport.type]}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(transport.requestedDatetime)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Départ</div>
                            <div className="text-muted-foreground">{transport.pickupAddress}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Arrivée</div>
                            <div className="text-muted-foreground">{transport.dropoffAddress}</div>
                          </div>
                        </div>
                      </div>

                      {transport.notes && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Note :</span> {transport.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
