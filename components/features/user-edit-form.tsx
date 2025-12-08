'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { updateUserProfile } from '@/lib/actions/users';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface UserEditFormProps {
  user: User;
  currentUser: User;
}

export function UserEditForm({ user, currentUser }: UserEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    address: user.address || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateUserProfile(user.id, formData);

      if (result.success) {
        toast({
          title: 'Profil mis à jour',
          description: result.message || 'Le profil a été modifié avec succès',
        });
        router.push('/dashboard/settings/users');
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

  const hasChanges =
    formData.firstName !== (user.firstName || '') ||
    formData.lastName !== (user.lastName || '') ||
    formData.phone !== (user.phone || '') ||
    formData.address !== (user.address || '');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back Button */}
      <div>
        <Button variant="ghost" asChild>
          <Link href="/dashboard/settings/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du profil</CardTitle>
          <CardDescription>
            Modifiez les informations personnelles de l&apos;utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-black/10 dark:bg-white/10">
              <UserIcon className="h-10 w-10" />
            </div>
            <div>
              <p className="text-sm font-medium">Photo de profil</p>
              <p className="text-sm text-muted-foreground">
                La photo de profil est gérée via le système d&apos;authentification
              </p>
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
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

          {/* First Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prénom *</label>
            <Input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="Prénom"
              required
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom *</label>
            <Input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Nom"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Téléphone</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Adresse</label>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Adresse complète"
            />
            <p className="text-xs text-muted-foreground">
              Utilisée pour les chauffeurs (calcul des distances)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/settings/users')}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={!hasChanges || loading}
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </form>
  );
}
