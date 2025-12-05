'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { completeOnboarding } from '@/lib/actions/onboarding';
import { validateInvitationCode, useInvitationCode } from '@/lib/actions/invitations';
import { UserRole } from '@/types';
import { Ticket, Plus, Check } from 'lucide-react';

const onboardingSchema = z.object({
  festivalId: z.string().min(1, 'Veuillez selectionner un festival ou entrer un nom'),
  role: z.nativeEnum(UserRole),
  firstName: z.string().min(2, 'Le prenom doit contenir au moins 2 caracteres'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caracteres'),
  phone: z.string().min(1, 'Le numero de telephone est requis'),
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

export function OnboardingFormWithInvitation({ userInfo }: OnboardingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams?.get('invite');

  const [isLoading, setIsLoading] = useState(false);
  const [invitationCode, setInvitationCode] = useState(inviteCode || '');
  const [validatedInvitation, setValidatedInvitation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [createNewFestival, setCreateNewFestival] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(inviteCode ? 'join' : 'create');

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

  // Auto-validate invitation code from URL
  useState(() => {
    if (inviteCode) {
      handleValidateCode(inviteCode);
    }
  });

  const handleValidateCode = async (code?: string) => {
    const codeToValidate = code || invitationCode;
    if (!codeToValidate) {
      toast.error('Veuillez entrer un code d\'invitation');
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateInvitationCode(codeToValidate);

      if (result.success && result.invitation) {
        setValidatedInvitation(result.invitation);
        setValue('festivalId', result.invitation.festivalId);
        if (result.invitation.role) {
          setValue('role', result.invitation.role as UserRole);
        }
        toast.success(`Code valide ! Vous allez rejoindre ${result.invitation.festivalName}`);
      } else {
        toast.error(result.error || 'Code invalide');
        setValidatedInvitation(null);
      }
    } catch (error) {
      toast.error('Erreur lors de la validation du code');
    } finally {
      setIsValidating(false);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (!userInfo) {
      toast.error('Informations utilisateur manquantes');
      return;
    }

    setIsLoading(true);
    try {
      // If using invitation, mark it as used
      if (validatedInvitation) {
        await useInvitationCode(validatedInvitation.code);
      }

      const result = await completeOnboarding({
        ...data,
        clerkUserId: userInfo.id,
        email: userInfo.email,
      });

      if (result.success) {
        toast.success('Profil cree avec succes');
        window.location.href = '/dashboard';
      } else {
        toast.error(result.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Impossible de creer le profil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-2xl bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Bienvenue sur FestivalDrive
        </CardTitle>
        <CardDescription className="text-base">
          Rejoignez un festival ou creez le votre
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="join" className="gap-2">
              <Ticket className="h-4 w-4" />
              Rejoindre un festival
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <Plus className="h-4 w-4" />
              Creer un festival
            </TabsTrigger>
          </TabsList>

          {/* Join with invitation code */}
          <TabsContent value="join" className="space-y-4">
            <div className="space-y-4 p-4 rounded-lg bg-purple-50/50 border border-purple-200">
              <div className="flex items-start gap-3">
                <Ticket className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-purple-900">Code d'invitation</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Entrez le code fourni par l'administrateur du festival
                  </p>
                </div>
              </div>

              {!validatedInvitation ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="DINAN2025-ABC123"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                    className="flex-1 font-mono"
                  />
                  <Button
                    onClick={() => handleValidateCode()}
                    disabled={isValidating || !invitationCode}
                  >
                    {isValidating ? 'Validation...' : 'Valider'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                  <Check className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-green-900">
                      {validatedInvitation.festivalName}
                    </div>
                    <div className="text-sm text-green-700">
                      Code: {validatedInvitation.code}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setValidatedInvitation(null);
                      setInvitationCode('');
                    }}
                  >
                    Modifier
                  </Button>
                </div>
              )}
            </div>

            {validatedInvitation && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <UserInfoFields
                  register={register}
                  setValue={setValue}
                  errors={errors}
                  userInfo={userInfo}
                  disableRole={!!validatedInvitation.role}
                />
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creation en cours...' : `Rejoindre ${validatedInvitation.festivalName}`}
                </Button>
              </form>
            )}
          </TabsContent>

          {/* Create new festival */}
          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4 p-4 rounded-lg bg-blue-50/50 border border-blue-200">
              <div className="flex items-start gap-3">
                <Plus className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">Nouveau festival</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Creez votre propre festival et invitez votre equipe
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="festivalName">Nom du festival</Label>
                <Input
                  id="festivalName"
                  placeholder="Festival du Film Court de Dinan"
                  {...register('festivalId')}
                />
                {errors.festivalId && (
                  <p className="text-sm text-destructive">{errors.festivalId.message}</p>
                )}
              </div>

              <UserInfoFields
                register={register}
                setValue={setValue}
                errors={errors}
                userInfo={userInfo}
                disableRole={false}
              />

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Creation en cours...' : 'Creer mon festival'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Shared user info fields component
function UserInfoFields({
  register,
  setValue,
  errors,
  userInfo,
  disableRole,
}: any) {
  return (
    <>
      {/* Role Selection */}
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          onValueChange={(value) => setValue('role', value as UserRole)}
          defaultValue={UserRole.VIP}
          disabled={disableRole}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UserRole.FESTIVAL_ADMIN}>Administrateur Festival</SelectItem>
            <SelectItem value={UserRole.GENERAL_COORDINATOR}>Coordinateur General</SelectItem>
            <SelectItem value={UserRole.VIP_MANAGER}>Responsable VIP</SelectItem>
            <SelectItem value={UserRole.DRIVER_MANAGER}>Responsable Chauffeurs</SelectItem>
            <SelectItem value={UserRole.DRIVER}>Chauffeur</SelectItem>
            <SelectItem value={UserRole.VIP}>VIP</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      {/* Name Fields */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prenom</Label>
          <Input id="firstName" placeholder="Jean" {...register('firstName')} />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" placeholder="Dupont" {...register('lastName')} />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Telephone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+33 6 12 34 56 78"
          {...register('phone')}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Adresse (optionnel)</Label>
        <Input
          id="address"
          placeholder="12 rue de la Republique, Dinan"
          {...register('address')}
        />
        {errors.address && (
          <p className="text-sm text-destructive">{errors.address.message}</p>
        )}
      </div>
    </>
  );
}
