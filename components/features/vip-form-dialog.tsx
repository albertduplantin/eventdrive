'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';
import { createVip, updateVip } from '@/lib/actions/vips';
import type { vips } from '@/lib/db/schema';

const vipSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  organization: z.string().optional(),
  title: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

type VipFormData = z.infer<typeof vipSchema>;

interface VipFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vip?: typeof vips.$inferSelect | null;
  onSuccess?: () => void;
}

export function VipFormDialog({ open, onOpenChange, vip, onSuccess }: VipFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!vip;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VipFormData>({
    resolver: zodResolver(vipSchema),
    defaultValues: vip
      ? {
          firstName: vip.firstName,
          lastName: vip.lastName,
          email: vip.email || '',
          phone: vip.phone || '',
          organization: vip.organization || '',
          title: vip.title || '',
          category: vip.category || '',
          notes: vip.notes || '',
        }
      : undefined,
  });

  const onSubmit = async (data: VipFormData) => {
    setIsLoading(true);

    try {
      const result = isEditing
        ? await updateVip({ ...data, id: vip.id })
        : await createVip(data);

      if (result.success) {
        toast.success(isEditing ? 'VIP modifié avec succès' : 'VIP créé avec succès');
        reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Une erreur est survenue');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            {isEditing ? 'Modifier le VIP' : 'Ajouter un VIP'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations du VIP'
              : 'Ajoutez un nouveau VIP à votre festival'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-0">
          <div className="grid gap-4 md:grid-cols-2">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                placeholder="Jean"
                {...register('firstName')}
                className="h-11 border-2 focus:border-purple-500"
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                placeholder="Dupont"
                {...register('lastName')}
                className="h-11 border-2 focus:border-purple-500"
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@example.com"
                {...register('email')}
                className="h-11 border-2 focus:border-purple-500"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                {...register('phone')}
                className="h-11 border-2 focus:border-purple-500"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Organization */}
            <div className="space-y-2">
              <Label htmlFor="organization">Organisation</Label>
              <Input
                id="organization"
                placeholder="Société XYZ"
                {...register('organization')}
                className="h-11 border-2 focus:border-purple-500"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre/Fonction</Label>
              <Input
                id="title"
                placeholder="Directeur général"
                {...register('title')}
                className="h-11 border-2 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Input
              id="category"
              placeholder="Presse, Invité d'honneur, Sponsor..."
              {...register('category')}
              className="h-11 border-2 focus:border-purple-500"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires..."
              {...register('notes')}
              className="min-h-[100px] border-2 focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading
                ? isEditing
                  ? 'Modification...'
                  : 'Création...'
                : isEditing
                ? 'Modifier'
                : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
