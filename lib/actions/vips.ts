'use server';

import { db } from '@/lib/db';
import { vips } from '@/lib/db/schema';
import { eq, and, or, like } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

/**
 * Récupère la liste des VIPs pour le festival actuel
 */
export async function getVips(searchQuery?: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé', vips: [] };
    }

    let conditions = [
      eq(vips.festivalId, userData.dbUser.festivalId),
    ];

    // Recherche textuelle
    if (searchQuery && searchQuery.length > 0) {
      conditions.push(
        or(
          like(vips.firstName, `%${searchQuery}%`),
          like(vips.lastName, `%${searchQuery}%`),
          like(vips.email, `%${searchQuery}%`),
          like(vips.phone, `%${searchQuery}%`)
        )!
      );
    }

    const result = await db
      .select()
      .from(vips)
      .where(and(...conditions))
      .orderBy(vips.lastName, vips.firstName);

    return { success: true, vips: result };
  } catch (error) {
    console.error('Error fetching vips:', error);
    return { success: false, error: 'Erreur lors de la récupération des VIPs', vips: [] };
  }
}

/**
 * Récupère un VIP par son ID
 */
export async function getVipById(id: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé', vip: null };
    }

    const result = await db
      .select()
      .from(vips)
      .where(
        and(
          eq(vips.id, id),
          eq(vips.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: 'VIP non trouvé', vip: null };
    }

    return { success: true, vip: result[0] };
  } catch (error) {
    console.error('Error fetching vip:', error);
    return { success: false, error: 'Erreur lors de la récupération du VIP', vip: null };
  }
}

/**
 * Crée un nouveau VIP
 */
export async function createVip(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  organization?: string;
  title?: string;
  category?: string;
  notes?: string;
}) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    // Créer le VIP
    const [newVip] = await db
      .insert(vips)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        organization: data.organization || null,
        title: data.title || null,
        category: data.category || null,
        notes: data.notes || null,
        festivalId: userData.dbUser.festivalId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath('/dashboard/vips');
    return { success: true, vip: newVip };
  } catch (error) {
    console.error('Error creating vip:', error);
    return { success: false, error: 'Erreur lors de la création du VIP' };
  }
}

/**
 * Met à jour les informations d'un VIP
 */
export async function updateVip(data: {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  organization?: string;
  title?: string;
  category?: string;
  notes?: string;
}) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que le VIP appartient au même festival
    const existing = await db
      .select()
      .from(vips)
      .where(
        and(
          eq(vips.id, data.id),
          eq(vips.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'VIP non trouvé' };
    }

    await db
      .update(vips)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        organization: data.organization,
        title: data.title,
        category: data.category,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(vips.id, data.id),
          eq(vips.festivalId, userData.dbUser.festivalId)
        )
      );

    revalidatePath('/dashboard/vips');
    return { success: true };
  } catch (error) {
    console.error('Error updating vip:', error);
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }
}

/**
 * Supprime un VIP
 */
export async function deleteVip(id: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que le VIP appartient au même festival
    const existing = await db
      .select()
      .from(vips)
      .where(
        and(
          eq(vips.id, id),
          eq(vips.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'VIP non trouvé' };
    }

    await db
      .delete(vips)
      .where(
        and(
          eq(vips.id, id),
          eq(vips.festivalId, userData.dbUser.festivalId)
        )
      );

    revalidatePath('/dashboard/vips');
    return { success: true };
  } catch (error) {
    console.error('Error deleting vip:', error);
    return { success: false, error: 'Erreur lors de la suppression' };
  }
}
