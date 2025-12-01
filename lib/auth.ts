import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { UserRole } from '@/types';

/**
 * Get the current authenticated user from the database
 * Syncs with Clerk if user doesn't exist locally
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  // Try to find user in database
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  // If user doesn't exist in DB, they need to complete onboarding
  if (!dbUser) {
    return {
      clerkUser,
      dbUser: null,
      needsOnboarding: true,
    };
  }

  return {
    clerkUser,
    dbUser,
    needsOnboarding: false,
  };
}

/**
 * Get the current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const userData = await getCurrentUser();
  return (userData?.dbUser?.role as UserRole) || null;
}

/**
 * Check if current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  return userRole === role;
}

/**
 * Check if current user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  return userRole !== null && roles.includes(userRole);
}

/**
 * Require authentication or redirect
 */
export async function requireAuth() {
  const userData = await getCurrentUser();

  if (!userData) {
    throw new Error('Unauthorized');
  }

  return userData;
}

/**
 * Require specific role or throw error
 */
export async function requireRole(role: UserRole | UserRole[]) {
  const userData = await getCurrentUser();

  if (!userData?.dbUser) {
    throw new Error('Unauthorized');
  }

  const roles = Array.isArray(role) ? role : [role];

  if (!roles.includes(userData.dbUser.role as UserRole)) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return userData.dbUser;
}
