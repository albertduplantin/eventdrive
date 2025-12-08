import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { transportRequests, missions, users, vips } from '@/lib/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { UserRole } from '@/types';
import { DashboardStats } from '@/components/dashboard-stats';

export default async function DashboardPage() {
  const userData = await getCurrentUser();
  const userRole = userData?.dbUser?.role as UserRole;
  const festivalId = userData?.dbUser?.festivalId;

  // Fetch statistics based on user's festival
  const stats = await getStats(festivalId || '', userRole);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de vos transports VIP
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVips}</div>
            <p className="text-xs text-muted-foreground">
              Personnes enregistrées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chauffeurs</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDrivers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.availableDrivers} disponibles aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingRequests} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedMissions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeMissions} en cours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demandes récentes</CardTitle>
            <CardDescription>
              Dernières demandes de transport
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune demande pour le moment
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentRequests.map((request: any) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {request.pickupLocation} → {request.dropoffLocation}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.pickupTime).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Missions du jour</CardTitle>
            <CardDescription>
              Missions prévues aujourd'hui
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.todayMissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune mission pour aujourd'hui
              </p>
            ) : (
              <div className="space-y-4">
                {stats.todayMissions.map((mission: any) => (
                  <div
                    key={mission.id}
                    className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        Mission #{mission.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mission.status === 'ASSIGNED' ? 'Assignée' : mission.status}
                      </p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <DashboardStats stats={stats} />

      {/* Quick Actions based on role */}
      {userRole && (
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActions role={userRole} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function getStats(festivalId: string, role: UserRole) {
  if (!festivalId) {
    return {
      totalVips: 0,
      totalDrivers: 0,
      availableDrivers: 0,
      totalRequests: 0,
      pendingRequests: 0,
      completedMissions: 0,
      activeMissions: 0,
      recentRequests: [],
      todayMissions: [],
    };
  }

  const [
    vipsCount,
    driversCount,
    requestsStats,
    missionsStats,
    recentRequests,
    todayMissions,
  ] = await Promise.all([
    // Count VIPs
    db
      .select({ count: count() })
      .from(vips)
      .where(eq(vips.festivalId, festivalId)),

    // Count Drivers
    db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.festivalId, festivalId), eq(users.role, 'DRIVER'))),

    // Request stats
    db
      .select({
        total: count(),
        pending: sql<number>`count(*) filter (where status = 'PENDING')`,
      })
      .from(transportRequests)
      .where(eq(transportRequests.festivalId, festivalId)),

    // Mission stats
    db
      .select({
        completed: sql<number>`count(*) filter (where ${missions.status} = 'COMPLETED')`,
        active: sql<number>`count(*) filter (where ${missions.status} IN ('PROPOSED', 'ACCEPTED', 'IN_PROGRESS'))`,
      })
      .from(missions)
      .innerJoin(transportRequests, eq(missions.transportRequestId, transportRequests.id))
      .where(eq(transportRequests.festivalId, festivalId)),

    // Recent requests (limit 5)
    db
      .select()
      .from(transportRequests)
      .where(eq(transportRequests.festivalId, festivalId))
      .orderBy(sql`${transportRequests.createdAt} DESC`)
      .limit(5),

    // Today's missions
    db
      .select({
        mission: missions,
        transportRequest: transportRequests,
      })
      .from(missions)
      .innerJoin(transportRequests, eq(missions.transportRequestId, transportRequests.id))
      .where(
        and(
          eq(transportRequests.festivalId, festivalId),
          sql`DATE(${transportRequests.requestedDatetime}) = CURRENT_DATE`
        )
      )
      .limit(5),
  ]);

  return {
    totalVips: vipsCount[0]?.count || 0,
    totalDrivers: driversCount[0]?.count || 0,
    availableDrivers: 0, // TODO: Calculate based on today's availabilities
    totalRequests: requestsStats[0]?.total || 0,
    pendingRequests: Number(requestsStats[0]?.pending) || 0,
    completedMissions: Number(missionsStats[0]?.completed) || 0,
    activeMissions: Number(missionsStats[0]?.active) || 0,
    recentRequests,
    todayMissions,
  };
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black/20 dark:border-white/20',
    ASSIGNED: 'bg-black/20 dark:bg-white/20 text-black dark:text-white border border-black/30 dark:border-white/30',
    ACCEPTED: 'bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white',
    COMPLETED: 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/10 dark:border-white/10',
    CANCELLED: 'bg-black/30 dark:bg-white/30 text-black dark:text-white border border-black/40 dark:border-white/40',
  };

  const labels: Record<string, string> = {
    PENDING: 'En attente',
    ASSIGNED: 'Assignée',
    ACCEPTED: 'Acceptée',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || 'bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black/20 dark:border-white/20'
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function QuickActions({ role }: { role: UserRole }) {
  const actions: Record<UserRole, { label: string; href: string }[]> = {
    [UserRole.SUPER_ADMIN]: [
      { label: 'Gérer les festivals', href: '/dashboard/festivals' },
      { label: 'Voir les statistiques', href: '/dashboard/reports' },
    ],
    [UserRole.FESTIVAL_ADMIN]: [
      { label: 'Créer une demande', href: '/dashboard/transports/new' },
      { label: 'Voir les affectations', href: '/dashboard/missions' },
      { label: 'Gérer les membres', href: '/dashboard/settings/members' },
    ],
    [UserRole.GENERAL_COORDINATOR]: [
      { label: 'Affecter des chauffeurs', href: '/dashboard/missions' },
      { label: 'Voir le planning', href: '/dashboard/calendar' },
    ],
    [UserRole.VIP_MANAGER]: [
      { label: 'Ajouter un VIP', href: '/dashboard/vips/new' },
      { label: 'Créer une demande', href: '/dashboard/transports/new' },
    ],
    [UserRole.DRIVER_MANAGER]: [
      { label: 'Gérer les chauffeurs', href: '/dashboard/drivers' },
      { label: 'Voir les disponibilités', href: '/dashboard/availabilities' },
    ],
    [UserRole.DRIVER]: [
      { label: 'Mes missions', href: '/dashboard/my-missions' },
      { label: 'Mes disponibilités', href: '/dashboard/my-availabilities' },
    ],
    [UserRole.VIP]: [
      { label: 'Demander un transport', href: '/dashboard/transports/new' },
      { label: 'Mes trajets', href: '/dashboard/my-transports' },
    ],
  };

  const roleActions = actions[role] || [];

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {roleActions.map((action) => (
        <a
          key={action.href}
          href={action.href}
          className="flex items-center gap-3 rounded-lg border-2 border-black/5 dark:border-white/5 p-4 transition-all hover:border-black/20 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/5"
        >
          <AlertCircle className="h-5 w-5 text-black dark:text-white" />
          <span className="text-sm font-medium">{action.label}</span>
        </a>
      ))}
    </div>
  );
}
