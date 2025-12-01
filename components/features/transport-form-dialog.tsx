'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createTransportRequest, updateTransportRequest } from '@/lib/actions/transports';
import { getVips } from '@/lib/actions/vips';
import type { TransportRequest, TransportType } from '@/types';
import type { vips } from '@/lib/db/schema';

const transportSchema = z.object({
  vipId: z.string().uuid('Veuillez sélectionner un VIP'),
  type: z.enum(['STATION_TO_VENUE', 'VENUE_TO_STATION', 'INTRA_CITY', 'OTHER']),
  pickupAddress: z.string().min(5, 'L\'adresse de départ doit contenir au moins 5 caractères'),
  dropoffAddress: z.string().min(5, 'L\'adresse d\'arrivée doit contenir au moins 5 caractères'),
  requestedDatetime: z.string().min(1, 'La date et l\'heure sont requises'),
  estimatedDurationMinutes: z.number().min(1, 'La durée doit être positive').optional(),
  passengerCount: z.number().min(1, 'Au moins 1 passager requis').max(50, 'Maximum 50 passagers'),
  notes: z.string().optional(),
});

type TransportFormData = z.infer<typeof transportSchema>;

interface TransportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transport?: TransportRequest | null;
  onSuccess?: () => void;
}

const TYPE_LABELS: Record<TransportType, string> = {
  STATION_TO_VENUE: 'Gare/Aéroport → Venue',
  VENUE_TO_STATION: 'Venue → Gare/Aéroport',
  INTRA_CITY: 'Transport intra-ville',
  OTHER: 'Autre',
};

export function TransportFormDialog({ open, onOpenChange, transport, onSuccess }: TransportFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [vipList, setVipList] = useState<Array<typeof vips.$inferSelect>>([]);
  const isEditing = !!transport;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransportFormData>({
    resolver: zodResolver(transportSchema),
    defaultValues: transport
      ? {
          vipId: transport.vipId,
          type: transport.type,
          pickupAddress: transport.pickupAddress,
          dropoffAddress: transport.dropoffAddress,
          requestedDatetime: new Date(transport.requestedDatetime).toISOString().slice(0, 16),
          estimatedDurationMinutes: transport.estimatedDurationMinutes || undefined,
          passengerCount: transport.passengerCount,
          notes: transport.notes || '',
        }
      : {
          passengerCount: 1,
        },
  });

  const selectedType = watch('type');
  const selectedVipId = watch('vipId');

  // Load VIPs
  useEffect(() => {
    const loadVips = async () => {
      const result = await getVips();
      if (result.success) {
        setVipList(result.vips);
      }
    };
    if (open) {
      loadVips();
    }
  }, [open]);

  const onSubmit = async (data: TransportFormData) => {
    setIsLoading(true);

    try {
      const payload = {
        vipId: data.vipId,
        type: data.type,
        pickupAddress: data.pickupAddress,
        dropoffAddress: data.dropoffAddress,
        requestedDatetime: new Date(data.requestedDatetime),
        estimatedDurationMinutes: data.estimatedDurationMinutes,
        passengerCount: data.passengerCount,
        notes: data.notes,
      };

      const result = isEditing
        ? await updateTransportRequest({ ...payload, id: transport.id })
        : await createTransportRequest(payload);

      if (result.success) {
        toast.success(isEditing ? 'Demande modifiée avec succès' : 'Demande créée avec succès');
        reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {isEditing ? 'Modifier la demande' : 'Nouvelle demande de transport'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifiez les informations de la demande de transport' : 'Créez une nouvelle demande de transport VIP'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-0">
          {/* VIP Selection */}
          <div className="space-y-2">
            <Label htmlFor="vipId">
              VIP <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedVipId}
              onValueChange={(value) => setValue('vipId', value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un VIP" />
              </SelectTrigger>
              <SelectContent>
                {vipList.map((vip) => (
                  <SelectItem key={vip.id} value={vip.id}>
                    {vip.firstName} {vip.lastName}
                    {vip.organization && ` - ${vip.organization}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vipId && (
              <p className="text-sm text-red-600">{errors.vipId.message}</p>
            )}
          </div>

          {/* Transport Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Type de transport <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedType}
              onValueChange={(value: TransportType) => setValue('type', value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickupAddress">
                Adresse de départ <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="pickupAddress"
                {...register('pickupAddress')}
                placeholder="123 Rue Exemple, 75001 Paris"
                rows={3}
              />
              {errors.pickupAddress && (
                <p className="text-sm text-red-600">{errors.pickupAddress.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dropoffAddress">
                Adresse d'arrivée <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="dropoffAddress"
                {...register('dropoffAddress')}
                placeholder="456 Avenue Exemple, 75002 Paris"
                rows={3}
              />
              {errors.dropoffAddress && (
                <p className="text-sm text-red-600">{errors.dropoffAddress.message}</p>
              )}
            </div>
          </div>

          {/* Datetime & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestedDatetime">
                Date et heure de départ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="requestedDatetime"
                type="datetime-local"
                {...register('requestedDatetime')}
              />
              {errors.requestedDatetime && (
                <p className="text-sm text-red-600">{errors.requestedDatetime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDurationMinutes">
                Durée estimée (minutes)
              </Label>
              <Input
                id="estimatedDurationMinutes"
                type="number"
                {...register('estimatedDurationMinutes', { valueAsNumber: true })}
                placeholder="30"
              />
              {errors.estimatedDurationMinutes && (
                <p className="text-sm text-red-600">{errors.estimatedDurationMinutes.message}</p>
              )}
            </div>
          </div>

          {/* Number of Passengers */}
          <div className="space-y-2">
            <Label htmlFor="passengerCount">
              Nombre de passagers <span className="text-red-500">*</span>
            </Label>
            <Input
              id="passengerCount"
              type="number"
              {...register('passengerCount', { valueAsNumber: true })}
              min={1}
              max={50}
            />
            {errors.passengerCount && (
              <p className="text-sm text-red-600">{errors.passengerCount.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Véhicule avec sièges bébé, accès handicapé, etc."
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
