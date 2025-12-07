'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Search, Calendar, User, Car, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAuditLogs, getAuditStats } from '@/lib/actions/audit';
import { toast } from 'sonner';
import type { auditLogs, users } from '@/lib/db/schema';

interface AuditLogWithUser {
  log: typeof auditLogs.$inferSelect;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string | null;
  } | null;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  const loadLogs = async (loadMore = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const currentOffset = loadMore ? offset : 0;
      const result = await getAuditLogs({
        limit: 20,
        offset: currentOffset,
      });

      if (result.success) {
        if (loadMore) {
          setLogs([...logs, ...result.logs]);
          setOffset(currentOffset + 20);
        } else {
          setLogs(result.logs);
          setOffset(20);
        }
        setHasMore(result.hasMore || false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getAuditStats();
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusIcon = (action: string) => {
    if (action.includes('CREATE') || action.includes('COMPLETE')) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (action.includes('DELETE') || action.includes('DECLINE') || action.includes('CANCEL')) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    if (action.includes('UPDATE')) {
      return <AlertCircle className="h-5 w-5 text-amber-600" />;
    }
    return <Clock className="h-5 w-5 text-blue-600" />;
  };

  const getTypeIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'vip':
        return <User className="h-4 w-4" />;
      case 'driver':
      case 'user':
        return <Car className="h-4 w-4" />;
      case 'mission':
      case 'transport':
      case 'transportrequest':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE_VIP: 'VIP ajouté',
      UPDATE_VIP: 'VIP modifié',
      DELETE_VIP: 'VIP supprimé',
      CREATE_TRANSPORT: 'Demande de transport créée',
      UPDATE_TRANSPORT: 'Demande de transport modifiée',
      CANCEL_TRANSPORT: 'Demande de transport annulée',
      CREATE_MISSION: 'Mission créée',
      ACCEPT_MISSION: 'Mission acceptée',
      DECLINE_MISSION: 'Mission refusée',
      START_MISSION: 'Mission démarrée',
      COMPLETE_MISSION: 'Mission terminée',
      CREATE_USER: 'Utilisateur créé',
      UPDATE_USER: 'Utilisateur modifié',
      CREATE_INVITATION: 'Code d\'invitation créé',
      USE_INVITATION: 'Code d\'invitation utilisé',
    };
    return labels[action] || action.replace(/_/g, ' ');
  };

  const getUserName = (user: AuditLogWithUser['user']) => {
    if (!user) return 'Système';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const filteredLogs = logs.filter((item) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const action = getActionLabel(item.log.action).toLowerCase();
    const userName = getUserName(item.user).toLowerCase();
    const entityType = item.log.entityType.toLowerCase();

    return (
      action.includes(searchLower) ||
      userName.includes(searchLower) ||
      entityType.includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">
          Historique des activités
        </h1>
        <p className="text-muted-foreground mt-1">
          Suivez toutes les actions effectuées sur la plateforme
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total d'activités</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.last30Days || 0} ces 30 derniers jours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions les plus fréquentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                {stats.byAction && Object.entries(stats.byAction)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .slice(0, 2)
                  .map(([action, count]: any) => (
                    <div key={action} className="flex justify-between">
                      <span className="text-muted-foreground">{getActionLabel(action)}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entités modifiées</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                {stats.byEntity && Object.entries(stats.byEntity)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .slice(0, 2)
                  .map(([entity, count]: any) => (
                    <div key={entity} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{entity}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Rechercher dans l'historique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher une action, un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activités récentes
          </CardTitle>
          <CardDescription>
            {filteredLogs.length} activité(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune activité trouvée</p>
              <p className="text-sm mt-1">
                {searchQuery
                  ? 'Essayez de modifier vos filtres de recherche'
                  : 'Les activités apparaîtront ici au fur et à mesure'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((item) => (
                <div
                  key={item.log.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(item.log.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{getActionLabel(item.log.action)}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {item.log.entityId.slice(0, 8)}...
                        </p>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getTypeIcon(item.log.entityType)}
                        <span className="capitalize">{item.log.entityType}</span>
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{getUserName(item.user)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(item.log.timestamp).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load More */}
      {hasMore && !searchQuery && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => loadLogs(true)}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Chargement...
              </>
            ) : (
              'Charger plus d\'activités'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
