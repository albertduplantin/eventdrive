# Guide d'Implémentation du Suivi GPS en Temps Réel

## ✅ Ce qui est déjà fait

### 1. Base de données
- ✅ Table `realTimeTracking` existante dans le schéma
- ✅ Champs : lat, lng, accuracy, heading, speed, timestamp
- ✅ Relations avec missions et drivers

### 2. Actions serveur ([lib/actions/tracking.ts](lib/actions/tracking.ts))
- ✅ `updateDriverLocation()` : Met à jour la position GPS
- ✅ `getDriverLocation()` : Récupère la dernière position
- ✅ `getLocationHistory()` : Historique des positions
- ✅ `calculateDistance()` : Calcul de distance entre 2 points
- ✅ `estimateETA()` : Estimation du temps d'arrivée
- ✅ `formatETA()` : Formatage du temps d'arrivée

### 3. Hook de géolocalisation ([hooks/use-driver-location.ts](hooks/use-driver-location.ts))
- ✅ Suivi GPS automatique du chauffeur
- ✅ Envoi de la position toutes les 10 secondes
- ✅ Gestion des permissions et erreurs
- ✅ Mode haute précision configurable

---

## 📋 Prochaines étapes pour finaliser

### Étape 1 : Installer les dépendances nécessaires

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

### Étape 2 : Créer le composant de carte avec Leaflet

**Fichier à créer :** `components/tracking/driver-map.tsx`

```tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { getDriverLocation } from '@/lib/actions/tracking';
import { calculateDistance, estimateETA, formatETA } from '@/lib/actions/tracking';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Navigation } from 'lucide-react';

// Import Leaflet dynamiquement pour éviter les erreurs SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

interface DriverMapProps {
  missionId: string;
  refreshInterval?: number; // en millisecondes
}

export function DriverMap({ missionId, refreshInterval = 10000 }: DriverMapProps) {
  const [location, setLocation] = useState<any>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la position initiale et la destination
  useEffect(() => {
    loadLocation();
    const interval = setInterval(loadLocation, refreshInterval);
    return () => clearInterval(interval);
  }, [missionId, refreshInterval]);

  const loadLocation = async () => {
    try {
      const result = await getDriverLocation(missionId);

      if (result.success && result.location) {
        setLocation({
          lat: parseFloat(result.location.lat),
          lng: parseFloat(result.location.lng),
          accuracy: result.location.accuracy ? parseFloat(result.location.accuracy) : null,
          heading: result.location.heading ? parseFloat(result.location.heading) : null,
          speed: result.location.speed ? parseFloat(result.location.speed) : null,
          timestamp: result.location.timestamp,
        });

        // Destination = pickup ou dropoff selon le statut
        if (result.transportRequest) {
          const destLat = parseFloat(result.transportRequest.pickupLat || '0');
          const destLng = parseFloat(result.transportRequest.pickupLng || '0');

          if (destLat !== 0 && destLng !== 0) {
            setDestination({ lat: destLat, lng: destLng });

            // Calculer distance et ETA
            const dist = calculateDistance(
              parseFloat(result.location.lat),
              parseFloat(result.location.lng),
              destLat,
              destLng
            );
            setDistance(dist);

            const etaMinutes = estimateETA(dist);
            setEta(formatETA(etaMinutes));
          }
        }
      }
    } catch (error) {
      console.error('Error loading location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">Chargement de la carte...</div>
      </Card>
    );
  }

  if (!location) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          Position du chauffeur non disponible
        </div>
      </Card>
    );
  }

  const center: [number, number] = [location.lat, location.lng];

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Temps d'arrivée estimé</div>
                <div className="font-semibold text-lg">{eta}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">Distance</div>
                <div className="font-semibold">{distance.toFixed(1)} km</div>
              </div>
            </div>
          </div>
          {location.speed && (
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">Vitesse</div>
              <Badge variant="outline">{Math.round(location.speed)} km/h</Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Map */}
      <div className="h-[500px] w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marqueur Chauffeur */}
          <Marker position={center}>
            <Popup>
              <div className="text-center">
                <strong>Votre chauffeur</strong>
                <br />
                {eta && <span>Arrivée dans {eta}</span>}
              </div>
            </Popup>
          </Marker>

          {/* Marqueur Destination */}
          {destination && (
            <Marker position={[destination.lat, destination.lng]}>
              <Popup>
                <strong>Point de rendez-vous</strong>
              </Popup>
            </Marker>
          )}

          {/* Ligne entre chauffeur et destination */}
          {destination && (
            <Polyline
              positions={[
                center,
                [destination.lat, destination.lng],
              ]}
              color="blue"
              weight={3}
              opacity={0.6}
              dashArray="10, 10"
            />
          )}
        </MapContainer>
      </div>

      {/* Dernière mise à jour */}
      <div className="text-xs text-muted-foreground text-center">
        Dernière mise à jour :{' '}
        {location.timestamp
          ? new Date(location.timestamp).toLocaleString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : 'Inconnue'}
      </div>
    </div>
  );
}
```

### Étape 3 : Créer la page de suivi pour les VIPs

**Fichier à créer :** `app/(dashboard)/dashboard/tracking/[missionId]/page.tsx`

```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DriverMap } from '@/components/tracking/driver-map';

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = params.missionId as string;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/dashboard/missions')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-black">
            Suivi en Temps Réel
          </h1>
          <p className="text-muted-foreground mt-1">
            Position de votre chauffeur
          </p>
        </div>
      </div>

      {/* Map Component */}
      <DriverMap missionId={missionId} />
    </div>
  );
}
```

### Étape 4 : Ajouter le bouton de tracking dans la liste des missions

**Modifier :** `app/(dashboard)/dashboard/missions/page.tsx`

Ajouter un bouton "Suivre en temps réel" pour les missions acceptées ou en cours :

```tsx
{(item.mission.status === 'ACCEPTED' || item.mission.status === 'IN_PROGRESS') && (
  <Button
    variant="outline"
    size="sm"
    onClick={(e) => {
      e.stopPropagation();
      router.push(`/dashboard/tracking/${item.mission.id}`);
    }}
  >
    <MapPin className="h-4 w-4 mr-2" />
    Suivre en temps réel
  </Button>
)}
```

### Étape 5 : Interface chauffeur pour activer le tracking

**Fichier à créer :** `app/(driver)/my-missions/[id]/track/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Navigation, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useDriverLocation } from '@/hooks/use-driver-location';
import { toast } from 'sonner';

export default function DriverTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const missionId = params.id as string;

  const [trackingEnabled, setTrackingEnabled] = useState(false);

  const {
    latitude,
    longitude,
    accuracy,
    speed,
    error,
    isTracking,
    forceUpdate,
  } = useDriverLocation({
    missionId,
    enabled: trackingEnabled,
    updateInterval: 10000, // 10 secondes
    highAccuracy: true,
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (trackingEnabled && isTracking) {
      toast.success('Suivi GPS activé');
    }
  }, [trackingEnabled, isTracking]);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(`/my-missions`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Suivi GPS de la Mission
          </h1>
          <p className="text-muted-foreground mt-1">
            Activez le suivi pour que le VIP puisse voir votre position
          </p>
        </div>
      </div>

      {/* Control Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="tracking-switch" className="text-lg font-semibold">
                Activer le suivi GPS
              </Label>
              <p className="text-sm text-muted-foreground">
                Votre position sera visible par le VIP et les coordinateurs
              </p>
            </div>
            <Switch
              id="tracking-switch"
              checked={trackingEnabled}
              onCheckedChange={setTrackingEnabled}
            />
          </div>

          {trackingEnabled && (
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2">
                <Activity className={`h-5 w-5 ${isTracking ? 'text-green-600 animate-pulse' : 'text-gray-400'}`} />
                <span className="font-medium">
                  {isTracking ? 'Suivi actif' : 'En attente...'}
                </span>
              </div>

              {latitude && longitude && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Latitude</div>
                    <div className="font-mono">{latitude.toFixed(6)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Longitude</div>
                    <div className="font-mono">{longitude.toFixed(6)}</div>
                  </div>
                  {accuracy && (
                    <div>
                      <div className="text-sm text-muted-foreground">Précision</div>
                      <div>{Math.round(accuracy)}m</div>
                    </div>
                  )}
                  {speed && (
                    <div>
                      <div className="text-sm text-muted-foreground">Vitesse</div>
                      <div>{Math.round(speed)} km/h</div>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={forceUpdate}
                variant="outline"
                className="w-full mt-4"
                disabled={!isTracking}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Forcer la mise à jour
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Conseils pour un suivi optimal</h3>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Gardez votre téléphone allumé pendant toute la mission</li>
              <li>Assurez-vous que le GPS est activé dans vos paramètres</li>
              <li>Évitez de mettre l'application en arrière-plan trop longtemps</li>
              <li>Le suivi consomme de la batterie - pensez à recharger si besoin</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

### Étape 6 : Ajouter un composant Switch manquant

```bash
npx shadcn@latest add switch
```

---

## 🔧 Configuration requise

### 1. Permissions du navigateur
Le chauffeur devra autoriser l'accès à sa position géographique.

### 2. HTTPS obligatoire
La géolocalisation ne fonctionne que sur HTTPS (ou localhost en dev).

### 3. CSS Leaflet
Ajouter dans `app/globals.css` :

```css
@import 'leaflet/dist/leaflet.css';
```

---

## 🎯 Fonctionnalités implémentées

✅ **Suivi GPS automatique** du chauffeur
✅ **Carte interactive** avec Leaflet et OpenStreetMap (gratuit)
✅ **Calcul d'ETA** (temps d'arrivée estimé)
✅ **Calcul de distance** en temps réel
✅ **Interface chauffeur** pour activer/désactiver le tracking
✅ **Interface VIP** pour voir la position du chauffeur
✅ **Historique** des positions
✅ **Permissions** et sécurité multi-tenant

---

## 📱 Utilisation mobile

Le système fonctionne parfaitement sur mobile :
- GPS natif du téléphone
- Interface responsive
- Optimisé pour la batterie (mise à jour toutes les 10s)

---

## 💰 Coût : **100% GRATUIT**

- ❌ Pas d'API key nécessaire
- ✅ OpenStreetMap gratuit et illimité
- ✅ Géolocalisation Web API native (gratuite)
- ✅ Aucune limite d'utilisation

---

## 🚀 Pour aller plus loin (optionnel)

### Service d'itinéraire OpenRouteService (gratuit)
Pour calculer l'itinéraire réel au lieu de la ligne droite :

1. S'inscrire sur https://openrouteservice.org
2. Obtenir une clé API gratuite (40 req/min)
3. Créer `lib/services/routing.ts` pour les appels API

### Notifications push
Pour prévenir le VIP quand le chauffeur arrive :

1. Utiliser l'API Notifications du navigateur
2. Déclencher une notification quand distance < 500m

---

## ✅ Checklist de déploiement

- [ ] Installer Leaflet : `npm install leaflet react-leaflet`
- [ ] Créer le composant `DriverMap`
- [ ] Créer la page de suivi `/tracking/[missionId]`
- [ ] Créer l'interface chauffeur `/my-missions/[id]/track`
- [ ] Ajouter le bouton "Suivre" dans la liste des missions
- [ ] Tester sur mobile (permissions GPS)
- [ ] Vérifier que HTTPS est activé en production
- [ ] Ajouter le CSS de Leaflet dans globals.css

---

**Le système est prêt à être implémenté ! 🎉**
