'use client';

import { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUserRole } from '@/lib/actions/users';
import { UserRole, type User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ChangeRoleDialogProps {
  user: User | null;
  availableRoles: UserRole[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ChangeRoleDialog({
  user,
  availableRoles,
  open,
  onOpenChange,
  onSuccess,
}: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset when dialog opens/closes
  useState(() => {
    if (open && user) {
      setSelectedRole(user.role as UserRole);
    } else {
      setSelectedRole('');
    }
  });

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

  function getRoleDescription(role: UserRole): string {
    const descriptions: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Accès complet à tous les festivals et fonctionnalités',
      [UserRole.FESTIVAL_ADMIN]: 'Gestion complète du festival',
      [UserRole.GENERAL_COORDINATOR]: 'Coordination générale des transports et affectations',
      [UserRole.VIP_MANAGER]: 'Gestion des VIPs et demandes de transport',
      [UserRole.DRIVER_MANAGER]: 'Gestion des chauffeurs et affectations',
      [UserRole.DRIVER]: 'Accepter/refuser des missions et partager la position',
      [UserRole.VIP]: 'Créer des demandes de transport',
    };
    return descriptions[role] || '';
  }

  async function handleSubmit() {
    if (!user || !selectedRole || selectedRole === user.role) return;

    setLoading(true);
    try {
      const result = await updateUserRole(user.id, selectedRole);

      if (result.success) {
        toast({
          title: 'Rôle mis à jour',
          description: result.message || 'Le rôle a été modifié avec succès',
        });
        onSuccess();
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Impossible de modifier le rôle',
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

  if (!user) return null;

  const currentRoleLabel = getRoleLabel(user.role as UserRole);
  const hasChanges = selectedRole && selectedRole !== user.role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Changer le rôle
          </DialogTitle>
          <DialogDescription>
            Modifier le rôle de{' '}
            <span className="font-medium text-foreground">
              {user.firstName} {user.lastName}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Role */}
          <div className="rounded-lg border-2 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
            <p className="text-sm font-medium mb-1">Rôle actuel</p>
            <p className="text-lg font-bold">{currentRoleLabel}</p>
          </div>

          {/* New Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nouveau rôle</label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un rôle" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div>
                      <div className="font-medium">{getRoleLabel(role)}</div>
                      <div className="text-xs text-muted-foreground">
                        {getRoleDescription(role)}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warning */}
          {hasChanges && (
            <div className="flex gap-3 rounded-lg border-2 border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/5 p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Attention</p>
                <p className="text-muted-foreground">
                  Le changement de rôle modifiera immédiatement les permissions de cet utilisateur.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || loading}
          >
            {loading ? 'Modification...' : 'Confirmer le changement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
