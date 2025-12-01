# 🚀 Guide de Démarrage Rapide - FestivalDrive

Ce guide vous accompagne pas à pas pour configurer et lancer FestivalDrive en local.

---

## ⏱️ Temps estimé : 15-20 minutes

---

## Étape 1 : Prérequis

### Vérifiez que vous avez :

- ✅ **Node.js 20+** installé ([télécharger](https://nodejs.org))
- ✅ **npm** (inclus avec Node.js)
- ✅ Un éditeur de code (VS Code recommandé)
- ✅ Git installé

### Vérifiez les versions :

```bash
node --version  # Doit afficher v20.x ou supérieur
npm --version   # Doit afficher 10.x ou supérieur
```

---

## Étape 2 : Installation

### 2.1 Installer les dépendances

```bash
npm install
```

---

## Étape 3 : Configuration Neon (Base de données)

### 3.1 Créer un compte Neon

1. Allez sur [neon.tech](https://neon.tech)
2. Cliquez sur "Sign up" (gratuit)
3. Connectez-vous avec GitHub ou Google

### 3.2 Créer un projet

1. Cliquez sur "Create a project"
2. Nom : `festivaldrive`
3. Région : Europe (Francfort ou Paris)
4. PostgreSQL version : 16 (par défaut)
5. Cliquez sur "Create project"

### 3.3 Récupérer la connection string

1. Dans le dashboard Neon, cliquez sur "Connection string"
2. Copiez l'URL qui ressemble à :
   ```
   postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/festivaldrive?sslmode=require
   ```
3. **Gardez cette URL précieusement** (vous en aurez besoin à l'étape 4)

---

## Étape 4 : Configuration Clerk (Authentification)

### 4.1 Créer un compte Clerk

1. Allez sur [clerk.com](https://clerk.com)
2. Cliquez sur "Start building for free"
3. Connectez-vous avec GitHub ou Google

### 4.2 Créer une application

1. Cliquez sur "Create application"
2. Nom : `FestivalDrive`
3. Désactivez tous les providers SAUF **Email**
4. Cliquez sur "Create application"

### 4.3 Récupérer les clés API

1. Dans le menu de gauche, allez dans "API Keys"
2. Copiez :
   - **Publishable key** (commence par `pk_test_`)
   - **Secret key** (commence par `sk_test_`)

### 4.4 Configurer les URLs

1. Dans le menu de gauche, allez dans "Paths"
2. Configurez :
   - **Sign-in URL** : `/sign-in`
   - **Sign-up URL** : `/sign-up`
   - **After sign-in** : `/dashboard`
   - **After sign-up** : `/onboarding`

---

## Étape 5 : Variables d'environnement

### 5.1 Créer le fichier .env.local

1. À la racine du projet, créez un fichier `.env.local`
2. Copiez-collez ce contenu :

```env
# === OBLIGATOIRE : Neon Database ===
DATABASE_URL=COLLEZ_ICI_VOTRE_URL_NEON

# === OBLIGATOIRE : Clerk Authentication ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=COLLEZ_ICI_VOTRE_PUBLISHABLE_KEY
CLERK_SECRET_KEY=COLLEZ_ICI_VOTRE_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# === Application ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# === OPTIONNEL : Services avancés (pour plus tard) ===
# RADAR_API_KEY=
# RESEND_API_KEY=
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TELEGRAM_BOT_TOKEN=
# NEXT_PUBLIC_PUSHER_APP_KEY=
# PUSHER_SECRET=
# STRIPE_SECRET_KEY=
# UPLOADTHING_SECRET=
```

### 5.2 Remplacer les valeurs

Remplacez :
- `COLLEZ_ICI_VOTRE_URL_NEON` par l'URL de l'étape 3.3
- `COLLEZ_ICI_VOTRE_PUBLISHABLE_KEY` par la clé de l'étape 4.3
- `COLLEZ_ICI_VOTRE_SECRET_KEY` par la clé de l'étape 4.3

**⚠️ Important** : Ne commitez JAMAIS ce fichier sur Git (il est déjà dans .gitignore)

---

## Étape 6 : Créer la base de données

### 6.1 Générer les migrations

```bash
npm run db:generate
```

Vous devriez voir :
```
✓ Generating migrations...
✓ Migrations generated successfully
```

### 6.2 Appliquer les migrations

```bash
npm run db:push
```

Vous devriez voir :
```
✓ Applying migrations...
✓ Database schema created
```

### 6.3 (Optionnel) Vérifier la base de données

Lancez Drizzle Studio pour voir vos tables :

```bash
npm run db:studio
```

Cela ouvrira une interface web sur https://local.drizzle.studio

---

## Étape 7 : Lancer l'application

### 7.1 Démarrer le serveur de développement

```bash
npm run dev
```

Vous devriez voir :
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

✓ Ready in X.Xs
```

### 7.2 Ouvrir dans le navigateur

Ouvrez [http://localhost:3000](http://localhost:3000)

Vous devriez voir la page d'accueil de FestivalDrive !

---

## Étape 8 : Créer votre premier compte

### 8.1 Inscription

1. Cliquez sur "Commencer gratuitement" ou "Sign up"
2. Remplissez le formulaire :
   - Email : votre@email.com
   - Mot de passe : minimum 8 caractères
3. Cliquez sur "Create account"

### 8.2 Vérification email

1. Vérifiez votre boîte email
2. Cliquez sur le lien de vérification Clerk
3. Vous serez redirigé vers `/onboarding` (page à créer)

---

## ✅ Vérification de l'installation

### Checklist :

- [ ] Le site s'affiche sur http://localhost:3000
- [ ] La page d'accueil est jolie avec les prix et features
- [ ] Vous pouvez vous inscrire avec Clerk
- [ ] Les tables sont créées dans Neon (vérifiable via Drizzle Studio)
- [ ] Aucune erreur dans la console

---

## 🔧 Dépannage

### Erreur "DATABASE_URL is not set"

➡️ Vérifiez que votre `.env.local` contient bien `DATABASE_URL=...`

### Erreur "Clerk keys not found"

➡️ Vérifiez que les clés Clerk sont bien dans `.env.local`

### Erreur de connexion à Neon

➡️ Vérifiez que l'URL Neon est correcte et contient bien `?sslmode=require` à la fin

### Le site ne se lance pas

```bash
# Supprimez node_modules et réinstallez
rm -rf node_modules
npm install
npm run dev
```

### Erreur de migration Drizzle

```bash
# Supprimez le dossier migrations et régénérez
rm -rf lib/db/migrations
npm run db:generate
npm run db:push
```

---

## 📚 Prochaines étapes

Maintenant que l'application fonctionne, vous pouvez :

1. **Développer les dashboards** : Créer les pages `/dashboard` pour chaque rôle
2. **Implémenter la gestion des transports** : Formulaires de demandes VIP
3. **Créer le tableau d'affectation** : Interface type Excel
4. **Ajouter l'algorithme d'affectation automatique**
5. **Intégrer Radar API** pour le calcul de distances
6. **Configurer Resend** pour les emails
7. **Ajouter Stripe** pour les paiements

Consultez le fichier `README.md` pour la documentation complète.

---

## 🆘 Besoin d'aide ?

- Consultez la [documentation Next.js](https://nextjs.org/docs)
- Consultez la [documentation Clerk](https://clerk.com/docs)
- Consultez la [documentation Drizzle](https://orm.drizzle.team)
- Ouvrez une issue sur GitHub

---

**🎉 Félicitations ! Votre environnement FestivalDrive est prêt !**
