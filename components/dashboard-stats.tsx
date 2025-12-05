'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsData {
  totalVips: number;
  totalDrivers: number;
  totalRequests: number;
  pendingRequests: number;
  completedMissions: number;
  activeMissions: number;
  recentRequests: any[];
}

export function DashboardStats({ stats }: { stats: StatsData }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Calculate percentages and trends
  const missionCompletionRate = stats.completedMissions + stats.activeMissions > 0
    ? Math.round((stats.completedMissions / (stats.completedMissions + stats.activeMissions)) * 100)
    : 0;

  const pendingRequestsRate = stats.totalRequests > 0
    ? Math.round((stats.pendingRequests / stats.totalRequests) * 100)
    : 0;

  const completedRequestsRate = 100 - pendingRequestsRate;

  return (
    <>
      {/* Mission Status Chart */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Performance des missions</CardTitle>
          <CardDescription>Taux de completion et missions actives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Completion Rate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Missions terminees</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{missionCompletionRate}%</span>
                  {missionCompletionRate >= 75 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-amber-600" />
                  )}
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                  style={{ width: `${missionCompletionRate}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{stats.completedMissions} terminees</span>
                <span>{stats.activeMissions} en cours</span>
              </div>
            </div>

            {/* Active Missions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Missions actives</span>
                <span className="text-2xl font-bold">{stats.activeMissions}</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{
                    width: `${stats.completedMissions + stats.activeMissions > 0
                      ? (stats.activeMissions / (stats.completedMissions + stats.activeMissions)) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Statut des demandes</CardTitle>
            <CardDescription>Repartition des demandes de transport</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pending Requests */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">En attente</span>
                  <span className="text-lg font-bold text-amber-600">{stats.pendingRequests}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                    style={{ width: `${pendingRequestsRate}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {pendingRequestsRate}% du total
                </div>
              </div>

              {/* Completed Requests */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Traitees</span>
                  <span className="text-lg font-bold text-green-600">
                    {stats.totalRequests - stats.pendingRequests}
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                    style={{ width: `${completedRequestsRate}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {completedRequestsRate}% du total
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Ressources disponibles</CardTitle>
            <CardDescription>Apercu des ressources du festival</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* VIPs */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div>
                  <div className="text-sm font-medium text-purple-900">VIPs enregistres</div>
                  <div className="text-2xl font-bold text-purple-600">{stats.totalVips}</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-purple-600" />
                </div>
              </div>

              {/* Drivers */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div>
                  <div className="text-sm font-medium text-blue-900">Chauffeurs actifs</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalDrivers}</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-blue-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
