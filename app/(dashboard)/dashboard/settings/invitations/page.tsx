'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Check, X, Link as LinkIcon, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { createInvitation, getFestivalInvitations, deactivateInvitation } from '@/lib/actions/invitations';
import { UserRole } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function InvitationsPage() {
  const [mounted, setMounted] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    role: '',
    maxUses: '0',
    expiresInDays: '30',
  });

  useEffect(() => {
    setMounted(true);
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setIsLoading(true);
    try {
      // Get festivalId from current user - in production, this would come from context
      const festivalId = localStorage.getItem('festivalId');
      if (!festivalId) {
        // Try to get from URL or other source
        return;
      }

      const result = await getFestivalInvitations(festivalId);
      if (result.success) {
        setInvitations(result.invitations);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    setIsCreating(true);
    try {
      const festivalId = localStorage.getItem('festivalId');
      if (!festivalId) {
        toast.error('Festival ID non trouve');
        return;
      }

      const result = await createInvitation({
        festivalId,
        role: formData.role || undefined,
        maxUses: parseInt(formData.maxUses) || 0,
        expiresInDays: parseInt(formData.expiresInDays) || undefined,
      });

      if (result.success) {
        toast.success('Code d\'invitation cree !');
        setShowCreateForm(false);
        setFormData({ role: '', maxUses: '0', expiresInDays: '30' });
        loadInvitations();
      } else {
        toast.error(result.error || 'Erreur lors de la creation');
      }
    } catch (error) {
      toast.error('Erreur lors de la creation');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copie !');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/onboarding?invite=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Lien copie !');
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Voulez-vous vraiment desactiver ce code d\'invitation ?')) {
      return;
    }

    try {
      const result = await deactivateInvitation(id);
      if (result.success) {
        toast.success('Code desactive');
        loadInvitations();
      } else {
        toast.error(result.error || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors de la desactivation');
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">
            Codes d'invitation
          </h1>
          <p className="text-muted-foreground mt-1">
            Generez des codes pour inviter de nouveaux membres
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau code
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle>Creer un code d'invitation</CardTitle>
            <CardDescription>
              Parametrez les options de votre code d'invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role (optionnel)</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les roles</SelectItem>
                    <SelectItem value={UserRole.DRIVER}>Chauffeur</SelectItem>
                    <SelectItem value={UserRole.VIP}>VIP</SelectItem>
                    <SelectItem value={UserRole.DRIVER_MANAGER}>Responsable Chauffeurs</SelectItem>
                    <SelectItem value={UserRole.VIP_MANAGER}>Responsable VIP</SelectItem>
                    <SelectItem value={UserRole.GENERAL_COORDINATOR}>Coordinateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">Utilisations max (0 = illimite)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="0"
                  value={formData.maxUses}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresInDays">Expire dans (jours)</Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  min="1"
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresInDays: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateInvitation} disabled={isCreating}>
                {isCreating ? 'Creation...' : 'Creer le code'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invitations List */}
      <div className="grid gap-4">
        {invitations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <LinkIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun code d'invitation pour le moment</p>
              <p className="text-sm mt-1">Cliquez sur "Nouveau code" pour commencer</p>
            </CardContent>
          </Card>
        ) : (
          invitations.map((invitation) => {
            const isExpired = invitation.expiresAt && new Date() > new Date(invitation.expiresAt);
            const isMaxedOut = invitation.maxUses > 0 && invitation.usedCount >= invitation.maxUses;

            return (
              <Card key={invitation.id} className={!invitation.isActive || isExpired || isMaxedOut ? 'opacity-60' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Code */}
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-mono font-bold bg-gray-100 px-3 py-1 rounded">
                          {invitation.code}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(invitation.code)}
                        >
                          {copiedCode === invitation.code ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(invitation.code)}
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-2">
                        {invitation.role && (
                          <Badge variant="outline">Role: {invitation.role}</Badge>
                        )}
                        <Badge variant="outline">
                          {invitation.usedCount} / {invitation.maxUses === 0 ? '∞' : invitation.maxUses} utilisations
                        </Badge>
                        {invitation.expiresAt && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expire le {format(new Date(invitation.expiresAt), 'PPP', { locale: fr })}
                          </Badge>
                        )}
                        {!invitation.isActive && <Badge variant="destructive">Desactive</Badge>}
                        {isExpired && <Badge variant="destructive">Expire</Badge>}
                        {isMaxedOut && <Badge variant="destructive">Limite atteinte</Badge>}
                      </div>
                    </div>

                    {/* Actions */}
                    {invitation.isActive && !isExpired && !isMaxedOut && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2 border-red-200 hover:bg-red-50 hover:border-red-300"
                        onClick={() => handleDeactivate(invitation.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <LinkIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Comment ca fonctionne ?</h3>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Creez un code d'invitation avec les parametres souhaites</li>
                <li>Partagez le code ou le lien avec les personnes a inviter</li>
                <li>Ils pourront rejoindre votre festival lors de leur inscription</li>
                <li>Vous pouvez limiter les utilisations et definir une date d'expiration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
