'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar as CalendarIcon, Plus, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { getDriverById } from '@/lib/actions/drivers';
import { getDriverAvailabilities, setDriverAvailability, deleteAvailability } from '@/lib/actions/availability';
import type { users, driverAvailabilities } from '@/lib/db/schema';
import { Badge } from '@/components/ui/badge';
import { RecurringAvailabilityDialog } from '@/components/features/recurring-availability-dialog';

type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING';

const SLOT_LABELS: Record<TimeSlot, string> = {
  MORNING: 'Matin (8h-12h)',
  AFTERNOON: 'Après-midi (12h-18h)',
  EVENING: 'Soir (18h-22h)',
};

const SLOT_SHORT_LABELS: Record<TimeSlot, string> = {
  MORNING: 'Matin',
  AFTERNOON: 'A-midi',
  EVENING: 'Soir',
};

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function DriverAvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  const [driver, setDriver] = useState<typeof users.$inferSelect | null>(null);
  const [availabilities, setAvailabilities] = useState<Array<typeof driverAvailabilities.$inferSelect>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);

  // Calculer le premier et dernier jour du mois actuel
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  useEffect(() => {
    loadData();
  }, [driverId, currentDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [driverResult, availResult] = await Promise.all([
        getDriverById(driverId),
        getDriverAvailabilities(driverId, firstDayOfMonth, lastDayOfMonth)
      ]);

      if (driverResult.success && driverResult.driver) {
        setDriver(driverResult.driver);
      } else {
        toast.error('Chauffeur non trouvé');
        router.push('/dashboard/drivers');
        return;
      }

      if (availResult.success) {
        setAvailabilities(availResult.availabilities);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSlot = async (date: Date, slot: TimeSlot) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Chercher si une disponibilité existe déjà
    const existing = availabilities.find(
      a => {
        const availDate = new Date(a.date);
        availDate.setHours(0, 0, 0, 0);
        return availDate.getTime() === normalizedDate.getTime() && a.slot === slot;
      }
    );

    const newState = !existing?.isAvailable;

    const result = await setDriverAvailability({
      driverId,
      date: normalizedDate,
      slot,
      isAvailable: newState,
    });

    if (result.success) {
      toast.success(newState ? 'Disponibilité ajoutée' : 'Disponibilité retirée');
      loadData();
    } else {
      toast.error(result.error || 'Erreur');
    }
  };

  const generateCalendarDays = () => {
    const days = [];
    const firstDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    // Ajouter les jours vides du début
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }

    return days;
  };

  const getSlotStatus = (date: Date | null, slot: TimeSlot): boolean => {
    if (!date) return false;

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const availability = availabilities.find(a => {
      const availDate = new Date(a.date);
      availDate.setHours(0, 0, 0, 0);
      return availDate.getTime() === normalizedDate.getTime() && a.slot === slot;
    });

    return availability?.isAvailable || false;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const calendarDays = generateCalendarDays();

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
          onClick={() => router.push(`/dashboard/drivers/${driverId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Disponibilités de {driver.firstName} {driver.lastName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Cliquez sur les créneaux pour gérer les disponibilités
          </p>
        </div>
        <Button onClick={() => setShowRecurringDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter récurrent
        </Button>
      </div>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>Non disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Matin: 8h-12h | Après-midi: 12h-18h | Soir: 18h-22h</span>
          </div>
        </div>
      </Card>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={previousMonth}>
          ← Mois précédent
        </Button>
        <h2 className="text-2xl font-bold">
          {MONTHS_FR[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <Button variant="outline" onClick={nextMonth}>
          Mois suivant →
        </Button>
      </div>

      {/* Calendar */}
      <Card className="p-6">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {DAYS_FR.map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={date.toISOString()}
                className={`
                  border rounded-lg p-2 space-y-1
                  ${isToday ? 'border-purple-500 border-2' : 'border-gray-200'}
                  ${isPast ? 'bg-gray-50' : ''}
                `}
              >
                <div className="text-center text-sm font-semibold mb-2">
                  {date.getDate()}
                </div>

                {/* Time slots */}
                <div className="space-y-1">
                  {(['MORNING', 'AFTERNOON', 'EVENING'] as TimeSlot[]).map((slot) => {
                    const isAvailable = getSlotStatus(date, slot);

                    return (
                      <button
                        key={slot}
                        onClick={() => !isPast && toggleSlot(date, slot)}
                        disabled={isPast}
                        className={`
                          w-full text-xs py-1 px-1 rounded transition-colors
                          ${isPast ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                          ${isAvailable ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 hover:bg-gray-300'}
                        `}
                      >
                        {SLOT_SHORT_LABELS[slot]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Résumé du mois</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-3xl font-bold text-green-600">
              {availabilities.filter(a => a.isAvailable).length}
            </div>
            <div className="text-sm text-muted-foreground">Créneaux disponibles</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {availabilities.filter(a => a.isAvailable && a.slot === 'MORNING').length}
            </div>
            <div className="text-sm text-muted-foreground">Matins disponibles</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {new Set(
                availabilities
                  .filter(a => a.isAvailable)
                  .map(a => new Date(a.date).toDateString())
              ).size}
            </div>
            <div className="text-sm text-muted-foreground">Jours disponibles</div>
          </div>
        </div>
      </Card>

      {/* Recurring Availability Dialog */}
      <RecurringAvailabilityDialog
        open={showRecurringDialog}
        onOpenChange={setShowRecurringDialog}
        driverId={driverId}
        onSuccess={loadData}
      />
    </div>
  );
}
