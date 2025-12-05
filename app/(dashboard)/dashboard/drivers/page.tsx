'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Mail, Phone, MapPin, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getDrivers } from '@/lib/actions/drivers';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils';
import type { users } from '@/lib/db/schema';

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Array<typeof users.$inferSelect>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const loadDrivers = async () => {
    setIsLoading(true);
    try {
      const filters = {
        search: searchQuery || undefined,
      };

      const result = await getDrivers(filters);
      if (result.success) {
        setDrivers(result.drivers);
      } else {
        toast.error(result.error || 'Erreur lors du chargement des chauffeurs');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des chauffeurs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDrivers();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const delaySearch = setTimeout(() => {
      loadDrivers();
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  if (!mounted) {
    return (
      <div className="p-8 space-y-6">
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-gray-700 bg-clip-text text-transparent">
            Chauffeurs
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre équipe de chauffeurs
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/drivers/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un chauffeur
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[250px]">
          <label className="text-sm font-medium mb-2 block">Recherche</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom, email, téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
            <div className="text-2xl font-bold text-purple-900">{drivers.length}</div>
            <div className="text-sm text-purple-700">Total chauffeurs</div>
          </div>
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
            <div className="text-2xl font-bold text-green-900">
              {drivers.filter(d => d.phone).length}
            </div>
            <div className="text-sm text-green-700">Avec téléphone</div>
          </div>
          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <div className="text-2xl font-bold text-blue-900">
              {drivers.filter(d => d.address).length}
            </div>
            <div className="text-sm text-blue-700">Avec adresse</div>
          </div>
          <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
            <div className="text-2xl font-bold text-orange-900">0</div>
            <div className="text-sm text-orange-700">Disponibles aujourd'hui</div>
          </div>
        </div>
      )}

      {/* Drivers Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun chauffeur trouvé
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver) => (
            <Card key={driver.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {driver.avatarUrl ? (
                    <img
                      src={driver.avatarUrl}
                      alt={`${driver.firstName} ${driver.lastName}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-gray-700 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {getInitials(driver.firstName || '', driver.lastName || '')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {driver.firstName} {driver.lastName}
                  </h3>

                  <div className="mt-3 space-y-2">
                    {driver.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{driver.email}</span>
                      </div>
                    )}

                    {driver.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{driver.phone}</span>
                      </div>
                    )}

                    {driver.address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate" title={driver.address}>
                          {driver.address}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/drivers/${driver.id}`)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profil
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/drivers/${driver.id}/availability`)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Dispos
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
