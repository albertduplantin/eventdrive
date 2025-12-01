'use server';

import { db } from '@/lib/db';
import { transportRequests, users, vips } from '@/lib/db/schema';
import { eq, and, or, like, desc, gte, lte, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import type { TransportType, RequestStatus } from '@/types';

interface CreateTransportRequestData {
  vipId: string;
  type: TransportType;
  pickupAddress: string;
  dropoffAddress: string;
  requestedDatetime: Date;
  passengerCount?: number;
  notes?: string;
  estimatedDurationMinutes?: number;
}

interface UpdateTransportRequestData extends CreateTransportRequestData {
  id: string;
}

interface GetTransportsFilters {
  status?: RequestStatus;
  type?: TransportType;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

export async function createTransportRequest(data: CreateTransportRequestData) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que le VIP appartient au même festival
    const vip = await db
      .select()
      .from(vips)
      .where(
        and(
          eq(vips.id, data.vipId),
          eq(vips.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (vip.length === 0) {
      return { success: false, error: 'VIP non trouvé' };
    }

    await db.insert(transportRequests).values({
      festivalId: userData.dbUser.festivalId,
      vipId: data.vipId,
      createdById: userData.dbUser.id,
      type: data.type,
      pickupAddress: data.pickupAddress,
      dropoffAddress: data.dropoffAddress,
      requestedDatetime: data.requestedDatetime,
      passengerCount: data.passengerCount || 1,
      notes: data.notes || null,
      estimatedDurationMinutes: data.estimatedDurationMinutes || null,
      status: 'PENDING',
    });

    revalidatePath('/dashboard/transports');
    return { success: true };
  } catch (error) {
    console.error('Error creating transport request:', error);
    return { success: false, error: 'Erreur lors de la création de la demande' };
  }
}

export async function updateTransportRequest(data: UpdateTransportRequestData) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que la demande appartient au même festival
    const existing = await db
      .select()
      .from(transportRequests)
      .where(
        and(
          eq(transportRequests.id, data.id),
          eq(transportRequests.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Demande non trouvée' };
    }

    // Ne pas permettre la modification si déjà assignée
    if (existing[0].status === 'ASSIGNED' || existing[0].status === 'IN_PROGRESS' || existing[0].status === 'COMPLETED') {
      return { success: false, error: 'Impossible de modifier une demande déjà assignée ou en cours' };
    }

    await db
      .update(transportRequests)
      .set({
        vipId: data.vipId,
        type: data.type,
        pickupAddress: data.pickupAddress,
        dropoffAddress: data.dropoffAddress,
        requestedDatetime: data.requestedDatetime,
        passengerCount: data.passengerCount || 1,
        notes: data.notes || null,
        estimatedDurationMinutes: data.estimatedDurationMinutes || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(transportRequests.id, data.id),
          eq(transportRequests.festivalId, userData.dbUser.festivalId)
        )
      );

    revalidatePath('/dashboard/transports');
    return { success: true };
  } catch (error) {
    console.error('Error updating transport request:', error);
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }
}

export async function cancelTransportRequest(id: string, reason: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    const existing = await db
      .select()
      .from(transportRequests)
      .where(
        and(
          eq(transportRequests.id, id),
          eq(transportRequests.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Demande non trouvée' };
    }

    if (existing[0].status === 'COMPLETED' || existing[0].status === 'CANCELLED') {
      return { success: false, error: 'Impossible d\'annuler une demande déjà terminée ou annulée' };
    }

    await db
      .update(transportRequests)
      .set({
        status: 'CANCELLED',
        cancelledById: userData.dbUser.id,
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(transportRequests.id, id),
          eq(transportRequests.festivalId, userData.dbUser.festivalId)
        )
      );

    revalidatePath('/dashboard/transports');
    return { success: true };
  } catch (error) {
    console.error('Error cancelling transport request:', error);
    return { success: false, error: 'Erreur lors de l\'annulation' };
  }
}

export async function deleteTransportRequest(id: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé' };
    }

    // Vérifier que la demande n'a pas de mission assignée
    const existing = await db
      .select()
      .from(transportRequests)
      .where(
        and(
          eq(transportRequests.id, id),
          eq(transportRequests.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Demande non trouvée' };
    }

    if (existing[0].status === 'ASSIGNED' || existing[0].status === 'IN_PROGRESS') {
      return { success: false, error: 'Impossible de supprimer une demande assignée. Annulez-la d\'abord.' };
    }

    await db
      .delete(transportRequests)
      .where(
        and(
          eq(transportRequests.id, id),
          eq(transportRequests.festivalId, userData.dbUser.festivalId)
        )
      );

    revalidatePath('/dashboard/transports');
    return { success: true };
  } catch (error) {
    console.error('Error deleting transport request:', error);
    return { success: false, error: 'Erreur lors de la suppression' };
  }
}

export async function getTransportRequests(filters?: GetTransportsFilters) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé', transports: [] };
    }

    let conditions = [eq(transportRequests.festivalId, userData.dbUser.festivalId)];

    // Filtrer par statut
    if (filters?.status) {
      conditions.push(eq(transportRequests.status, filters.status));
    }

    // Filtrer par type
    if (filters?.type) {
      conditions.push(eq(transportRequests.type, filters.type));
    }

    // Filtrer par dates
    if (filters?.startDate) {
      conditions.push(gte(transportRequests.requestedDatetime, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(transportRequests.requestedDatetime, filters.endDate));
    }

    // Recherche textuelle
    if (filters?.searchQuery && filters.searchQuery.length > 0) {
      conditions.push(
        or(
          like(transportRequests.pickupAddress, `%${filters.searchQuery}%`),
          like(transportRequests.dropoffAddress, `%${filters.searchQuery}%`),
          like(transportRequests.notes, `%${filters.searchQuery}%`)
        )
      );
    }

    const result = await db
      .select()
      .from(transportRequests)
      .leftJoin(vips, eq(transportRequests.vipId, vips.id))
      .leftJoin(users, eq(transportRequests.createdById, users.id))
      .where(and(...conditions))
      .orderBy(desc(transportRequests.requestedDatetime));

    // Reformater les résultats pour correspondre au type TransportRequestWithRelations
    const formattedResults = result.map(row => ({
      ...row.transport_requests,
      vip: row.vips,
      createdBy: row.users,
    }));

    return { success: true, requests: formattedResults };
  } catch (error) {
    console.error('Error fetching transport requests:', error);
    return { success: false, error: 'Erreur lors de la récupération des demandes', requests: [] };
  }
}

export async function getTransportRequestById(id: string) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser?.festivalId) {
      return { success: false, error: 'Non autorisé', transport: null };
    }

    const result = await db
      .select({
        transport: transportRequests,
        vip: vips,
      })
      .from(transportRequests)
      .leftJoin(vips, eq(transportRequests.vipId, vips.id))
      .where(
        and(
          eq(transportRequests.id, id),
          eq(transportRequests.festivalId, userData.dbUser.festivalId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: 'Demande non trouvée', transport: null };
    }

    return { success: true, transport: result[0] };
  } catch (error) {
    console.error('Error fetching transport request:', error);
    return { success: false, error: 'Erreur lors de la récupération', transport: null };
  }
}
