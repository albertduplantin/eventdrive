import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users as usersTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { UserRole } from '@/types';
import { hasPermission } from '@/lib/utils';
import { UserEditForm } from '@/components/features/user-edit-form';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserEditPage({ params }: PageProps) {
  const { id } = await params;
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect('/sign-in');
  }

  // Get current user
  const [currentUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!currentUser) {
    redirect('/onboarding');
  }

  const userRole = currentUser.role as UserRole;

  // Check permissions
  if (!hasPermission(userRole, 'MANAGE_USERS')) {
    redirect('/dashboard');
  }

  // Get target user
  const [targetUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!targetUser) {
    redirect('/dashboard/settings/users');
  }

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Modifier l&apos;utilisateur
          </h1>
          <p className="text-muted-foreground mt-2">
            {targetUser.firstName} {targetUser.lastName}
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <UserEditForm user={targetUser} currentUser={currentUser} />
    </div>
  );
}
