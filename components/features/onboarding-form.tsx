'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { completeOnboarding } from '@/lib/actions/onboarding';
import { UserRole } from '@/types';

const onboardingSchema = z.object({
  festivalId: z.string().min(1, 'Veuillez sélectionner un festival ou entrer un nom'),
  role: z.nativeEnum(UserRole),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().min(1, 'Le numéro de téléphone est requis'),
  address: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface OnboardingFormProps {
  userInfo: UserInfo | null;
}

export function OnboardingForm({ userInfo }: OnboardingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [createNewFestival, setCreateNewFestival] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: userInfo?.firstName || '',
      lastName: userInfo?.lastName || '',
      role: UserRole.VIP,
    },
  });

  const onSubmit = async (data: OnboardingFormData) => {
    console.log('Form submitted with data:', data);

    if (!userInfo) {
      toast.error('Informations utilisateur manquantes');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Calling completeOnboarding...');
      const result = await completeOnboarding({
        ...data,
        clerkUserId: userInfo.id,
        email: userInfo.email,
      });

      console.log('Result:', result);

      if (result.success) {
        toast.success('Profil créé avec succès');
        // Force a full page reload to ensure middleware picks up the new user
        window.location.href = '/dashboard';
      } else {
        toast.error(result.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Impossible de créer le profil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-2xl bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Informations du profil
        </CardTitle>
        <CardDescription className="text-base">
          Complétez vos informations pour accéder à l'application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Festival Selection */}
          <div className="space-y-2">
            <Label htmlFor="festivalId">Festival</Label>
            {!createNewFestival ? (
              <>
                <Select
                  onValueChange={(value) => {
                    if (value === 'create-new') {
                      setCreateNewFestival(true);
                    } else {
                      setValue('festivalId', value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un festival" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create-new">
                      + Créer un nouveau festival
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Aucun festival existant. Créez-en un nouveau pour commencer.
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Nom du festival (ex: Festival du Film Court de Dinan)"
                  {...register('festivalId')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreateNewFestival(false)}
                >
                  Annuler
                </Button>
              </div>
            )}
            {errors.festivalId && (
              <p className="text-sm text-destructive">{errors.festivalId.message}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-semibold text-gray-700">Rôle</Label>
            <Select
              onValueChange={(value) => setValue('role', value as UserRole)}
              defaultValue={UserRole.VIP}
            >
              <SelectTrigger className="h-12 border-2 border-purple-200 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.FESTIVAL_ADMIN}>
                  Administrateur Festival
                </SelectItem>
                <SelectItem value={UserRole.GENERAL_COORDINATOR}>
                  Coordinateur Général
                </SelectItem>
                <SelectItem value={UserRole.VIP_MANAGER}>
                  Responsable VIP
                </SelectItem>
                <SelectItem value={UserRole.DRIVER_MANAGER}>
                  Responsable Chauffeurs
                </SelectItem>
                <SelectItem value={UserRole.DRIVER}>Chauffeur</SelectItem>
                <SelectItem value={UserRole.VIP}>VIP</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">Prénom</Label>
              <Input
                id="firstName"
                placeholder="Jean"
                className="h-12 border-2 border-blue-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Nom</Label>
              <Input
                id="lastName"
                placeholder="Dupont"
                className="h-12 border-2 border-blue-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              className="h-12 border-2 border-green-200 hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Adresse (optionnel)</Label>
            <Input
              id="address"
              placeholder="12 rue de la République, Dinan"
              className="h-12 border-2 border-orange-200 hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              {...register('address')}
            />
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <span className="text-orange-500">💡</span> Pour les chauffeurs : permet le calcul automatique des distances
            </p>
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
            disabled={isLoading}
          >
            {isLoading ? '✨ Création en cours...' : '🚀 Créer mon profil'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
