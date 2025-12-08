'use client';

import { useState, useEffect } from 'react';
import { Plus, Copy, QrCode, X, Check, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getInvitations, deactivateInvitation } from '@/lib/actions/invitations';
import { UserRole, type User } from '@/types';
import { CreateInvitationDialog } from '@/components/features/create-invitation-dialog';
import { QRCodeDialog } from '@/components/features/qrcode-dialog';
import { useToast } from '@/hooks/use-toast';

interface InvitationsListClientProps {
  currentUser: User;
}

interface Invitation {
  id: string;
  code: string;
  role: UserRole | null;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

export function InvitationsListClient({ currentUser }: InvitationsListClientProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [qrCodeInvitation, setQrCodeInvitation] = useState<Invitation | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvitations();
  }, []);

  async function loadInvitations() {
    setLoading(true);
    const result = await getInvitations();
    if (result.success && result.data) {
      setInvitations(result.data as Invitation[]);
    }
    setLoading(false);
  }

  async function handleDeactivate(invitationId: string) {
    const result = await deactivateInvitation(invitationId);
    if (result.success) {
      toast({ title: 'Invitation désactivée', description: result.message });
      loadInvitations();
    } else {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' });
    }
  }

  function handleCopyCode(code: string) {
    const invitationLink = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(invitationLink);
    setCopiedCode(code);
    toast({ title: 'Lien copié', description: 'Le lien d\'invitation a été copié dans le presse-papiers' });
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function getRoleLabel(role: UserRole | null): string {
    if (!role) return 'Tous les rôles';
    const labels: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Super Admin',
      [UserRole.FESTIVAL_ADMIN]: 'Admin Festival',
      [UserRole.GENERAL_COORDINATOR]: 'Coordinateur',
      [UserRole.VIP_MANAGER]: 'Responsable VIP',
      [UserRole.DRIVER_MANAGER]: 'Responsable Chauffeurs',
      [UserRole.DRIVER]: 'Chauffeur',
      [UserRole.VIP]: 'VIP',
    };
    return labels[role] || role;
  }

  function getRoleBadgeStyle(role: UserRole | null): string {
    if (!role) return 'bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black/20 dark:border-white/20';
    const styles: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white',
      [UserRole.FESTIVAL_ADMIN]: 'bg-black/90 dark:bg-white/90 text-white dark:text-black border border-black/90 dark:border-white/90',
      [UserRole.GENERAL_COORDINATOR]: 'bg-black/70 dark:bg-white/70 text-white dark:text-black border border-black/70 dark:border-white/70',
      [UserRole.VIP_MANAGER]: 'bg-black/50 dark:bg-white/50 text-white dark:text-black border border-black/50 dark:border-white/50',
      [UserRole.DRIVER_MANAGER]: 'bg-black/30 dark:bg-white/30 text-black dark:text-white border border-black/30 dark:border-white/30',
      [UserRole.DRIVER]: 'bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black/20 dark:border-white/20',
      [UserRole.VIP]: 'bg-white/10 dark:bg-black/10 text-black dark:text-white border border-black/20 dark:border-white/20',
    };
    return styles[role] || 'bg-black/10 dark:bg-white/10 text-black dark:text-white';
  }

  function formatDate(date: Date | null): string {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const activeInvitations = invitations.filter(inv => inv.isActive);
  const inactiveInvitations = invitations.filter(inv => !inv.isActive);

  return (
    <>
      <div className="space-y-6">
        {/* Create Button */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vos invitations</CardTitle>
                <CardDescription>
                  {activeInvitations.length} invitation{activeInvitations.length > 1 ? 's' : ''} active{activeInvitations.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une invitation
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : activeInvitations.length === 0 ? (
              <div className="py-12 text-center">
                <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Aucune invitation active</p>
                <Button variant="outline" onClick={() => setCreateDialogOpen(true)} className="mt-4">
                  Créer votre première invitation
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between rounded-lg border-2 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 hover:border-black/20 dark:hover:border-white/20 transition-all"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <code className="text-lg font-bold">{invitation.code}</code>
                        <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-medium ${getRoleBadgeStyle(invitation.role)}`}>
                          {getRoleLabel(invitation.role)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Utilisations: {invitation.usedCount}
                          {invitation.maxUses > 0 && ` / ${invitation.maxUses}`}
                        </span>
                        {invitation.expiresAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expire le {formatDate(invitation.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(invitation.code)}
                      >
                        {copiedCode === invitation.code ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copié
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copier le lien
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQrCodeInvitation(invitation)}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        QR Code
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivate(invitation.id)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Désactiver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inactive Invitations */}
        {inactiveInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Invitations désactivées</CardTitle>
              <CardDescription>
                {inactiveInvitations.length} invitation{inactiveInvitations.length > 1 ? 's' : ''} désactivée{inactiveInvitations.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inactiveInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <code className="font-mono text-sm">{invitation.code}</code>
                      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${getRoleBadgeStyle(invitation.role)}`}>
                        {getRoleLabel(invitation.role)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {invitation.usedCount} utilisation{invitation.usedCount > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Invitation Dialog */}
      <CreateInvitationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          loadInvitations();
        }}
        currentUserRole={currentUser.role as UserRole}
      />

      {/* QR Code Dialog */}
      <QRCodeDialog
        invitation={qrCodeInvitation}
        open={qrCodeInvitation !== null}
        onOpenChange={(open) => {
          if (!open) setQrCodeInvitation(null);
        }}
      />
    </>
  );
}
