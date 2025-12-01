'use server';

import { db } from '@/lib/db';
import { vips } from '@/lib/db/schema';
import { eq, and, or, like, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

interface CreateVipData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  organization?: string;
  title?: string;
  category?: string;
  notes?: string;
}

interface UpdateVipData extends CreateVipData {
  id: string;
}

export async function createVip(data: CreateVipData) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    await db.insert(vips).values({
      festivalId: userData.dbUser.festivalId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      organization: data.organization || null,
      title: data.title || null,
      category: data.category || null,
      notes: data.notes || null,
    });

    revalidatePath('/dashboard/vips');
    return { success: true };
  } catch (error) {
    console.error('Error creating VIP:', error);
    return { success: false, error: 'Erreur lors de la création du VIP' };
  }
}

export async function updateVip(data: UpdateVipData) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    await db
      .update(vips)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        organization: data.organization || null,
        title: data.title || null,
        category: data.category || null,
        notes: data.notes || null,
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
    console.error('Error updating VIP:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du VIP' };
  }
}

export async function deleteVip(id: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé' };
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
    console.error('Error deleting VIP:', error);
    return { success: false, error: 'Erreur lors de la suppression du VIP' };
  }
}

export async function getVips(searchQuery?: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé', vips: [] };
    }

    let query = db
      .select()
      .from(vips)
      .where(eq(vips.festivalId, userData.dbUser.festivalId))
      .orderBy(desc(vips.createdAt));

    if (searchQuery && searchQuery.length > 0) {
      query = db
        .select()
        .from(vips)
        .where(
          and(
            eq(vips.festivalId, userData.dbUser.festivalId),
            or(
              like(vips.firstName, `%${searchQuery}%`),
              like(vips.lastName, `%${searchQuery}%`),
              like(vips.email, `%${searchQuery}%`),
              like(vips.organization, `%${searchQuery}%`)
            )
          )
        )
        .orderBy(desc(vips.createdAt));
    }

    const result = await query;

    return { success: true, vips: result };
  } catch (error) {
    console.error('Error fetching VIPs:', error);
    return { success: false, error: 'Erreur lors de la récupération des VIPs', vips: [] };
  }
}

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
    console.error('Error fetching VIP:', error);
    return { success: false, error: 'Erreur lors de la récupération du VIP', vip: null };
  }
}

export async function importVipsFromCSV(csvData: Array<CreateVipData>) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé', imported: 0 };
    }

    const vipsToInsert = csvData.map(vip => ({
      festivalId: userData.dbUser.festivalId,
      firstName: vip.firstName,
      lastName: vip.lastName,
      email: vip.email || null,
      phone: vip.phone || null,
      organization: vip.organization || null,
      title: vip.title || null,
      category: vip.category || null,
      notes: vip.notes || null,
    }));

    await db.insert(vips).values(vipsToInsert);

    revalidatePath('/dashboard/vips');
    return { success: true, imported: vipsToInsert.length };
  } catch (error) {
    console.error('Error importing VIPs:', error);
    return { success: false, error: 'Erreur lors de l\'importation des VIPs', imported: 0 };
  }
}
