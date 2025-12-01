'use server';

import { db } from '@/lib/db';
import { driverAvailabilities } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING';

interface SetMyAvailabilityData {
  date: Date;
  slot: TimeSlot;
  isAvailable: boolean;
  notes?: string;
}

interface CreateMyRecurringAvailabilityData {
  startDate: Date;
  endDate: Date;
  daysOfWeek: number[];
  allMornings?: boolean;
  allAfternoons?: boolean;
  allEvenings?: boolean;
}

/**
 * Récupère mes propres disponibilités pour une période donnée
 */
export async function getMyAvailabilities(startDate: Date, endDate: Date) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser || userData.dbUser.role !== 'DRIVER') {
      return { success: false, error: 'Non autorisé', availabilities: [] };
    }

    const availabilities = await db
      .select()
      .from(driverAvailabilities)
      .where(
        and(
          eq(driverAvailabilities.driverId, userData.dbUser.id),
          gte(driverAvailabilities.date, startDate),
          lte(driverAvailabilities.date, endDate)
        )
      )
      .orderBy(driverAvailabilities.date, driverAvailabilities.slot);

    return { success: true, availabilities };
  } catch (error) {
    console.error('Error fetching my availabilities:', error);
    return { success: false, error: 'Erreur lors de la récupération des disponibilités', availabilities: [] };
  }
}

/**
 * Définit ma propre disponibilité
 */
export async function setMyAvailability(data: SetMyAvailabilityData) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser || userData.dbUser.role !== 'DRIVER') {
      return { success: false, error: 'Non autorisé' };
    }

    // Normaliser la date
    const normalizedDate = new Date(data.date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Vérifier si une disponibilité existe déjà
    const existing = await db
      .select()
      .from(driverAvailabilities)
      .where(
        and(
          eq(driverAvailabilities.driverId, userData.dbUser.id),
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
        driverId: userData.dbUser.id,
        festivalId: userData.dbUser.festivalId,
        date: normalizedDate,
        slot: data.slot,
        isAvailable: data.isAvailable,
      });
    }

    revalidatePath('/my-availability');
    return { success: true };
  } catch (error) {
    console.error('Error setting my availability:', error);
    return { success: false, error: 'Erreur lors de l\'enregistrement de la disponibilité' };
  }
}

/**
 * Crée mes disponibilités récurrentes
 */
export async function createMyRecurringAvailability(data: CreateMyRecurringAvailabilityData) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser || userData.dbUser.role !== 'DRIVER') {
      return { success: false, error: 'Non autorisé' };
    }

    const slots: TimeSlot[] = [];
    if (data.allMornings) slots.push('MORNING');
    if (data.allAfternoons) slots.push('AFTERNOON');
    if (data.allEvenings) slots.push('EVENING');

    if (slots.length === 0) {
      return { success: false, error: 'Aucun créneau horaire sélectionné' };
    }

    // Générer toutes les dates
    const currentDate = new Date(data.startDate);
    currentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(data.endDate);
    endDate.setHours(0, 0, 0, 0);

    const availabilitiesToCreate = [];

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      if (data.daysOfWeek.includes(dayOfWeek)) {
        for (const slot of slots) {
          availabilitiesToCreate.push({
            driverId: userData.dbUser.id,
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

    await db.insert(driverAvailabilities).values(availabilitiesToCreate);

    revalidatePath('/my-availability');
    return {
      success: true,
      created: availabilitiesToCreate.length,
      message: `${availabilitiesToCreate.length} disponibilité(s) créée(s)`
    };
  } catch (error) {
    console.error('Error creating my recurring availability:', error);
    return { success: false, error: 'Erreur lors de la création des disponibilités récurrentes' };
  }
}

/**
 * Supprime mes disponibilités pour une période
 */
export async function clearMyAvailabilities(startDate: Date, endDate: Date) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser || userData.dbUser.role !== 'DRIVER') {
      return { success: false, error: 'Non autorisé' };
    }

    await db
      .delete(driverAvailabilities)
      .where(
        and(
          eq(driverAvailabilities.driverId, userData.dbUser.id),
          gte(driverAvailabilities.date, startDate),
          lte(driverAvailabilities.date, endDate)
        )
      );

    revalidatePath('/my-availability');
    return { success: true };
  } catch (error) {
    console.error('Error clearing my availabilities:', error);
    return { success: false, error: 'Erreur lors de la suppression des disponibilités' };
  }
}
