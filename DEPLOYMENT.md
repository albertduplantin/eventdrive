# Guide de Déploiement - FestivalDrive

Ce guide vous explique comment déployer l'application FestivalDrive en production sur Vercel.

## 📋 Prérequis

- Un compte GitHub
- Un compte Vercel (gratuit sur https://vercel.com)
- Un compte Clerk (pour l'authentification)
- Une base de données Neon PostgreSQL (déjà configurée)

## 🚀 Étapes de Déploiement

### 1. Préparation du Repository Git

```bash
# Initialiser git si ce n'est pas déjà fait
git init

# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Initial commit - FestivalDrive application"

# Créer un repository sur GitHub et le lier
git remote add origin https://github.com/VOTRE_USERNAME/festivaldrive.git
git branch -M main
git push -u origin main
```

### 2. Configuration de Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur "Add New Project"
3. Importez votre repository GitHub
4. Vercel détectera automatiquement Next.js

### 3. Variables d'Environnement

Ajoutez ces variables d'environnement dans les paramètres Vercel :

#### Base de données Neon
```
DATABASE_URL=votre_url_neon_postgresql
```

#### Clerk Authentication
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### URLs de redirection Clerk
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### 4. Configuration Clerk pour Production

1. Allez dans votre dashboard Clerk
2. Dans **"Domains"**, ajoutez votre domaine Vercel (ex: `votre-app.vercel.app`)
3. Mettez à jour les **Redirect URLs** pour inclure votre domaine de production
4. Générez de nouvelles clés API pour la production (si nécessaire)

### 5. Déploiement

1. Cliquez sur "Deploy" dans Vercel
2. Vercel va :
   - Installer les dépendances
   - Exécuter le build Next.js
   - Déployer l'application
   - Fournir une URL de production

### 6. Configuration du Domaine (Optionnel)

Pour utiliser votre propre domaine :

1. Allez dans **Project Settings** → **Domains**
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS selon les instructions Vercel
4. Mettez à jour les URLs dans Clerk

## 🔧 Configuration Post-Déploiement

### Migrations de Base de Données

Les migrations Drizzle doivent être appliquées à votre base de données de production :

```bash
# En local, pointer vers la DB de production
export DATABASE_URL="votre_url_production"
npm run db:push
```

### Données Initiales

Créez un festival initial et un utilisateur admin via l'interface une fois déployé.

## 📊 Monitoring

### Logs Vercel
- Consultez les logs en temps réel dans le dashboard Vercel
- Activez les alertes pour les erreurs

### Performance
- Vercel fournit des analytics automatiques
- Activez **Web Analytics** pour suivre les performances

## 🔒 Sécurité

### Variables d'Environnement
- ✅ Toutes les clés sensibles sont dans des variables d'environnement
- ✅ `.env*` est dans `.gitignore`
- ✅ Utilisez des clés différentes pour dev/prod

### HTTPS
- ✅ Activé automatiquement par Vercel
- ✅ Certificat SSL gratuit inclus

## 🚨 Résolution de Problèmes

### Build échoue
1. Vérifiez les logs de build dans Vercel
2. Assurez-vous que toutes les variables d'environnement sont configurées
3. Testez le build localement : `npm run build`

### Erreurs d'authentification
1. Vérifiez que les URLs Clerk sont correctes
2. Assurez-vous que le domaine est ajouté dans Clerk
3. Vérifiez les clés API Clerk

### Erreurs de base de données
1. Vérifiez la chaîne de connexion `DATABASE_URL`
2. Assurez-vous que les migrations sont appliquées
3. Vérifiez que Neon autorise les connexions depuis Vercel

## 📝 Checklist de Déploiement

- [ ] Code poussé sur GitHub
- [ ] Repository importé dans Vercel
- [ ] Variables d'environnement configurées
- [ ] Domaine Vercel ajouté dans Clerk
- [ ] URLs de redirection Clerk mises à jour
- [ ] Migrations de base de données appliquées
- [ ] Application déployée avec succès
- [ ] Test de connexion/inscription
- [ ] Test des fonctionnalités principales
- [ ] Domaine personnalisé configuré (optionnel)

## 🔄 Déploiements Futurs

Vercel déploie automatiquement :
- **Production** : À chaque push sur la branche `main`
- **Preview** : À chaque pull request

Pour déployer manuellement :
```bash
git add .
git commit -m "Description des changements"
git push
```

Vercel détectera le push et déploiera automatiquement en quelques minutes.

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Next.js Deployment](https://nextjs.org/docs/deployment)
- [Documentation Clerk](https://clerk.com/docs)
- [Documentation Neon](https://neon.tech/docs)

## 🎉 C'est Fait !

Votre application FestivalDrive est maintenant en ligne et accessible à l'adresse fournie par Vercel !
