# 🤖 Algorithme d'Affectation Automatique

Ce document détaille l'algorithme d'affectation automatique des chauffeurs aux missions.

---

## 🎯 Objectif

Assigner intelligemment les chauffeurs aux demandes de transport VIP en optimisant :
1. **Équité** : Répartir équitablement les missions entre chauffeurs
2. **Disponibilité** : Respecter les créneaux disponibles
3. **Proximité** : Minimiser les distances (trajets en ville)
4. **Préférences** : Tenir compte des souhaits des chauffeurs
5. **Continuité** : Favoriser les chauffeurs ayant déjà conduit le VIP

---

## 📊 Système de Scoring

### Score Total = 100 points max

Chaque chauffeur reçoit un score pour chaque mission, calculé selon :

```
Score = (AvailabilityScore × 0) +
        (EquityScore × 40%) +
        (ProximityScore × 30%) +
        (PreferenceScore × 20%) +
        (ContinuityScore × 10%)
```

### Détail des Critères

#### 1️⃣ Disponibilité (BLOQUANT)

**Poids : 0% (mais éliminatoire)**

- ✅ **Score = 100** : Chauffeur disponible sur le créneau
- ❌ **Score = 0** : Chauffeur indisponible → **ÉLIMINÉ**

**Calcul :**

```typescript
function isDriverAvailable(driver, request, bufferTime) {
  // Récupérer toutes les missions du chauffeur
  const missions = await getDriverMissions(driver.id);

  const requestStart = request.requestedDatetime;
  const requestEnd = addMinutes(requestStart, request.duration + bufferTime);

  // Vérifier conflits
  for (const mission of missions) {
    const missionStart = mission.transportRequest.requestedDatetime;
    const missionEnd = addMinutes(missionStart, mission.duration + bufferTime);

    // Si overlap → indisponible
    if (requestStart < missionEnd && missionStart < requestEnd) {
      return false;
    }
  }

  // Vérifier disponibilités déclarées
  const availability = await getDriverAvailability(driver.id, request.date, request.slot);
  return availability?.isAvailable ?? true;
}
```

---

#### 2️⃣ Équité de Répartition (40%)

**Objectif** : Éviter qu'un chauffeur ait toutes les missions

**Calcul :**

```typescript
function calculateEquityScore(driver, allDrivers, existingMissions) {
  // Nombre de missions déjà assignées au chauffeur
  const driverMissionCount = existingMissions.filter(
    m => m.driverId === driver.id
  ).length;

  // Moyenne de missions par chauffeur
  const totalMissions = existingMissions.length;
  const avgMissions = totalMissions / allDrivers.length;

  // Plus le chauffeur est en dessous de la moyenne, meilleur le score
  // Si chauffeur a 0 missions et moyenne = 3 → bonus = +30 points
  const equityBonus = (avgMissions - driverMissionCount) * 10;

  // Limiter entre 0 et 100
  return Math.max(0, Math.min(100, 50 + equityBonus));
}
```

**Exemples :**

| Chauffeur | Missions actuelles | Moyenne | Score |
|-----------|-------------------|---------|-------|
| Jean      | 0                 | 2       | 70    |
| Marie     | 2                 | 2       | 50    |
| Pierre    | 4                 | 2       | 30    |

---

#### 3️⃣ Proximité Géographique (30%)

**Objectif** : Minimiser les km parcourus (trajets intra-ville uniquement)

**Calcul :**

```typescript
function calculateProximityScore(driver, request) {
  // Seulement pour trajets en ville
  if (request.type !== 'INTRA_CITY') {
    return 50; // Score neutre pour trajets gare ↔ ville
  }

  // Adresse du chauffeur (ou lieu du festival par défaut)
  const driverLocation = driver.geocodedLocation || festival.location;

  // Distance en km (Haversine)
  const distance = calculateDistance(
    driverLocation.lat,
    driverLocation.lng,
    request.pickupLocation.lat,
    request.pickupLocation.lng
  );

  // Pénalité : -5 points par km
  // 0km = 100pts, 5km = 75pts, 10km = 50pts, 20km = 0pts
  return Math.max(0, 100 - (distance * 5));
}
```

**Exemples :**

| Distance pickup | Score |
|-----------------|-------|
| 0 km            | 100   |
| 2 km            | 90    |
| 5 km            | 75    |
| 10 km           | 50    |
| 20+ km          | 0     |

---

#### 4️⃣ Préférences Chauffeur (20%)

**Objectif** : Respecter les souhaits des chauffeurs

**Calcul :**

```typescript
function calculatePreferenceScore(driver, request) {
  const preferences = driver.preferences?.preferredMissionTypes || [];

  // Aucune préférence déclarée → score neutre
  if (preferences.length === 0) {
    return 50;
  }

  // Le type de mission correspond aux préférences
  if (preferences.includes(request.type)) {
    return 100; // Bonus +20 points au score total (20% × 100)
  }

  // Le type ne correspond pas
  return 20; // Malus -16 points au score total (20% × 20)
}
```

**Exemples de préférences :**

```typescript
// Chauffeur aime les longs trajets
driver.preferences = {
  preferredMissionTypes: ['STATION_TO_VENUE', 'VENUE_TO_STATION']
};

// Chauffeur préfère rester en ville
driver.preferences = {
  preferredMissionTypes: ['INTRA_CITY']
};
```

---

#### 5️⃣ Continuité / Historique (10%)

**Objectif** : Favoriser le même chauffeur pour un VIP (reconnaissance)

**Calcul :**

```typescript
async function calculateContinuityScore(driver, request) {
  // Vérifier si le chauffeur a déjà conduit ce VIP
  const previousMissions = await db
    .select()
    .from(missions)
    .innerJoin(transportRequests, eq(missions.transportRequestId, transportRequests.id))
    .where(
      and(
        eq(missions.driverId, driver.id),
        eq(transportRequests.vipId, request.vipId),
        eq(missions.status, 'COMPLETED')
      )
    );

  if (previousMissions.length > 0) {
    return 100; // Bonus continuité +10 points au total
  }

  return 50; // Score neutre
}
```

---

## 🔢 Exemple Complet de Calcul

### Contexte

**Mission** : VIP "John Doe" - Trajet en ville - 14h00 (1h)

**Chauffeurs disponibles :**

| Chauffeur | Missions actuelles | Distance | Préférence ville | A déjà conduit John |
|-----------|-------------------|----------|------------------|---------------------|
| Jean      | 1                 | 2 km     | Oui              | Non                 |
| Marie     | 3                 | 8 km     | Non              | Oui                 |
| Pierre    | 2                 | 0 km     | Oui              | Non                 |

**Calcul des scores :**

#### Jean
```
Équité:     (2 - 1) × 10 = 10 → 60 pts × 40% = 24
Proximité:  100 - (2 × 5) = 90 pts × 30% = 27
Préférence: 100 (aime ville) × 20% = 20
Continuité: 50 (jamais conduit) × 10% = 5
-------------------------------------------
TOTAL: 76 points
```

#### Marie
```
Équité:     (2 - 3) × 10 = -10 → 40 pts × 40% = 16
Proximité:  100 - (8 × 5) = 60 pts × 30% = 18
Préférence: 20 (préfère gare) × 20% = 4
Continuité: 100 (a conduit John) × 10% = 10
-------------------------------------------
TOTAL: 48 points
```

#### Pierre
```
Équité:     (2 - 2) × 10 = 0 → 50 pts × 40% = 20
Proximité:  100 - (0 × 5) = 100 pts × 30% = 30
Préférence: 100 (aime ville) × 20% = 20
Continuité: 50 (jamais conduit) × 10% = 5
-------------------------------------------
TOTAL: 75 points
```

**🏆 Résultat** : Jean est assigné (76 points)

---

## ⚙️ Configuration & Ajustements

### Paramètres modifiables par festival

```typescript
interface AutoAssignmentSettings {
  enabled: boolean;
  weights: {
    equity: number;      // 0.4 par défaut
    proximity: number;   // 0.3 par défaut
    preference: number;  // 0.2 par défaut
    continuity: number;  // 0.1 par défaut
  };
  bufferTimeMinutes: number; // 15 par défaut
  minScoreThreshold: number; // 30 par défaut (ne pas assigner si score < 30)
  proximityPenaltyPerKm: number; // 5 par défaut
}
```

### Modes d'affectation

**1. Mode AUTO complet**
```typescript
settings.autoAssignmentEnabled = true;
settings.requireDriverApproval = false;
// → Affectation directe au meilleur score
```

**2. Mode SEMI-AUTO (propositions)**
```typescript
settings.autoAssignmentEnabled = true;
settings.requireDriverApproval = true;
// → Propose top 3 chauffeurs, ils acceptent/refusent
```

**3. Mode MANUEL**
```typescript
settings.autoAssignmentEnabled = false;
// → Responsable affecte via tableau Excel
```

---

## 🎛️ Cas Particuliers

### Aucun chauffeur disponible

```typescript
if (availableDrivers.length === 0) {
  // Notification au responsable chauffeurs
  await sendNotification({
    to: driverManager,
    message: `Aucun chauffeur disponible pour ${request.vipName} à ${request.time}`,
    urgent: true
  });

  // Mettre en pending
  request.status = 'PENDING';
}
```

### Scores ex-aequo

```typescript
// Si plusieurs chauffeurs ont le même score
const topScores = scores.filter(s => s.score === maxScore);

if (topScores.length > 1) {
  // Départager par :
  // 1. Continuité (a déjà conduit le VIP)
  // 2. Équité (moins de missions)
  // 3. Aléatoire
  return topScores.sort((a, b) => {
    if (a.continuityScore !== b.continuityScore) {
      return b.continuityScore - a.continuityScore;
    }
    return a.missionCount - b.missionCount;
  })[0];
}
```

### Modification de mission

```typescript
// Si une mission est modifiée (horaire, durée)
if (request.hasChanged) {
  // Re-calculer les scores
  const newScores = await calculateScores(request);

  // Si le chauffeur actuel n'est plus dispo
  if (!newScores.find(s => s.driverId === currentDriver.id)) {
    // Proposer réaffectation automatique
    await suggestReassignment(request, newScores);
  }
}
```

---

## 📈 Optimisations Futures

### Phase 2
- [ ] Cache des scores (Redis)
- [ ] Calcul asynchrone (queue)
- [ ] Pré-calcul des disponibilités

### Phase 3
- [ ] Machine Learning (apprentissage des patterns)
- [ ] Optimisation globale (Hungarian algorithm)
- [ ] Prédiction des annulations

---

## 🧪 Tests

### Tests unitaires

```typescript
describe('Auto-assignment algorithm', () => {
  it('should assign driver with highest score', async () => {
    const result = await autoAssignDriver(request);
    expect(result.score).toBeGreaterThan(70);
  });

  it('should not assign if all drivers unavailable', async () => {
    const result = await autoAssignDriver(conflictingRequest);
    expect(result).toBeNull();
  });

  it('should prioritize equity over proximity', async () => {
    // Driver A: 0 missions, 10km away
    // Driver B: 5 missions, 0km away
    // → Driver A should win (equity weight = 40%)
  });
});
```

---

**📚 Voir aussi :**
- `lib/actions/assignment.ts` : Implémentation
- `types/index.ts` : Types DriverScore
- `SETUP.md` : Configuration
