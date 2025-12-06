# Parcours Utilisateur Multi-Tenant - FestivalDrive

## Vue d'ensemble

FestivalDrive est une application multi-tenant ou chaque festival est isole. Les utilisateurs peuvent soit creer un nouveau festival, soit rejoindre un festival existant via invitation.

## Roles Utilisateurs

### Roles Administratifs (Peuvent creer un festival)
- **FESTIVAL_ADMIN** : Administrateur du festival, acces complet
- **GENERAL_COORDINATOR** : Coordinateur general, gestion operationnelle

### Roles Operationnels (Rejoignent via invitation uniquement)
- **VIP_MANAGER** : Responsable VIP, gestion des invites
- **DRIVER_MANAGER** : Responsable chauffeurs, gestion equipe transport
- **DRIVER** : Chauffeur, execute les missions
- **VIP** : Invite du festival, beneficie des transports

---

## Parcours 1: Creer un Nouveau Festival

**Profil :** Premier utilisateur, futur administrateur

### Etapes:
1. **Inscription** : `/sign-up`
   - Cree compte avec email ou Google OAuth
   - Redirection automatique vers `/onboarding`

2. **Onboarding - Creation** : `/onboarding`
   - **Affichage** : Onglet "Creer un festival" uniquement visible (pas d'onglet "Rejoindre" si pas de code)
   - **Formulaire** :
     - Nom du festival
     - Prenom / Nom
     - Telephone
     - Adresse (optionnel)
     - **Role force** : FESTIVAL_ADMIN ou GENERAL_COORDINATOR uniquement

3. **Creation automatique** :
   - Creation du festival dans la base
   - Creation du profil utilisateur lie au festival
   - Redirection vers `/dashboard`

4. **Acces Dashboard** :
   - Acces complet a toutes les fonctionnalites
   - Peut creer des codes d'invitation dans `/dashboard/settings/invitations`

---

## Parcours 2: Rejoindre un Festival Existant (Via Invitation)

**Profil :** Membre d'equipe, VIP, ou chauffeur invite

### Etapes:
1. **Reception invitation** :
   - Admin partage lien : `https://app.com/onboarding?invite=DINAN2025-ABC123`
   - Ou partage code : `DINAN2025-ABC123`

2. **Inscription** : `/sign-up`
   - Cree compte avec email ou Google OAuth
   - **IMPORTANT** : Le parametre `?invite=CODE` doit etre preserve lors de la redirection

3. **Onboarding - Rejoindre** : `/onboarding?invite=DINAN2025-ABC123`
   - **Affichage** :
     - Message : "Vous avez ete invite a rejoindre un festival"
     - **Pas d'onglets** (uniquement mode "Rejoindre")

   - **Validation du code** :
     - Code pre-rempli depuis URL
     - Validation automatique au chargement
     - Affiche nom du festival et role (si defini)

   - **Formulaire** :
     - Prenom / Nom
     - Telephone
     - Adresse (optionnel)
     - **Role** :
       - Si code avec role specifique → Role force et desactive
       - Si code sans role → Choix parmi : VIP_MANAGER, DRIVER_MANAGER, DRIVER, VIP

4. **Creation profil** :
   - Profil lie au festival de l'invitation
   - Code d'invitation marque comme utilise
   - Redirection vers `/dashboard`

5. **Acces Dashboard** :
   - Acces limite selon le role attribue
   - Voit uniquement les donnees de son festival

---

## Parcours 3: Rejoindre Sans Code (Saisie Manuelle)

**Profil :** Utilisateur avec code recu hors lien

### Etapes:
1. **Inscription** : `/sign-up`
   - Cree compte normalement
   - Redirection vers `/onboarding` (sans parametre)

2. **Onboarding - Choix** : `/onboarding`
   - **Affichage** : Deux onglets visibles
     - "Rejoindre un festival"
     - "Creer un festival"

3. **Onglet "Rejoindre"** :
   - Champ pour saisir code manuellement
   - Bouton "Valider" le code
   - Reste du parcours identique au Parcours 2

4. **Onglet "Creer"** :
   - Parcours identique au Parcours 1

---

## Matrice de Controle d'Acces

| Action | FESTIVAL_ADMIN | GENERAL_COORDINATOR | VIP_MANAGER | DRIVER_MANAGER | DRIVER | VIP |
|--------|---------------|---------------------|-------------|----------------|--------|-----|
| Creer festival | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Generer invitations | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gerer VIPs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gerer chauffeurs | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Creer missions | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Voir missions | ✅ | ✅ | ✅ | ✅ | ✅ (assignees) | ✅ (propres) |
| Voir rapports | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## Isolation Multi-Tenant

### Securite:
- Chaque utilisateur est lie a **un seul** `festivalId`
- Toutes les requetes filtrent par `festivalId` de l'utilisateur connecte
- Impossible de voir/modifier donnees d'autres festivals

### Codes d'Invitation:
- Chaque code est lie a un `festivalId` specifique
- Peut avoir un role pre-defini ou role libre
- Peut avoir limite d'utilisations et date d'expiration
- Format : `FESTIVALNAME2025-RANDOM123`

---

## Scenarios d'Usage

### Scenario 1: Festival de Cinema de Dinan
1. Organisateur cree festival "Festival du Film Court de Dinan"
2. Genere codes :
   - `DINAN2025-VIP001` (role: VIP, 50 utilisations) → Pour invites
   - `DINAN2025-STAFF` (role libre, illimite) → Pour benevoles
   - `DINAN2025-DRIVERS` (role: DRIVER, 10 utilisations) → Pour chauffeurs
3. Partage liens selon profils
4. Chaque membre rejoint avec son code
5. Dashboard affiche uniquement donnees Dinan

### Scenario 2: Multi-Festivals
1. Utilisateur A cree "Festival Jazz Rennes"
2. Utilisateur B cree "Festival Rock Nantes"
3. Utilisateur C rejoint Jazz Rennes (code JAZZ2025-XXX)
4. Utilisateur D rejoint Rock Nantes (code ROCK2025-YYY)
5. C et D ne voient jamais les donnees de l'autre festival

---

## Points d'Attention Technique

### Redirections Clerk:
- `forceRedirectUrl` preserve parametres URL (`?invite=CODE`)
- Verification dans `onboarding/page.tsx`

### Validation Invitation:
- Verifie `isActive`, `expiresAt`, `maxUses`
- Incremente `usedCount` apres utilisation
- Retourne nom festival pour affichage

### Creation Festival:
- Si `festivalId` n'est pas UUID → Cree nouveau festival
- Si `festivalId` est UUID → Utilise festival existant
- Slug auto-genere depuis nom festival

---

## Prochaines Ameliorations

1. **Email de bienvenue** : Envoyer email avec code invitation
2. **Limite temporelle** : Expiration automatique codes anciens
3. **Tableau de bord invitations** : Voir qui a rejoint via quel code
4. **Roles personnalises** : Permettre creation roles custom
5. **Multi-festivals** : Permettre utilisateur appartenir a plusieurs festivals
