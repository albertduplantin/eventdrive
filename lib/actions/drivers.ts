'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, or, like, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

interface GetDriversFilters {
  search?: string;
  isAvailable?: boolean;
}

/**
 * Récupère la liste des chauffeurs pour le festival actuel
 */
export async function getDrivers(filters?: GetDriversFilters) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé', drivers: [] };
    }

    let conditions = [
      eq(users.festivalId, userData.dbUser.festivalId),
      eq(users.role, 'DRIVER'),
    ];

    // Recherche textuelle (nom, prénom, email, téléphone)
    if (filters?.search && filters.search.length > 0) {
      conditions.push(
        or(
          like(users.firstName, `%${filters.search}%`),
          like(users.lastName, `%${filters.search}%`),
          like(users.email, `%${filters.search}%`),
          like(users.phone, `%${filters.search}%`)
        )!
      );
    }

    const result = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(users.lastName, users.firstName);

    return { success: true, drivers: result };
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return { success: false, error: 'Erreur lors de la récupération des chauffeurs', drivers: [] };
  }
}

/**
 * Récupère un chauffeur par son ID
 */
export async function getDriverById(id: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé', driver: null };
    }

    const result = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.festivalId, userData.dbUser.festivalId),
          eq(users.role, 'DRIVER')
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: 'Chauffeur non trouvé', driver: null };
    }

    return { success: true, driver: result[0] };
  } catch (error) {
    console.error('Error fetching driver:', error);
    return { success: false, error: 'Erreur lors de la récupération du chauffeur', driver: null };
  }
}

/**
 * Crée un nouveau chauffeur
 */
export async function createDriver(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
}) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que l'email n'est pas déjà utilisé
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, error: 'Cette adresse email est déjà utilisée' };
    }

    // Créer le chauffeur avec un clerkUserId temporaire
    // Note: L'utilisateur devra se connecter via Clerk pour obtenir un vrai clerkUserId
    const tempClerkUserId = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const [newDriver] = await db
      .insert(users)
      .values({
        clerkUserId: tempClerkUserId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        role: 'DRIVER',
        festivalId: userData.dbUser.festivalId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath('/dashboard/drivers');
    return { success: true, driver: newDriver };
  } catch (error) {
    console.error('Error creating driver:', error);
    return { success: false, error: 'Erreur lors de la création du chauffeur' };
  }
}

/**
 * Met à jour les informations d'un chauffeur
 */
export async function updateDriver(data: {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que le chauffeur appartient au même festival
    const existing = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, data.id),
          eq(users.festivalId, userData.dbUser.festivalId),
          eq(users.role, 'DRIVER')
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Chauffeur non trouvé' };
    }

    await db
      .update(users)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, data.id),
          eq(users.festivalId, userData.dbUser.festivalId)
        )
      );

    revalidatePath('/dashboard/drivers');
    return { success: true };
  } catch (error) {
    console.error('Error updating driver:', error);
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }
}

/**
 * Récupère les statistiques d'un chauffeur
 */
export async function getDriverStats(driverId: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé', stats: null };
    }

    // Cette fonction sera implémentée plus tard quand on aura les missions
    // Pour l'instant, on retourne des stats vides
    const stats = {
      totalMissions: 0,
      completedMissions: 0,
      cancelledMissions: 0,
      totalDistance: 0,
      totalDuration: 0,
      rating: 0,
    };

    return { success: true, stats };
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    return { success: false, error: 'Erreur lors de la récupération des statistiques', stats: null };
  }
}
