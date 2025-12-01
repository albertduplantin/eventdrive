'use server';

import { db } from '@/lib/db';
import { driverAvailabilities, users } from '@/lib/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING';

interface CreateAvailabilityData {
  driverId: string;
  date: Date;
  slot: TimeSlot;
  isAvailable: boolean;
  notes?: string;
}

interface CreateRecurringAvailabilityData {
  driverId: string;
  startDate: Date;
  endDate: Date;
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  allMornings?: boolean;
  allAfternoons?: boolean;
  allEvenings?: boolean;
}

/**
 * Récupère les disponibilités d'un chauffeur pour une période donnée
 */
export async function getDriverAvailabilities(driverId: string, startDate: Date, endDate: Date) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé', availabilities: [] };
    }

    // Vérifier que le chauffeur appartient au même festival
    const driver = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, driverId),
          eq(users.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (driver.length === 0) {
      return { success: false, error: 'Chauffeur non trouvé', availabilities: [] };
    }

    const availabilities = await db
      .select()
      .from(driverAvailabilities)
      .where(
        and(
          eq(driverAvailabilities.driverId, driverId),
          gte(driverAvailabilities.date, startDate),
          lte(driverAvailabilities.date, endDate)
        )
      )
      .orderBy(driverAvailabilities.date, driverAvailabilities.slot);

    return { success: true, availabilities };
  } catch (error) {
    console.error('Error fetching availabilities:', error);
    return { success: false, error: 'Erreur lors de la récupération des disponibilités', availabilities: [] };
  }
}

/**
 * Crée ou met à jour une disponibilité
 */
export async function setDriverAvailability(data: CreateAvailabilityData) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que le chauffeur appartient au même festival
    const driver = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, data.driverId),
          eq(users.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (driver.length === 0) {
      return { success: false, error: 'Chauffeur non trouvé' };
    }

    // Normaliser la date (sans heure)
    const normalizedDate = new Date(data.date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Vérifier si une disponibilité existe déjà
    const existing = await db
      .select()
      .from(driverAvailabilities)
      .where(
        and(
          eq(driverAvailabilities.driverId, data.driverId),
          eq(driverAvailabilities.date, normalizedDate),
          eq(driverAvailabilities.slot, data.slot)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Mettre à jour
      await db
        .update(driverAvailabilities)
        .set({
          isAvailable: data.isAvailable,
          updatedAt: new Date(),
        })
        .where(eq(driverAvailabilities.id, existing[0].id));
    } else {
      // Créer
      await db.insert(driverAvailabilities).values({
        driverId: data.driverId,
        festivalId: userData.dbUser.festivalId,
        date: normalizedDate,
        slot: data.slot,
        isAvailable: data.isAvailable,
      });
    }

    revalidatePath(`/dashboard/drivers/${data.driverId}`);
    revalidatePath('/dashboard/drivers');
    return { success: true };
  } catch (error) {
    console.error('Error setting availability:', error);
    return { success: false, error: 'Erreur lors de l\'enregistrement de la disponibilité' };
  }
}

/**
 * Crée des disponibilités récurrentes
 */
export async function createRecurringAvailability(data: CreateRecurringAvailabilityData) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que le chauffeur appartient au même festival
    const driver = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, data.driverId),
          eq(users.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (driver.length === 0) {
      return { success: false, error: 'Chauffeur non trouvé' };
    }

    const slots: TimeSlot[] = [];
    if (data.allMornings) slots.push('MORNING');
    if (data.allAfternoons) slots.push('AFTERNOON');
    if (data.allEvenings) slots.push('EVENING');

    if (slots.length === 0) {
      return { success: false, error: 'Aucun créneau horaire sélectionné' };
    }

    // Générer toutes les dates entre startDate et endDate
    const currentDate = new Date(data.startDate);
    currentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(data.endDate);
    endDate.setHours(0, 0, 0, 0);

    const availabilitiesToCreate = [];

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      // Vérifier si ce jour de la semaine est sélectionné
      if (data.daysOfWeek.includes(dayOfWeek)) {
        for (const slot of slots) {
          availabilitiesToCreate.push({
            driverId: data.driverId,
            festivalId: userData.dbUser.festivalId,
            date: new Date(currentDate),
            slot,
            isAvailable: true,
            recurringPattern: {
              daysOfWeek: data.daysOfWeek,
              allMornings: data.allMornings,
              allAfternoons: data.allAfternoons,
              allEvenings: data.allEvenings,
            },
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (availabilitiesToCreate.length === 0) {
      return { success: false, error: 'Aucune disponibilité à créer avec ces paramètres' };
    }

    // Insérer toutes les disponibilités
    await db.insert(driverAvailabilities).values(availabilitiesToCreate);

    revalidatePath(`/dashboard/drivers/${data.driverId}`);
    revalidatePath('/dashboard/drivers');
    return {
      success: true,
      created: availabilitiesToCreate.length,
      message: `${availabilitiesToCreate.length} disponibilité(s) créée(s)`
    };
  } catch (error) {
    console.error('Error creating recurring availability:', error);
    return { success: false, error: 'Erreur lors de la création des disponibilités récurrentes' };
  }
}

/**
 * Supprime une disponibilité
 */
export async function deleteAvailability(id: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que la disponibilité appartient à un chauffeur du même festival
    const availability = await db
      .select({
        id: driverAvailabilities.id,
        driverId: driverAvailabilities.driverId,
        festivalId: users.festivalId,
      })
      .from(driverAvailabilities)
      .innerJoin(users, eq(driverAvailabilities.driverId, users.id))
      .where(eq(driverAvailabilities.id, id))
      .limit(1);

    if (availability.length === 0) {
      return { success: false, error: 'Disponibilité non trouvée' };
    }

    if (availability[0].festivalId !== userData.dbUser.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    await db.delete(driverAvailabilities).where(eq(driverAvailabilities.id, id));

    revalidatePath(`/dashboard/drivers/${availability[0].driverId}`);
    revalidatePath('/dashboard/drivers');
    return { success: true };
  } catch (error) {
    console.error('Error deleting availability:', error);
    return { success: false, error: 'Erreur lors de la suppression' };
  }
}

/**
 * Supprime toutes les disponibilités d'un chauffeur pour une période
 */
export async function clearDriverAvailabilities(driverId: string, startDate: Date, endDate: Date) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que le chauffeur appartient au même festival
    const driver = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, driverId),
          eq(users.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (driver.length === 0) {
      return { success: false, error: 'Chauffeur non trouvé' };
    }

    await db
      .delete(driverAvailabilities)
      .where(
        and(
          eq(driverAvailabilities.driverId, driverId),
          gte(driverAvailabilities.date, startDate),
          lte(driverAvailabilities.date, endDate)
        )
      );

    revalidatePath(`/dashboard/drivers/${driverId}`);
    revalidatePath('/dashboard/drivers');
    return { success: true };
  } catch (error) {
    console.error('Error clearing availabilities:', error);
    return { success: false, error: 'Erreur lors de la suppression des disponibilités' };
  }
}
