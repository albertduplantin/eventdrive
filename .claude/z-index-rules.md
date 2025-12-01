# Règles pour les Dialogs

## Problèmes Identifiés (30 nov 2025)

### 1. Superposition de texte (z-index)
Les placeholders et contenus des formulaires dans les dialogs se superposaient avec les titres (DialogTitle) et descriptions (DialogDescription).

### 2. Dialog transparent
Le DialogContent était transparent (bg-background) ce qui rendait le contenu derrière visible.

## Solutions Appliquées

### 1. Components UI Dialog (`components/ui/dialog.tsx`)

**DialogContent - Fond opaque:**
```tsx
className="... bg-white border-2 shadow-2xl ..."
// bg-white: fond blanc opaque (pas bg-background)
// border-2: bordure visible
// shadow-2xl: ombre prononcée
```

**Éléments du header - Z-index élevé:**
Les éléments du header doivent avoir un z-index plus élevé que le contenu:

```tsx
// DialogHeader
className="flex flex-col space-y-1.5 text-center sm:text-left relative z-10"

// DialogTitle
className="text-lg font-semibold leading-none tracking-tight relative z-10"

// DialogDescription
className="text-sm text-muted-foreground relative z-10"
```

### 2. Contenus des Dialogs
Les formulaires et divs de contenu doivent avoir un z-index inférieur:

```tsx
// Dans les composants de dialog (vip-form-dialog.tsx, vip-import-dialog.tsx, etc.)
<form className="space-y-6 relative z-0">
// ou
<div className="space-y-6 relative z-0">
```

## Hiérarchie Z-Index dans les Dialogs

```
DialogOverlay: z-50 (fond noir semi-transparent)
DialogContent: z-50 (le dialog lui-même)
  └─ DialogHeader: relative z-10 (en-tête)
      ├─ DialogTitle: relative z-10 (titre)
      └─ DialogDescription: relative z-10 (description)
  └─ Form/Content: relative z-0 (contenu inférieur)
```

## Règles à Suivre

**TOUJOURS** dans les dialogs:

1. **DialogContent** → `bg-white border-2 shadow-2xl` (fond opaque blanc)
2. **DialogHeader, DialogTitle, DialogDescription** → `relative z-10` (au-dessus)
3. **Form ou div de contenu principal** → `relative z-0` (en-dessous)

## Fichiers Concernés
- `components/ui/dialog.tsx` ✓ corrigé
- `components/features/vip-form-dialog.tsx` ✓ corrigé
- `components/features/vip-import-dialog.tsx` ✓ corrigé

**Important**: Appliquer cette règle à TOUS les futurs dialogs créés dans l'application.
