'use server';

import { db } from '@/lib/db';
import { auditLogs, users } from '@/lib/db/schema';
import { eq, and, desc, like, or, gte, lte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

interface GetAuditLogsFilters {
  search?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Récupère les logs d'audit pour le festival de l'utilisateur
 */
export async function getAuditLogs(filters?: GetAuditLogsFilters) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé', logs: [], total: 0 };
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    // Build conditions
    const conditions = [eq(auditLogs.festivalId, userData.dbUser.festivalId)];

    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }

    if (filters?.startDate) {
      conditions.push(gte(auditLogs.timestamp, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(auditLogs.timestamp, filters.endDate));
    }

    // Fetch logs with user details
    let query = db
      .select({
        log: auditLogs,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
        },
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    const logs = await query;

    // Filter by search if provided
    let filteredLogs = logs;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredLogs = logs.filter(
        (item) =>
          item.log.action.toLowerCase().includes(searchLower) ||
          item.log.entityType.toLowerCase().includes(searchLower) ||
          item.user?.firstName?.toLowerCase().includes(searchLower) ||
          item.user?.lastName?.toLowerCase().includes(searchLower) ||
          item.user?.email.toLowerCase().includes(searchLower)
      );
    }

    return {
      success: true,
      logs: filteredLogs,
      total: filteredLogs.length,
      hasMore: logs.length === limit,
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return {
      success: false,
      error: 'Erreur lors de la récupération de l\'historique',
      logs: [],
      total: 0,
    };
  }
}

/**
 * Crée un nouveau log d'audit
 */
export async function createAuditLog(data: {
  action: string;
  entityType: string;
  entityId: string;
  oldData?: any;
  newData?: any;
}) {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé' };
    }

    await db.insert(auditLogs).values({
      festivalId: userData.dbUser.festivalId,
      userId: userData.dbUser.id,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      oldData: data.oldData,
      newData: data.newData,
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating audit log:', error);
    return { success: false, error: 'Erreur lors de la création du log' };
  }
}

/**
 * Récupère les statistiques des actions
 */
export async function getAuditStats() {
  try {
    const userData = await getCurrentUser();

    if (!userData?.dbUser) {
      return { success: false, error: 'Non autorisé', stats: {} };
    }

    // Get logs from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.festivalId, userData.dbUser.festivalId),
          gte(auditLogs.timestamp, thirtyDaysAgo)
        )
      );

    // Calculate stats
    const actionCounts: Record<string, number> = {};
    const entityCounts: Record<string, number> = {};

    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      entityCounts[log.entityType] = (entityCounts[log.entityType] || 0) + 1;
    });

    return {
      success: true,
      stats: {
        total: logs.length,
        byAction: actionCounts,
        byEntity: entityCounts,
        last30Days: logs.length,
      },
    };
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return {
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      stats: {},
    };
  }
}
