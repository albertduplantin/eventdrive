'use client';

import { useState } from 'react';
import { User as UserIcon, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { updateUserProfile } from '@/lib/actions/users';
import { UserRole, type User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface ProfileCompletionModalProps {
  user: User;
  open: boolean;
}

export function ProfileCompletionModal({ user, open }: ProfileCompletionModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: user.phone || '',
    address: user.address || '',
  });

  const needsPhone = !user.phone;
  const needsAddress = !user.address && (user.role === UserRole.DRIVER || user.role === UserRole.VIP);

  function getRoleExplanation(role: UserRole): string {
    const explanations: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Pour vous contacter en cas d\'urgence',
      [UserRole.FESTIVAL_ADMIN]: 'Pour vous contacter en cas d\'urgence',
      [UserRole.GENERAL_COORDINATOR]: 'Pour la coordination avec l\'équipe',
      [UserRole.VIP_MANAGER]: 'Pour la coordination avec l\'équipe',
      [UserRole.DRIVER_MANAGER]: 'Pour la coordination avec l\'équipe',
      [UserRole.DRIVER]: 'Pour recevoir les notifications de mission et calculer les distances',
      [UserRole.VIP]: 'Pour recevoir les notifications de transport',
    };
    return explanations[role as UserRole] || '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (needsPhone && !formData.phone) {
      toast({
        title: 'Téléphone requis',
        description: 'Veuillez entrer votre numéro de téléphone',
        variant: 'destructive',
      });
      return;
    }

    if (needsAddress && !formData.address) {
      toast({
        title: 'Adresse requise',
        description: 'Veuillez entrer votre adresse',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await updateUserProfile(user.id, {
        phone: formData.phone,
        address: formData.address,
      });

      if (result.success) {
        toast({
          title: 'Profil complété',
          description: 'Vos informations ont été enregistrées avec succès',
        });
        // Refresh the page to update the user data
        router.refresh();
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de mettre à jour le profil',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // If nothing is needed, don't show modal
  if (!needsPhone && !needsAddress) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <UserIcon className="h-6 w-6" />
              Complétez votre profil
            </DialogTitle>
            <DialogDescription className="text-base">
              {getRoleExplanation(user.role as UserRole)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Phone */}
            {needsPhone && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Numéro de téléphone *
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  required
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Utilisé pour les notifications urgentes et la coordination
                </p>
              </div>
            )}

            {/* Address (for Drivers and VIPs) */}
            {needsAddress && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse complète *
                </label>
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rue, Code postal, Ville"
                  required
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  {user.role === UserRole.DRIVER
                    ? 'Utilisée pour calculer les distances et optimiser les affectations'
                    : 'Utilisée pour les demandes de transport'}
                </p>
              </div>
            )}

            {/* Email (read-only, just for info) */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <Input
                type="email"
                value={user.email}
                disabled
                className="bg-black/5 dark:bg-white/5 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                L&apos;email ne peut pas être modifié
              </p>
            </div>

            {/* Info box */}
            <div className="rounded-lg border-2 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
              <p className="text-sm font-medium mb-2">Pourquoi ces informations ?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Communication rapide en cas d&apos;urgence</li>
                <li>• Notifications de mission en temps réel</li>
                {needsAddress && <li>• Optimisation des trajets et affectations</li>}
                <li>• Sécurité et traçabilité des opérations</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
              {loading ? 'Enregistrement...' : 'Valider et continuer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
