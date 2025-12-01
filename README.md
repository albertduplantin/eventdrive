# 🚗 FestivalDrive

**Plateforme moderne de gestion de chauffeurs bénévoles pour festivals**

Application SaaS multi-tenant pour coordonner les transports VIP lors de festivals. Affectation automatique, suivi GPS temps réel, notifications multi-canal.

---

## 🌟 Fonctionnalités

### ✅ Phase 1 - MVP (Implémenté)
- ✅ Architecture Next.js 15 + TypeScript
- ✅ Base de données PostgreSQL (Neon) avec Drizzle ORM
- ✅ Schéma complet multi-tenant
- ✅ Authentification Clerk
- ✅ Système de rôles et permissions
- ✅ Composants UI (Shadcn/ui)
- ✅ Page d'accueil marketing

### 🚧 Phase 2 - À venir
- [ ] Dashboard par rôle
- [ ] Gestion des disponibilités chauffeurs
- [ ] Création/modification demandes transport
- [ ] Algorithme d'affectation automatique
- [ ] Tableau interactif type Excel
- [ ] Notifications email (Resend)

### 🎯 Phase 3 - Avancé
- [ ] Suivi GPS temps réel (Pusher + Leaflet)
- [ ] Calcul automatique distances (Radar API)
- [ ] Notifications SMS (Twilio)
- [ ] Bot Telegram
- [ ] Webhooks Discord/Slack
- [ ] Paiements Stripe

### 🔮 Phase 4 - Polish
- [ ] Analytics et rapports
- [ ] Export PDF/Excel
- [ ] Tests E2E (Playwright)
- [ ] Documentation utilisateur
- [ ] Onboarding interactif

---

## 🏗️ Architecture

### Stack Technique

**Frontend**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui
- TanStack Table
- React Hook Form + Zod

**Backend**
- Next.js Server Actions + API Routes
- Neon Postgres (Serverless)
- Drizzle ORM
- Clerk (Auth multi-tenant)

**Services Externes**
- **Radar API** : Calcul distances & geocoding (100k req/mois gratuit)
- **Resend** : Emails (3k emails/mois gratuit)
- **Twilio** : SMS (optionnel)
- **Telegram Bot API** : Notifications (gratuit)
- **Pusher** : Temps réel (200 conn gratuit)
- **Stripe** : Paiements (commission 1,4%)
- **UploadThing** : Upload images (2GB gratuit)

**Hébergement**
- **Vercel** : Frontend/Backend (Hobby gratuit ou Pro 20$/mois)
- **Neon** : Database (Free tier ou Scale 19$/mois)

### Architecture Multi-Tenant

**Isolation par festivalId** : Chaque festival a ses propres données isolées.

### Système de Rôles

```
SUPER_ADMIN → Accès tous festivals
  └─ FESTIVAL_ADMIN → Gère son festival
      ├─ GENERAL_COORDINATOR → Coordonne tout
      ├─ VIP_MANAGER → Gère VIPs et demandes
      ├─ DRIVER_MANAGER → Gère chauffeurs
      ├─ DRIVER → Voit/accepte missions
      └─ VIP → Crée demandes
```

---

## 🚀 Installation

### Prérequis

- Node.js 20+
- npm ou pnpm
- Compte Neon (base de données)
- Compte Clerk (authentification)

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/festivaldrive.git
cd festivaldrive
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration des variables d'environnement

Copiez `.env.example` vers `.env.local` et remplissez les variables :

#### **Neon Database (Obligatoire)**

1. Créez un compte sur [neon.tech](https://neon.tech)
2. Créez un nouveau projet
3. Copiez la connection string :

```env
DATABASE_URL=postgresql://user:password@your-project.neon.tech/festivaldrive?sslmode=require
```

#### **Clerk Auth (Obligatoire)**

1. Créez un compte sur [clerk.com](https://clerk.com)
2. Créez une nouvelle application
3. Dans Settings > API Keys :

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 4. Créer la base de données

```bash
# Générer les migrations
npm run db:generate

# Appliquer les migrations
npm run db:push
```

### 5. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

---

## 📝 Scripts disponibles

```bash
# Développement
npm run dev          # Lance le serveur de dev

# Base de données
npm run db:generate  # Génère les migrations Drizzle
npm run db:push      # Applique les migrations
npm run db:studio    # Ouvre Drizzle Studio (GUI)

# Build
npm run build        # Build pour production
npm start            # Lance en production

# Qualité
npm run lint         # Lint du code
```

---

## 📂 Structure du projet

```
festivaldrive/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Layout racine avec Clerk
│   ├── page.tsx             # Page d'accueil marketing
│   ├── (auth)/              # Routes auth (à créer)
│   └── (dashboard)/         # Routes protégées (à créer)
│
├── components/
│   ├── ui/                  # Composants Shadcn
│   └── features/            # Composants métier (à créer)
│
├── lib/
│   ├── db/
│   │   ├── schema.ts        # Schéma Drizzle complet
│   │   ├── index.ts         # Client DB
│   │   └── migrations/      # Migrations SQL
│   ├── auth.ts              # Helpers authentification
│   └── utils.ts             # Utilitaires
│
├── types/
│   └── index.ts             # Types globaux & enums
│
├── middleware.ts            # Middleware Clerk
├── .env.local               # Variables d'env
└── drizzle.config.ts        # Config Drizzle
```

---

## 🗄️ Schéma de Base de Données

### Tables principales

- **festivals** : Informations festival (nom, dates, localisation, abonnement)
- **users** : Utilisateurs multi-rôles (liés à un festival)
- **driver_availabilities** : Disponibilités chauffeurs par créneau
- **transport_requests** : Demandes de transport VIP
- **missions** : Affectations chauffeur ↔ trajet
- **real_time_tracking** : Positions GPS
- **notifications_log** : Historique notifications
- **audit_logs** : Traçabilité actions

Voir le schéma complet dans `lib/db/schema.ts`

---

## 🔐 Authentification & Permissions

### Configuration Clerk

1. Dans Clerk Dashboard > Users > Metadata, ajoutez pour chaque user :

```json
{
  "role": "FESTIVAL_ADMIN",
  "festivalId": "uuid-du-festival"
}
```

2. Activez Email + Password
3. Configurez les URLs de redirection dans Clerk Dashboard

---

## 🚢 Déploiement

### Déploiement Vercel (Recommandé)

1. Push votre code sur GitHub
2. Importez dans Vercel
3. Configurez les variables d'env dans Vercel Dashboard
4. Déployez

```bash
# OU via CLI
npm install -g vercel
vercel
```

---

## 📊 Pricing & Limites

### Plan Gratuit
- 20 VIPs max
- 5 chauffeurs
- 1 festival
- Affectations manuelles
- Notifications email

### Plan Pro (29€/mois)
- 100 VIPs
- 20 chauffeurs
- Affectation automatique
- GPS temps réel
- SMS + Telegram

### Plan Enterprise (99€/mois)
- Illimité
- API & Webhooks
- Support téléphone

---

## 📖 Documentation

- [Next.js 15](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Clerk Auth](https://clerk.com/docs)
- [Shadcn/ui](https://ui.shadcn.com)
- [Neon Postgres](https://neon.tech/docs)

---

## 📄 Licence

MIT License

---

## 👨‍💻 Auteur

Créé pour le **Festival du Film Court de Dinan**

---

**🚀 Simplifiez la gestion de vos transports dès aujourd'hui !**
