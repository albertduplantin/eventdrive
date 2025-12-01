'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Edit, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getDriverById, getDriverStats } from '@/lib/actions/drivers';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';
import type { users } from '@/lib/db/schema';

export default function DriverProfilePage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  const [driver, setDriver] = useState<typeof users.$inferSelect | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDriverData();
  }, [driverId]);

  const loadDriverData = async () => {
    setIsLoading(true);
    try {
      const [driverResult, statsResult] = await Promise.all([
        getDriverById(driverId),
        getDriverStats(driverId)
      ]);

      if (driverResult.success && driverResult.driver) {
        setDriver(driverResult.driver);
      } else {
        toast.error(driverResult.error || 'Chauffeur non trouvé');
        router.push('/dashboard/drivers');
        return;
      }

      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
      router.push('/dashboard/drivers');
    } finally {
      setIsLoading(false);
    }
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

  if (!driver) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/dashboard/drivers')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Profil Chauffeur
          </h1>
          <p className="text-muted-foreground mt-1">
            Informations détaillées et statistiques
          </p>
        </div>
        <Button
          onClick={() => {
            // TODO: Open edit dialog
            toast.info('Édition à venir');
          }}
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Driver Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar and basic info */}
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              {driver.avatarUrl ? (
                <img
                  src={driver.avatarUrl}
                  alt={`${driver.firstName} ${driver.lastName}`}
                  className="w-32 h-32 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-4">
                  <span className="text-white text-4xl font-bold">
                    {getInitials(driver.firstName || '', driver.lastName || '')}
                  </span>
                </div>
              )}
              <h2 className="text-2xl font-bold">
                {driver.firstName} {driver.lastName}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Chauffeur
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {driver.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm break-all">{driver.email}</p>
                  </div>
                </div>
              )}

              {driver.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                    <p className="text-sm">{driver.phone}</p>
                  </div>
                </div>
              )}

              {driver.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                    <p className="text-sm">{driver.address}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/dashboard/drivers/${driverId}/availability`)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Gérer les disponibilités
              </Button>
            </div>
          </Card>
        </div>

        {/* Right column - Stats and Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats?.totalMissions || 0}</div>
                    <div className="text-sm text-muted-foreground">Missions totales</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats?.completedMissions || 0}</div>
                    <div className="text-sm text-muted-foreground">Complétées</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <TrendingUp className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats?.cancelledMissions || 0}</div>
                    <div className="text-sm text-muted-foreground">Annulées</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats?.totalDistance || 0}</div>
                    <div className="text-sm text-muted-foreground">Km parcourus</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats?.totalDuration || 0}</div>
                    <div className="text-sm text-muted-foreground">Heures de conduite</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <User className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {stats?.rating ? stats.rating.toFixed(1) : '—'}
                    </div>
                    <div className="text-sm text-muted-foreground">Note moyenne</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Missions récentes</h3>
            <Card className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune mission pour le moment</p>
                <p className="text-sm mt-1">
                  Les missions assignées à ce chauffeur apparaîtront ici
                </p>
              </div>
            </Card>
          </div>

          {/* Availability Overview */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Disponibilités à venir</h3>
            <Card className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune disponibilité renseignée</p>
                <p className="text-sm mt-1">
                  Cliquez sur "Gérer les disponibilités" pour ajouter des créneaux
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
