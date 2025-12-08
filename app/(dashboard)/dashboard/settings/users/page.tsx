import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users as usersTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { UserRole } from '@/types';
import { hasPermission } from '@/lib/utils';
import { UsersListClient } from '@/components/features/users-list-client';

export default async function UsersPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    redirect('/sign-in');
  }

  // Get current user
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!user) {
    redirect('/onboarding');
  }

  const userRole = user.role as UserRole;

  // Check permissions
  if (!hasPermission(userRole, 'MANAGE_USERS')) {
    redirect('/dashboard');
  }

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les utilisateurs, leurs profils et leurs rôles
          </p>
        </div>
      </div>

      {/* Users List */}
      <UsersListClient currentUser={user} />
    </div>
  );
}
