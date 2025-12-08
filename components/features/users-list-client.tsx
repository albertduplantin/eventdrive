'use client';

import { useState, useEffect } from 'react';
import { User as UserIcon, Search, Pencil, Shield, Filter } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getUsers, getAvailableRoles } from '@/lib/actions/users';
import { UserRole, type User } from '@/types';
import { ChangeRoleDialog } from '@/components/features/change-role-dialog';

interface UsersListClientProps {
  currentUser: User;
}

export function UsersListClient({ currentUser }: UsersListClientProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);

  // Load users
  useEffect(() => {
    loadUsers();
    loadAvailableRoles();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(searchLower) ||
          u.lastName?.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter]);

  async function loadUsers() {
    setLoading(true);
    const result = await getUsers();
    if (result.success && result.data) {
      setUsers(result.data);
      setFilteredUsers(result.data);
    }
    setLoading(false);
  }

  async function loadAvailableRoles() {
    const result = await getAvailableRoles();
    if (result.success && result.data) {
      setAvailableRoles(result.data);
    }
  }

  function getRoleLabel(role: UserRole): string {
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

  function getRoleBadgeStyle(role: UserRole): string {
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Utilisateurs</CardTitle>
              <CardDescription>
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as UserRole | 'ALL')}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les rôles</SelectItem>
                {Object.values(UserRole).map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {searchQuery || roleFilter !== 'ALL'
                  ? 'Aucun utilisateur trouvé'
                  : 'Aucun utilisateur'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="px-4 py-3 text-left text-sm font-medium">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Téléphone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Rôle</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/10 dark:bg-white/10">
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            {user.id === currentUser.id && (
                              <div className="text-xs text-muted-foreground">(Vous)</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">{user.email}</td>
                      <td className="px-4 py-4 text-sm">{user.phone || '-'}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-medium ${getRoleBadgeStyle(
                            user.role as UserRole
                          )}`}
                        >
                          {getRoleLabel(user.role as UserRole)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            disabled={user.id === currentUser.id}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Changer le rôle
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/settings/users/${user.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <ChangeRoleDialog
        user={selectedUser}
        availableRoles={availableRoles}
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
        onSuccess={() => {
          setSelectedUser(null);
          loadUsers();
        }}
      />
    </>
  );
}
