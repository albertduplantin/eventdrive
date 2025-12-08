'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createInvitation } from '@/lib/actions/invitations';
import { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CreateInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentUserRole: UserRole;
}

export function CreateInvitationDialog({
  open,
  onOpenChange,
  onSuccess,
  currentUserRole,
}: CreateInvitationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
  const [maxUses, setMaxUses] = useState<string>('0');
  const [expiresInDays, setExpiresInDays] = useState<string>('30');
  const { toast } = useToast();

  function getAvailableRoles(): UserRole[] {
    if (currentUserRole === UserRole.SUPER_ADMIN) {
      return Object.values(UserRole);
    } else if (currentUserRole === UserRole.FESTIVAL_ADMIN) {
      return [
        UserRole.FESTIVAL_ADMIN,
        UserRole.GENERAL_COORDINATOR,
        UserRole.VIP_MANAGER,
        UserRole.DRIVER_MANAGER,
        UserRole.DRIVER,
        UserRole.VIP,
      ];
    } else if (currentUserRole === UserRole.GENERAL_COORDINATOR) {
      return [
        UserRole.VIP_MANAGER,
        UserRole.DRIVER_MANAGER,
        UserRole.DRIVER,
        UserRole.VIP,
      ];
    } else if (currentUserRole === UserRole.DRIVER_MANAGER) {
      return [UserRole.DRIVER];
    }
    return [];
  }

  function getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Super Admin',
      [UserRole.FESTIVAL_ADMIN]: 'Admin Festival',
      [UserRole.GENERAL_COORDINATOR]: 'Coordinateur Général',
      [UserRole.VIP_MANAGER]: 'Responsable VIP',
      [UserRole.DRIVER_MANAGER]: 'Responsable Chauffeurs',
      [UserRole.DRIVER]: 'Chauffeur',
      [UserRole.VIP]: 'VIP',
    };
    return labels[role] || role;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createInvitation({
        role: selectedRole === 'ALL' ? undefined : selectedRole,
        maxUses: parseInt(maxUses) || 0,
        expiresInDays: parseInt(expiresInDays) || undefined,
      });

      if (result.success) {
        toast({
          title: 'Invitation créée',
          description: result.message || 'L\'invitation a été créée avec succès',
        });
        // Reset form
        setSelectedRole('ALL');
        setMaxUses('0');
        setExpiresInDays('30');
        onSuccess();
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de créer l\'invitation',
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

  const availableRoles = getAvailableRoles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Créer une invitation
            </DialogTitle>
            <DialogDescription>
              Générez un code d&apos;invitation unique pour inviter de nouveaux membres
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rôle attribué *</label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as UserRole | 'ALL')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les rôles (flexible)</SelectItem>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {getRoleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Le rôle sera automatiquement attribué lors de l&apos;inscription
              </p>
            </div>

            {/* Max Uses */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre d&apos;utilisations maximum</label>
              <Input
                type="number"
                min="0"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="0 = illimité"
              />
              <p className="text-xs text-muted-foreground">
                0 pour un nombre illimité d&apos;utilisations
              </p>
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Expire dans (jours)</label>
              <Input
                type="number"
                min="0"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="0 = pas d'expiration"
              />
              <p className="text-xs text-muted-foreground">
                0 pour une invitation permanente
              </p>
            </div>

            {/* Preview */}
            <div className="rounded-lg border-2 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
              <p className="text-sm font-medium mb-2">Résumé</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Rôle: <span className="font-medium text-foreground">{selectedRole === 'ALL' ? 'Flexible' : getRoleLabel(selectedRole)}</span></p>
                <p>Utilisations: <span className="font-medium text-foreground">{maxUses === '0' || maxUses === '' ? 'Illimitées' : maxUses}</span></p>
                <p>Expiration: <span className="font-medium text-foreground">
                  {expiresInDays === '0' || expiresInDays === '' ? 'Jamais' : `${expiresInDays} jours`}
                </span></p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer l\'invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
