'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { createMyRecurringAvailability } from '@/lib/actions/my-availability';

const recurringSchema = z.object({
  startDate: z.string().min(1, 'Date de début requise'),
  endDate: z.string().min(1, 'Date de fin requise'),
  daysOfWeek: z.array(z.number()).min(1, 'Sélectionnez au moins un jour'),
  allMornings: z.boolean(),
  allAfternoons: z.boolean(),
  allEvenings: z.boolean(),
}).refine(data => data.allMornings || data.allAfternoons || data.allEvenings, {
  message: 'Sélectionnez au moins un créneau horaire',
  path: ['allMornings'],
});

type RecurringFormData = z.infer<typeof recurringSchema>;

interface MyRecurringAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

export function MyRecurringAvailabilityDialog({
  open,
  onOpenChange,
  onSuccess,
}: MyRecurringAvailabilityDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      daysOfWeek: [],
      allMornings: false,
      allAfternoons: false,
      allEvenings: false,
    },
  });

  const allMornings = watch('allMornings');
  const allAfternoons = watch('allAfternoons');
  const allEvenings = watch('allEvenings');

  const toggleDay = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    setSelectedDays(newDays);
    setValue('daysOfWeek', newDays, { shouldValidate: true });
  };

  const selectWeekdays = () => {
    const weekdays = [1, 2, 3, 4, 5];
    setSelectedDays(weekdays);
    setValue('daysOfWeek', weekdays, { shouldValidate: true });
  };

  const selectWeekend = () => {
    const weekend = [0, 6];
    setSelectedDays(weekend);
    setValue('daysOfWeek', weekend, { shouldValidate: true });
  };

  const selectAllDays = () => {
    const allDays = [0, 1, 2, 3, 4, 5, 6];
    setSelectedDays(allDays);
    setValue('daysOfWeek', allDays, { shouldValidate: true });
  };

  const onSubmit = async (data: RecurringFormData) => {
    setIsLoading(true);

    try {
      const result = await createMyRecurringAvailability({
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        daysOfWeek: data.daysOfWeek,
        allMornings: data.allMornings,
        allAfternoons: data.allAfternoons,
        allEvenings: data.allEvenings,
      });

      if (result.success) {
        toast.success(result.message || 'Disponibilités créées avec succès');
        reset();
        setSelectedDays([]);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erreur lors de la création');
      }
    } catch (error) {
      toast.error('Erreur lors de la création des disponibilités');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter mes disponibilités</DialogTitle>
          <DialogDescription>
            Indiquez vos disponibilités sur plusieurs jours en une seule fois
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Date de début <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                Date de fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Days of Week */}
          <div className="space-y-3">
            <Label>
              Jours de la semaine <span className="text-red-500">*</span>
            </Label>

            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectWeekdays}
              >
                Semaine (Lun-Ven)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectWeekend}
              >
                Week-end
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllDays}
              >
                Tous les jours
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <label
                    htmlFor={`day-${day.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {day.label}
                  </label>
                </div>
              ))}
            </div>
            {errors.daysOfWeek && (
              <p className="text-sm text-red-600">{errors.daysOfWeek.message}</p>
            )}
          </div>

          {/* Time Slots */}
          <div className="space-y-3">
            <Label>
              Créneaux horaires <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allMornings"
                  {...register('allMornings')}
                  checked={allMornings}
                  onCheckedChange={(checked) => setValue('allMornings', !!checked, { shouldValidate: true })}
                />
                <label
                  htmlFor="allMornings"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Matins (8h-12h)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allAfternoons"
                  {...register('allAfternoons')}
                  checked={allAfternoons}
                  onCheckedChange={(checked) => setValue('allAfternoons', !!checked, { shouldValidate: true })}
                />
                <label
                  htmlFor="allAfternoons"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Après-midis (12h-18h)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allEvenings"
                  {...register('allEvenings')}
                  checked={allEvenings}
                  onCheckedChange={(checked) => setValue('allEvenings', !!checked, { shouldValidate: true })}
                />
                <label
                  htmlFor="allEvenings"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Soirs (18h-22h)
                </label>
              </div>
            </div>
            {errors.allMornings && (
              <p className="text-sm text-red-600">{errors.allMornings.message}</p>
            )}
          </div>

          {/* Summary */}
          {selectedDays.length > 0 && (allMornings || allAfternoons || allEvenings) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">Aperçu</h4>
              <p className="text-sm text-blue-700">
                Créneaux sélectionnés : {' '}
                {[
                  allMornings && 'Matins',
                  allAfternoons && 'Après-midis',
                  allEvenings && 'Soirs'
                ].filter(Boolean).join(', ')}
              </p>
              <p className="text-sm text-blue-700">
                Jours : {selectedDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSelectedDays([]);
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer mes disponibilités'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
