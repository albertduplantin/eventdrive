'use server';

import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { festivalInvitations, festivals, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { UserRole, type ApiResponse } from '@/types';
import { hasPermission } from '@/lib/utils';

// ============================================
// HELPERS
// ============================================

function generateInvitationCode(festivalSlug: string, role?: UserRole): string {
  const rolePrefix = role ? role.substring(0, 3).toUpperCase() : 'GEN';
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${festivalSlug.toUpperCase()}-${rolePrefix}-${randomPart}`;
}

function canAssignRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
  if (currentUserRole === UserRole.SUPER_ADMIN) return true;
  if (currentUserRole === UserRole.FESTIVAL_ADMIN) return targetRole !== UserRole.SUPER_ADMIN;
  if (currentUserRole === UserRole.GENERAL_COORDINATOR) {
    const allowedRoles = [UserRole.VIP_MANAGER, UserRole.DRIVER_MANAGER, UserRole.DRIVER, UserRole.VIP];
    return allowedRoles.includes(targetRole);
  }
  if (currentUserRole === UserRole.DRIVER_MANAGER) return targetRole === UserRole.DRIVER;
  return false;
}

// ============================================
// ACTIONS
// ============================================

export async function createInvitation(data: {
  role?: UserRole;
  maxUses?: number;
  expiresInDays?: number;
}): Promise<ApiResponse<typeof festivalInvitations.$inferSelect>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { success: false, error: 'Non authentifié' };

    const [currentUser] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!currentUser) return { success: false, error: 'Utilisateur non trouvé' };

    const userRole = currentUser.role as UserRole;
    if (!hasPermission(userRole, 'MANAGE_USERS')) {
      return { success: false, error: 'Permissions insuffisantes' };
    }

    const [festival] = await db.select().from(festivals).where(eq(festivals.id, currentUser.festivalId)).limit(1);
    if (!festival) return { success: false, error: 'Festival non trouvé' };

    if (data.role && !canAssignRole(userRole, data.role)) {
      return { success: false, error: 'Vous ne pouvez pas créer une invitation pour ce rôle' };
    }

    let code = generateInvitationCode(festival.slug, data.role);
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.select().from(festivalInvitations).where(eq(festivalInvitations.code, code)).limit(1);
      if (existing.length === 0) break;
      code = generateInvitationCode(festival.slug, data.role);
      attempts++;
    }

    let expiresAt: Date | null = null;
    if (data.expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
    }

    const [invitation] = await db
      .insert(festivalInvitations)
      .values({
        festivalId: currentUser.festivalId,
        code,
        role: data.role,
        maxUses: data.maxUses || 0,
        usedCount: 0,
        createdBy: currentUser.id,
        expiresAt,
        isActive: true,
      })
      .returning();

    revalidatePath('/dashboard/invitations');
    return { success: true, data: invitation, message: 'Invitation créée avec succès' };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return { success: false, error: 'Erreur lors de la création de l\'invitation' };
  }
}

export async function getInvitations(): Promise<ApiResponse<(typeof festivalInvitations.$inferSelect)[]>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { success: false, error: 'Non authentifié' };

    const [currentUser] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!currentUser) return { success: false, error: 'Utilisateur non trouvé' };

    const userRole = currentUser.role as UserRole;
    if (!hasPermission(userRole, 'MANAGE_USERS')) {
      return { success: false, error: 'Permissions insuffisantes' };
    }

    const invitations = await db
      .select()
      .from(festivalInvitations)
      .where(eq(festivalInvitations.festivalId, currentUser.festivalId))
      .orderBy(desc(festivalInvitations.createdAt));

    return { success: true, data: invitations };
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return { success: false, error: 'Erreur lors de la récupération des invitations' };
  }
}

export async function deactivateInvitation(invitationId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { success: false, error: 'Non authentifié' };

    const [currentUser] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (!currentUser) return { success: false, error: 'Utilisateur non trouvé' };

    const userRole = currentUser.role as UserRole;
    if (!hasPermission(userRole, 'MANAGE_USERS')) {
      return { success: false, error: 'Permissions insuffisantes' };
    }

    const [invitation] = await db.select().from(festivalInvitations).where(eq(festivalInvitations.id, invitationId)).limit(1);
    if (!invitation) return { success: false, error: 'Invitation non trouvée' };

    if (invitation.festivalId !== currentUser.festivalId) {
      return { success: false, error: 'Permissions insuffisantes' };
    }

    await db.update(festivalInvitations).set({ isActive: false }).where(eq(festivalInvitations.id, invitationId));

    revalidatePath('/dashboard/invitations');
    return { success: true, message: 'Invitation désactivée' };
  } catch (error) {
    console.error('Error deactivating invitation:', error);
    return { success: false, error: 'Erreur lors de la désactivation' };
  }
}

export async function validateInvitationCode(
  code: string
): Promise<ApiResponse<{
  invitation: typeof festivalInvitations.$inferSelect;
  festival: typeof festivals.$inferSelect;
}>> {
  try {
    const [invitation] = await db.select().from(festivalInvitations).where(eq(festivalInvitations.code, code)).limit(1);
    if (!invitation) return { success: false, error: 'Code d\'invitation invalide' };

    if (!invitation.isActive) return { success: false, error: 'Cette invitation n\'est plus active' };
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      return { success: false, error: 'Cette invitation a expiré' };
    }
    if (invitation.maxUses && invitation.maxUses > 0 && invitation.usedCount >= invitation.maxUses) {
      return { success: false, error: 'Cette invitation a atteint son nombre maximum d\'utilisations' };
    }

    const [festival] = await db.select().from(festivals).where(eq(festivals.id, invitation.festivalId)).limit(1);
    if (!festival) return { success: false, error: 'Festival non trouvé' };

    return { success: true, data: { invitation, festival } };
  } catch (error) {
    console.error('Error validating invitation:', error);
    return { success: false, error: 'Erreur lors de la validation' };
  }
}

export async function useInvitationCode(code: string): Promise<ApiResponse<{
  user: typeof users.$inferSelect;
  festival: typeof festivals.$inferSelect;
}>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: 'Vous devez être connecté pour utiliser une invitation' };
    }

    const validationResult = await validateInvitationCode(code);
    if (!validationResult.success || !validationResult.data) {
      return { success: false, error: validationResult.error };
    }

    const { invitation, festival } = validationResult.data;

    // Check if user already exists in this festival
    const existingUsers = await db
      .select()
      .from(users)
      .where(and(eq(users.clerkUserId, clerkUserId), eq(users.festivalId, festival.id)));

    if (existingUsers.length > 0) {
      return { success: true, data: { user: existingUsers[0], festival }, message: 'Vous êtes déjà membre de ce festival' };
    }

    // Get Clerk user data
    const clerkUser = await clerkCurrentUser();

    // Create user in database
    const [newUser] = await db
      .insert(users)
      .values({
        festivalId: festival.id,
        clerkUserId,
        email: clerkUser?.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser?.firstName || '',
        lastName: clerkUser?.lastName || '',
        role: invitation.role || UserRole.VIP,
        preferences: { notificationChannels: ['EMAIL'] },
      })
      .returning();

    // Increment invitation usage
    await db
      .update(festivalInvitations)
      .set({ usedCount: invitation.usedCount + 1 })
      .where(eq(festivalInvitations.id, invitation.id));

    return { success: true, data: { user: newUser, festival }, message: 'Bienvenue ! Vous avez rejoint le festival' };
  } catch (error) {
    console.error('Error using invitation:', error);
    return { success: false, error: 'Erreur lors de l\'utilisation de l\'invitation' };
  }
}
