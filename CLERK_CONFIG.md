# Configuration Clerk

## Désactiver la vérification par email

Pour désactiver la vérification obligatoire de l'email dans Clerk:

1. **Aller sur votre dashboard Clerk** : https://dashboard.clerk.com
2. **Sélectionner votre application** (generous-chicken-93)
3. **Aller dans "User & Authentication" → "Email, Phone, Username"**
4. **Désactiver "Verify at sign-up"** pour l'email
5. **Ou bien : Activer "Password" comme méthode de connexion** au lieu de "Email code"

### Configuration recommandée

Pour une expérience utilisateur simple:

**Option 1 : Email + Mot de passe (recommandé)**
- Activer "Email address"
- Activer "Password"
- Désactiver "Email verification code"
- Désactiver "Verify at sign-up" (optionnel)

**Option 2 : Email sans vérification**
- Activer "Email address"
- Désactiver "Verify at sign-up"
- Garder "Email verification code" si vous voulez permettre la connexion par code

### Paramètres de redirection

Les redirections sont déjà configurées dans le code:

- Après connexion (`sign-in`) → `/dashboard`
- Après inscription (`sign-up`) → `/onboarding`
- Homepage quand connecté → `/dashboard` (automatique via middleware)

## Sessions et sécurité

Les paramètres suivants sont recommandés pour la production:

1. **Session lifetime** : 7 jours (par défaut)
2. **Multi-session handling** : Active (permet plusieurs appareils)
3. **Sign-out redirect** : `/` (homepage)

## Personnalisation visuelle

Pour personnaliser l'apparence de Clerk:

1. Dashboard Clerk → **Customization** → **Themes**
2. Ou utiliser le prop `appearance` dans les composants (déjà configuré dans le code)
