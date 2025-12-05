'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Star, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDriverById } from '@/lib/actions/drivers';
import { getDriverMissions } from '@/lib/actions/missions';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { users } from '@/lib/db/schema';

type DriverMission = {
  id: string;
  status: string;
  scheduledDate: Date;
  scheduledTime: string;
  pickupLocation: string;
  dropoffLocation: string;
};

export default function DriverProfilePage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  const [driver, setDriver] = useState<typeof users.$inferSelect | null>(null);
  const [driverMissions, setDriverMissions] = useState<DriverMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const loadDriverData = async () => {
    setIsLoading(true);
    try {
      const [driverResult, missionsResult] = await Promise.all([
        getDriverById(driverId),
        getDriverMissions(driverId)
      ]);

      if (driverResult.success && driverResult.driver) {
        setDriver(driverResult.driver);
      } else {
        toast.error(driverResult.error || 'Chauffeur non trouvé');
        router.push('/dashboard/drivers');
        return;
      }

      if (missionsResult.success) {
        setDriverMissions(missionsResult.missions);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
      router.push('/dashboard/drivers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDriverData();
  }, [driverId]);

  if (!mounted || isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  // Calculate statistics
  const totalMissions = driverMissions.length;
  const completedMissions = driverMissions.filter(m => m.status === 'COMPLETED').length;
  const activeMissions = driverMissions.filter(m =>
    ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(m.status)
  ).length;
  const completionRate = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

  // Get current month missions
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthMissions = driverMissions.filter(m => {
    const missionDate = new Date(m.scheduledDate);
    return missionDate.getMonth() === currentMonth && missionDate.getFullYear() === currentYear;
  }).length;

  // Get recent missions (last 5)
  const recentMissions = [...driverMissions]
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'En attente', variant: 'secondary' as const },
      CONFIRMED: { label: 'Confirmée', variant: 'default' as const },
      IN_PROGRESS: { label: 'En cours', variant: 'default' as const },
      COMPLETED: { label: 'Terminée', variant: 'default' as const },
      CANCELLED: { label: 'Annulée', variant: 'destructive' as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/drivers')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Profil Chauffeur
          </h1>
          <p className="text-muted-foreground mt-1">
            Détails et statistiques du chauffeur
          </p>
        </div>
      </div>

      {/* Driver Info Card */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {driver.avatarUrl ? (
              <img
                src={driver.avatarUrl}
                alt={`${driver.firstName} ${driver.lastName}`}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {getInitials(driver.firstName || '', driver.lastName || '')}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {driver.firstName} {driver.lastName}
            </h2>
            <p className="text-muted-foreground">Chauffeur</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {driver.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{driver.email}</span>
                </div>
              )}

              {driver.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{driver.phone}</span>
                </div>
              )}

              {driver.address && (
                <div className="flex items-center gap-2 text-sm col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{driver.address}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => router.push(`/dashboard/drivers/${driver.id}/availability`)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Voir disponibilités
              </Button>
              {driver.email && (
                <Button variant="outline" asChild>
                  <a href={`mailto:${driver.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contacter
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalMissions}</div>
              <div className="text-sm text-muted-foreground">Missions totales</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completedMissions}</div>
              <div className="text-sm text-muted-foreground">
                Terminées ({completionRate}%)
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{activeMissions}</div>
              <div className="text-sm text-muted-foreground">En cours</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-100">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{monthMissions}</div>
              <div className="text-sm text-muted-foreground">Ce mois-ci</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Missions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Missions récentes</h3>
        {recentMissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune mission trouvée
          </div>
        ) : (
          <div className="space-y-3">
            {recentMissions.map((mission) => (
              <div
                key={mission.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/missions/${mission.id}`)}
              >
                <div className="flex-1">
                  <div className="font-medium">Mission #{mission.id.slice(0, 8)}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(mission.scheduledDate), 'PPP', { locale: fr })} à{' '}
                    {mission.scheduledTime}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {mission.pickupLocation} → {mission.dropoffLocation}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(mission.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
