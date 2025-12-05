'use server';

import { db } from '@/lib/db';
import { festivalInvitations, festivals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

/**
 * Generate a unique invitation code
 */
function generateInvitationCode(festivalName: string): string {
  // Create a code like: DINAN2025-ABC123
  const prefix = festivalName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8);

  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `${prefix}${year}-${random}`;
}

/**
 * Create a new invitation code for a festival
 */
export async function createInvitation(data: {
  festivalId: string;
  role?: string;
  maxUses?: number;
  expiresInDays?: number;
}) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorise' };
    }

    // Verify user belongs to the festival
    if (userData.dbUser.festivalId !== data.festivalId) {
      return { success: false, error: 'Non autorise pour ce festival' };
    }

    // Get festival name
    const festival = await db
      .select()
      .from(festivals)
      .where(eq(festivals.id, data.festivalId))
      .limit(1);

    if (festival.length === 0) {
      return { success: false, error: 'Festival non trouve' };
    }

    // Generate unique code
    let code = generateInvitationCode(festival[0].name);
    let attempts = 0;

    // Ensure code is unique
    while (attempts < 10) {
      const existing = await db
        .select()
        .from(festivalInvitations)
        .where(eq(festivalInvitations.code, code))
        .limit(1);

      if (existing.length === 0) break;
      code = generateInvitationCode(festival[0].name);
      attempts++;
    }

    // Calculate expiration
    let expiresAt = null;
    if (data.expiresInDays && data.expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
    }

    // Create invitation
    const [invitation] = await db
      .insert(festivalInvitations)
      .values({
        festivalId: data.festivalId,
        code,
        role: data.role as any || null,
        maxUses: data.maxUses || 0,
        usedCount: 0,
        createdBy: userData.dbUser.id,
        expiresAt,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath('/dashboard/settings');
    return { success: true, invitation };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return { success: false, error: 'Erreur lors de la creation de l\'invitation' };
  }
}

/**
 * Validate and use an invitation code
 */
export async function validateInvitationCode(code: string) {
  try {
    // Find invitation
    const invitations = await db
      .select()
      .from(festivalInvitations)
      .where(eq(festivalInvitations.code, code))
      .limit(1);

    if (invitations.length === 0) {
      return { success: false, error: 'Code d\'invitation invalide' };
    }

    const invitation = invitations[0];

    // Check if active
    if (!invitation.isActive) {
      return { success: false, error: 'Ce code d\'invitation n\'est plus actif' };
    }

    // Check expiration
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      return { success: false, error: 'Ce code d\'invitation a expire' };
    }

    // Check max uses
    if (invitation.maxUses > 0 && invitation.usedCount >= invitation.maxUses) {
      return { success: false, error: 'Ce code d\'invitation a atteint sa limite d\'utilisation' };
    }

    // Get festival info
    const festival = await db
      .select()
      .from(festivals)
      .where(eq(festivals.id, invitation.festivalId))
      .limit(1);

    if (festival.length === 0) {
      return { success: false, error: 'Festival non trouve' };
    }

    return {
      success: true,
      invitation: {
        ...invitation,
        festivalName: festival[0].name,
      },
    };
  } catch (error) {
    console.error('Error validating invitation:', error);
    return { success: false, error: 'Erreur lors de la validation du code' };
  }
}

/**
 * Use an invitation code (increment counter)
 */
export async function useInvitationCode(code: string) {
  try {
    const invitation = await db
      .select()
      .from(festivalInvitations)
      .where(eq(festivalInvitations.code, code))
      .limit(1);

    if (invitation.length === 0) {
      return { success: false, error: 'Code invalide' };
    }

    // Increment used count
    await db
      .update(festivalInvitations)
      .set({
        usedCount: invitation[0].usedCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(festivalInvitations.id, invitation[0].id));

    return { success: true };
  } catch (error) {
    console.error('Error using invitation:', error);
    return { success: false, error: 'Erreur lors de l\'utilisation du code' };
  }
}

/**
 * Get all invitations for a festival
 */
export async function getFestivalInvitations(festivalId: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorise', invitations: [] };
    }

    if (userData.dbUser.festivalId !== festivalId) {
      return { success: false, error: 'Non autorise pour ce festival', invitations: [] };
    }

    const invitations = await db
      .select()
      .from(festivalInvitations)
      .where(eq(festivalInvitations.festivalId, festivalId))
      .orderBy(festivalInvitations.createdAt);

    return { success: true, invitations };
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return { success: false, error: 'Erreur lors de la recuperation des invitations', invitations: [] };
  }
}

/**
 * Deactivate an invitation
 */
export async function deactivateInvitation(invitationId: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorise' };
    }

    await db
      .update(festivalInvitations)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(festivalInvitations.id, invitationId));

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('Error deactivating invitation:', error);
    return { success: false, error: 'Erreur lors de la desactivation' };
  }
}
