'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getDriverById } from '@/lib/actions/drivers';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { users } from '@/lib/db/schema';

export default function DriverAvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  const [driver, setDriver] = useState<typeof users.$inferSelect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const loadData = async () => {
    setIsLoading(true);
    try {
      const driverResult = await getDriverById(driverId);

      if (driverResult.success && driverResult.driver) {
        setDriver(driverResult.driver);
      } else {
        toast.error(driverResult.error || 'Chauffeur non trouve');
        router.push('/dashboard/drivers');
        return;
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des donnees');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
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

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/drivers/${driverId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Disponibilites - {driver.firstName} {driver.lastName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerez les disponibilites du chauffeur
          </p>
        </div>
      </div>

      {/* Driver Info Card */}
      <Card className="p-4 flex items-center gap-4">
        <div className="flex-shrink-0">
          {driver.avatarUrl ? (
            <img
              src={driver.avatarUrl}
              alt={`${driver.firstName} ${driver.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {getInitials(driver.firstName || '', driver.lastName || '')}
              </span>
            </div>
          )}
        </div>
        <div>
          <div className="font-semibold">{driver.firstName} {driver.lastName}</div>
          <div className="text-sm text-muted-foreground">{driver.email}</div>
        </div>
      </Card>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Semaine precedente
        </Button>
        <div className="text-lg font-semibold">
          {format(currentWeekStart, 'dd MMM', { locale: fr })} - {format(addDays(currentWeekStart, 6), 'dd MMM yyyy', { locale: fr })}
        </div>
        <Button
          variant="outline"
          onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
        >
          Semaine suivante
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const isToday = isSameDay(day, new Date());

          return (
            <Card
              key={index}
              className={`p-4 ${isToday ? 'border-purple-500 border-2' : ''}`}
            >
              <div className="text-center mb-3">
                <div className="text-sm font-medium text-muted-foreground">
                  {format(day, 'EEE', { locale: fr })}
                </div>
                <div className="text-2xl font-bold">
                  {format(day, 'd')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(day, 'MMM', { locale: fr })}
                </div>
              </div>

              <div className="space-y-2 min-h-[100px]">
                <div className="text-center py-4 text-xs text-muted-foreground">
                  Fonctionnalite en developpement
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                disabled
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Info Message */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Gestion des disponibilites</h3>
            <p className="text-sm text-blue-700 mt-1">
              La gestion complete des disponibilites des chauffeurs avec creation, modification et suppression
              de creneaux horaires sera disponible prochainement.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
