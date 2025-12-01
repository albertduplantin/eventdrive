'use server';

import { db } from '@/lib/db';
import { users, festivals } from '@/lib/db/schema';
import { UserRole } from '@/types';
import { eq } from 'drizzle-orm';

interface OnboardingData {
  clerkUserId: string;
  email: string;
  festivalId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

export async function completeOnboarding(data: OnboardingData) {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, data.clerkUserId))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, error: 'Utilisateur déjà enregistré' };
    }

    // For now, create a default festival if festivalId is not a UUID
    // TODO: Handle festival creation properly
    let actualFestivalId = data.festivalId;

    // Check if festivalId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(data.festivalId)) {
      // Create a new festival
      const now = new Date();
      const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

      const newFestival = await db
        .insert(festivals)
        .values({
          name: data.festivalId, // Using the input as festival name
          slug: data.festivalId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          startDate: now,
          endDate: nextYear,
          subscriptionPlan: 'FREE',
          subscriptionStatus: 'ACTIVE',
        })
        .returning({ id: festivals.id });

      actualFestivalId = newFestival[0].id;
    }

    // Create user profile
    await db.insert(users).values({
      festivalId: actualFestivalId,
      clerkUserId: data.clerkUserId,
      email: data.email,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      address: data.address || null,
    });

    return { success: true };
  } catch (error) {
    console.error('Onboarding error:', error);
    return {
      success: false,
      error: 'Erreur lors de la création du profil',
    };
  }
}
