'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, auditLogs } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { UserRole, type User, type ApiResponse } from '@/types';
import { hasPermission } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

// ============================================
// AUTHORIZATION HELPERS
// ============================================

/**
 * Check if the current user can manage another user
 * Hierarchy rules:
 * - SUPER_ADMIN: can manage anyone
 * - FESTIVAL_ADMIN: can manage all users in their festival
 * - GENERAL_COORDINATOR: can manage all users except SUPER_ADMIN and FESTIVAL_ADMIN
 * - DRIVER_MANAGER: can manage DRIVER users only
 */
async function canManageUser(
  currentUserRole: UserRole,
  currentUserFestivalId: string,
  targetUser: User
): Promise<{ canManage: boolean; reason?: string }> {
  // SUPER_ADMIN can manage anyone
  if (currentUserRole === UserRole.SUPER_ADMIN) {
    return { canManage: true };
  }

  // Check if in same festival
  if (currentUserFestivalId !== targetUser.festivalId) {
    return { canManage: false, reason: 'Vous ne pouvez gérer que les utilisateurs de votre festival' };
  }

  // FESTIVAL_ADMIN can manage all in their festival
  if (currentUserRole === UserRole.FESTIVAL_ADMIN) {
    return { canManage: true };
  }

  // GENERAL_COORDINATOR can manage most users
  if (currentUserRole === UserRole.GENERAL_COORDINATOR) {
    if (targetUser.role === UserRole.SUPER_ADMIN || targetUser.role === UserRole.FESTIVAL_ADMIN) {
      return { canManage: false, reason: 'Vous ne pouvez pas gérer les administrateurs' };
    }
    return { canManage: true };
  }

  // DRIVER_MANAGER can only manage drivers
  if (currentUserRole === UserRole.DRIVER_MANAGER) {
    if (targetUser.role !== UserRole.DRIVER) {
      return { canManage: false, reason: 'Vous ne pouvez gérer que les chauffeurs' };
    }
    return { canManage: true };
  }

  return { canManage: false, reason: 'Permissions insuffisantes' };
}

/**
 * Check if the current user can assign a specific role
 */
function canAssignRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
  // SUPER_ADMIN can assign any role
  if (currentUserRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  // FESTIVAL_ADMIN can assign any role except SUPER_ADMIN
  if (currentUserRole === UserRole.FESTIVAL_ADMIN) {
    return targetRole !== UserRole.SUPER_ADMIN;
  }

  // GENERAL_COORDINATOR can assign limited roles
  if (currentUserRole === UserRole.GENERAL_COORDINATOR) {
    const allowedRoles = [
      UserRole.VIP_MANAGER,
      UserRole.DRIVER_MANAGER,
      UserRole.DRIVER,
      UserRole.VIP,
    ];
    return allowedRoles.includes(targetRole);
  }

  // DRIVER_MANAGER can only assign DRIVER role
  if (currentUserRole === UserRole.DRIVER_MANAGER) {
    return targetRole === UserRole.DRIVER;
  }

  return false;
}

// ============================================
// USER MANAGEMENT ACTIONS
// ============================================

/**
 * Get all users (with filtering)
 */
export async function getUsers(filters?: {
  role?: UserRole;
  festivalId?: string;
  search?: string;
}): Promise<ApiResponse<User[]>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Non authentifié' };
    }

    // Get current user
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!currentUser) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Check permissions
    const userRole = currentUser.role as UserRole;
    if (!hasPermission(userRole, 'MANAGE_USERS')) {
      return { success: false, error: 'Permissions insuffisantes' };
    }

    // Build query based on role
    let allUsers: User[];

    // Apply festival filter based on role
    if (userRole !== UserRole.SUPER_ADMIN) {
      // Non-super-admins can only see users from their festival
      allUsers = await db
        .select()
        .from(users)
        .where(eq(users.festivalId, currentUser.festivalId));
    } else if (filters?.festivalId) {
      // Super admins can filter by festival
      allUsers = await db
        .select()
        .from(users)
        .where(eq(users.festivalId, filters.festivalId));
    } else {
      // Super admins can see all users
      allUsers = await db.select().from(users);
    }

    // Apply role filter
    let filteredUsers = allUsers;
    if (filters?.role) {
      filteredUsers = filteredUsers.filter(u => u.role === filters.role);
    }

    // Apply search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(u =>
        u.firstName?.toLowerCase().includes(searchLower) ||
        u.lastName?.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Filter based on management permissions
    if (userRole === UserRole.GENERAL_COORDINATOR) {
      // Can't see SUPER_ADMIN or FESTIVAL_ADMIN
      filteredUsers = filteredUsers.filter(u =>
        u.role !== UserRole.SUPER_ADMIN && u.role !== UserRole.FESTIVAL_ADMIN
      );
    } else if (userRole === UserRole.DRIVER_MANAGER) {
      // Can only see drivers
      filteredUsers = filteredUsers.filter(u => u.role === UserRole.DRIVER);
    }

    return { success: true, data: filteredUsers };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Erreur lors de la récupération des utilisateurs' };
  }
}

/**
 * Get a single user by ID
 */
export async function getUserById(userId: string): Promise<ApiResponse<User>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Non authentifié' };
    }

    // Get current user
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!currentUser) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Check permissions
    const userRole = currentUser.role as UserRole;
    if (!hasPermission(userRole, 'MANAGE_USERS')) {
      return { success: false, error: 'Permissions insuffisantes' };
    }

    // Get target user
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Check if can manage this user
    const { canManage, reason } = await canManageUser(
      userRole,
      currentUser.festivalId,
      targetUser
    );

    if (!canManage) {
      return { success: false, error: reason || 'Permissions insuffisantes' };
    }

    return { success: true, data: targetUser };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, error: 'Erreur lors de la récupération de l\'utilisateur' };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    preferences?: User['preferences'];
  }
): Promise<ApiResponse<User>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Non authentifié' };
    }

    // Get current user
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!currentUser) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Get target user
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Check if can manage this user
    const userRole = currentUser.role as UserRole;
    const { canManage, reason } = await canManageUser(
      userRole,
      currentUser.festivalId,
      targetUser
    );

    if (!canManage) {
      return { success: false, error: reason || 'Permissions insuffisantes' };
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Log audit
    await db.insert(auditLogs).values({
      festivalId: targetUser.festivalId,
      userId: currentUser.id,
      action: 'user_profile_updated',
      entityType: 'user',
      entityId: userId,
      oldData: targetUser,
      newData: updatedUser,
    });

    revalidatePath('/dashboard/settings/users');
    revalidatePath(`/dashboard/settings/users/${userId}/edit`);

    return { success: true, data: updatedUser, message: 'Profil mis à jour avec succès' };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du profil' };
  }
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<ApiResponse<User>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Non authentifié' };
    }

    // Get current user
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!currentUser) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Get target user
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Check if can manage this user
    const userRole = currentUser.role as UserRole;
    const { canManage, reason } = await canManageUser(
      userRole,
      currentUser.festivalId,
      targetUser
    );

    if (!canManage) {
      return { success: false, error: reason || 'Permissions insuffisantes' };
    }

    // Check if can assign this role
    if (!canAssignRole(userRole, newRole)) {
      return { success: false, error: 'Vous ne pouvez pas attribuer ce rôle' };
    }

    // Prevent changing own role
    if (targetUser.id === currentUser.id) {
      return { success: false, error: 'Vous ne pouvez pas modifier votre propre rôle' };
    }

    // Update role
    const [updatedUser] = await db
      .update(users)
      .set({
        role: newRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Log audit
    await db.insert(auditLogs).values({
      festivalId: targetUser.festivalId,
      userId: currentUser.id,
      action: 'user_role_changed',
      entityType: 'user',
      entityId: userId,
      oldData: { role: targetUser.role },
      newData: { role: newRole },
    });

    revalidatePath('/dashboard/settings/users');
    revalidatePath(`/dashboard/settings/users/${userId}/edit`);

    return { success: true, data: updatedUser, message: 'Rôle mis à jour avec succès' };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du rôle' };
  }
}

/**
 * Get available roles for assignment (based on current user's role)
 */
export async function getAvailableRoles(): Promise<ApiResponse<UserRole[]>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Non authentifié' };
    }

    // Get current user
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!currentUser) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    const userRole = currentUser.role as UserRole;

    let availableRoles: UserRole[] = [];

    if (userRole === UserRole.SUPER_ADMIN) {
      availableRoles = Object.values(UserRole);
    } else if (userRole === UserRole.FESTIVAL_ADMIN) {
      availableRoles = [
        UserRole.FESTIVAL_ADMIN,
        UserRole.GENERAL_COORDINATOR,
        UserRole.VIP_MANAGER,
        UserRole.DRIVER_MANAGER,
        UserRole.DRIVER,
        UserRole.VIP,
      ];
    } else if (userRole === UserRole.GENERAL_COORDINATOR) {
      availableRoles = [
        UserRole.VIP_MANAGER,
        UserRole.DRIVER_MANAGER,
        UserRole.DRIVER,
        UserRole.VIP,
      ];
    } else if (userRole === UserRole.DRIVER_MANAGER) {
      availableRoles = [UserRole.DRIVER];
    }

    return { success: true, data: availableRoles };
  } catch (error) {
    console.error('Error fetching available roles:', error);
    return { success: false, error: 'Erreur lors de la récupération des rôles' };
  }
}
