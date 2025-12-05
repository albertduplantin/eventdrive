'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Search, Calendar, User, Car, MapPin, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-8 space-y-6">
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      </div>
    );
  }

  // Placeholder data - will be replaced with real data from API
  const historyItems = [
    {
      id: '1',
      type: 'mission',
      action: 'Mission completee',
      description: 'Mission #12345 completee avec succes',
      timestamp: '2025-12-04T14:30:00',
      status: 'success',
      user: 'Jean Dupont',
      details: 'Transport VIP de l\'hotel au theatre',
    },
    {
      id: '2',
      type: 'vip',
      action: 'Nouveau VIP ajoute',
      description: 'Marie Martin ajoutee a la liste des VIPs',
      timestamp: '2025-12-04T12:15:00',
      status: 'info',
      user: 'Admin Festival',
      details: 'Organisation: France Television',
    },
    {
      id: '3',
      type: 'driver',
      action: 'Chauffeur assigne',
      description: 'Pierre Durand assigne a la mission #12346',
      timestamp: '2025-12-04T10:45:00',
      status: 'info',
      user: 'Coordinateur General',
      details: 'Mission prevue pour 16h00',
    },
    {
      id: '4',
      type: 'mission',
      action: 'Mission annulee',
      description: 'Mission #12344 annulee par le VIP',
      timestamp: '2025-12-04T09:20:00',
      status: 'warning',
      user: 'Systeme',
      details: 'Raison: Changement de programme',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vip':
        return <User className="h-4 w-4" />;
      case 'driver':
        return <Car className="h-4 w-4" />;
      case 'mission':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredItems = historyItems.filter(item =>
    item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          Historique des activites
        </h1>
        <p className="text-muted-foreground mt-1">
          Suivez toutes les actions effectuees sur la plateforme
        </p>
      </div>

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
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Filtrer par date
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activites recentes
          </CardTitle>
          <CardDescription>
            {filteredItems.length} activite(s) trouvee(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune activite trouvee</p>
              <p className="text-sm mt-1">Essayez de modifier vos filtres de recherche</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(item.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{item.action}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getTypeIcon(item.type)}
                        <span className="capitalize">{item.type}</span>
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{item.user}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(item.timestamp).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {item.details && (
                      <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded">
                        {item.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load More */}
      {filteredItems.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline">
            Charger plus d'activites
          </Button>
        </div>
      )}

      {/* Info Message */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <History className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-900">Historique complet</h3>
              <p className="text-sm text-purple-700 mt-1">
                L'historique affiche actuellement des donnees de demonstration. La connexion
                avec la base de donnees pour afficher l'historique reel sera implementee prochainement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
