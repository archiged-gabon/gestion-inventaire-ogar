# Inventaire Archiged

Application web moderne pour la gestion et l'inventaire des dossiers d'assurances. Cette application facilite le suivi des polices d'assurance avec une interface intuitive et des fonctionnalités avancées de recherche, filtrage et export de données.

## 📋 Table des matières

- [Description](#description)
- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [Développement](#développement)
- [Déploiement](#déploiement)

## 📖 Description

Inventaire Archiged est une application web complète permettant de gérer efficacement un inventaire documentaire de polices d'assurance. L'application offre une interface moderne et intuitive pour :

- Enregistrer et gérer des polices d'assurance
- Rechercher et filtrer les données en temps réel
- Exporter les données au format Excel
- Suivre les statistiques par agent
- Détecter et gérer les doublons

## ✨ Fonctionnalités

### Gestion de l'inventaire

- **Ajout de polices** : Formulaire complet pour enregistrer les informations d'une police d'assurance
  - Numéro intermédiaire ORASS
  - Numéro de police ORASS
  - Ancien numéro (optionnel)
  - Dates d'effet et d'échéance
  - Nom de l'assuré
  - Société concernée (Vie, IARD (Sinistre), Production)
  - Type de document
  - État du contrat (Actif, Résilié)
  - Nom de l'agent d'inventaire

- **Tableau interactif** : Affichage paginé des polices avec tri et colonnes personnalisables

- **Détection de doublons** : Système intelligent de détection des doublons basé sur plusieurs critères (numéro de police, nom d'assuré, dates, etc.)

### Recherche et filtres

- **Recherche en temps réel** : Recherche insensible à la casse et aux accents
- **Filtres avancés** :
  - Par société concernée
  - Par type de document
  - Par état du contrat
  - Par plage de dates (date d'effet)
  - Par mot-clé (recherche dans plusieurs champs)

### Statistiques

- **Statistiques globales** : Vue d'ensemble avec compteurs totaux
- **Statistiques par agent** :
  - Total de polices par agent
  - Répartition par état (Actif/Résilié)
  - Statistiques par type de société
  - Statistiques journalières
  - Dernière activité

### Export de données

- **Export Excel** : Export de toutes les données ou des données filtrées
- **Format structuré** : Export avec formatage et colonnes organisées

### Gestion des doublons

- **Détection automatique** : Identification des doublons potentiels lors de l'ajout
- **Gestionnaire de doublons** : Interface dédiée pour visualiser et supprimer les doublons

## 🛠 Technologies utilisées

- **Frontend** :
  - [React](https://react.dev/) 18.3.1 - Bibliothèque JavaScript pour l'interface utilisateur
  - [TypeScript](https://www.typescriptlang.org/) 5.8.3 - Langage de programmation typé
  - [Vite](https://vitejs.dev/) 5.4.19 - Outil de build et serveur de développement
  - [Tailwind CSS](https://tailwindcss.com/) 3.4.17 - Framework CSS utility-first
  - [shadcn/ui](https://ui.shadcn.com/) - Composants UI modernes basés sur Radix UI
  - [React Router](https://reactrouter.com/) 6.30.1 - Routage côté client
  - [React Hook Form](https://react-hook-form.com/) 7.61.1 - Gestion de formulaires
  - [Zod](https://zod.dev/) 3.25.76 - Validation de schémas TypeScript

- **Backend / Base de données** :
  - [Supabase](https://supabase.com/) - Backend-as-a-Service avec PostgreSQL
  - PostgreSQL - Base de données relationnelle

- **Outils** :
  - [TanStack Query](https://tanstack.com/query) 5.83.0 - Gestion d'état serveur et mise en cache
  - [xlsx](https://github.com/SheetJS/sheetjs) 0.18.5 - Export Excel
  - [date-fns](https://date-fns.org/) 3.6.0 - Manipulation de dates
  - [lucide-react](https://lucide.dev/) - Icônes

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 18 ou supérieure) - [Télécharger Node.js](https://nodejs.org/)
- **Yarn** (gestionnaire de paquets) - [Installer Yarn](https://yarnpkg.com/getting-started/install)
- **Compte Supabase** avec un projet configuré

## 🚀 Installation

1. **Cloner le dépôt**

```bash
git clone <URL_DU_DEPOT>
cd inventaire-simple
```

2. **Installer les dépendances**

```bash
yarn install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du projet en copiant le fichier `env.example` :

```bash
cp env.example .env
```

Puis modifiez le fichier `.env` avec vos propres identifiants Supabase :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
```

4. **Configurer la base de données**

Assurez-vous que toutes les migrations Supabase sont appliquées. Les fichiers de migration se trouvent dans le dossier `supabase/migrations/`.

## ⚙️ Configuration

### Configuration Supabase

L'application nécessite une base de données Supabase avec :

- Table `inventory` pour stocker les polices d'assurance
- Fonctions RPC pour les statistiques d'agents
- Index pour optimiser les performances
- Politiques RLS (Row Level Security) configurées

Consultez les fichiers de migration dans `supabase/migrations/` pour plus de détails.

### Configuration du serveur de développement

Le serveur de développement est configuré pour écouter sur le port 8080. Vous pouvez modifier le port dans `vite.config.ts` si nécessaire.

## 💻 Utilisation

### Lancer l'application en mode développement

```bash
yarn dev
```

L'application sera accessible à l'adresse : `http://localhost:8080`

### Construire l'application pour la production

```bash
yarn build
```

Les fichiers de production seront générés dans le dossier `dist/`.

### Prévisualiser la version de production

```bash
yarn preview
```

### Linting du code

```bash
yarn lint
```

## 📁 Structure du projet

```
inventaire-simple/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── ui/              # Composants UI de base (shadcn/ui)
│   │   ├── InventoryForm.tsx      # Formulaire d'ajout de police
│   │   ├── InventoryTable.tsx     # Tableau d'affichage des polices
│   │   ├── Filters.tsx            # Composant de filtrage
│   │   ├── AgentStats.tsx         # Statistiques par agent
│   │   ├── DuplicateManager.tsx   # Gestionnaire de doublons
│   │   └── ...
│   ├── hooks/               # Hooks React personnalisés
│   │   ├── useInventory.ts        # Hook principal pour la gestion de l'inventaire
│   │   └── ...
│   ├── pages/               # Pages de l'application
│   │   ├── Index.tsx             # Page principale
│   │   └── NotFound.tsx          # Page 404
│   ├── utils/               # Fonctions utilitaires
│   │   ├── excelExport.ts        # Export Excel
│   │   ├── duplicateDetection.ts # Détection de doublons
│   │   └── filterValidation.ts   # Validation des filtres
│   ├── integrations/       # Intégrations externes
│   │   └── supabase/        # Configuration Supabase
│   ├── lib/                 # Bibliothèques et helpers
│   └── App.tsx              # Composant racine
├── supabase/
│   └── migrations/          # Migrations de base de données
├── public/                  # Fichiers statiques
├── dist/                   # Fichiers de build (généré)
├── index.html              # Point d'entrée HTML
├── vite.config.ts          # Configuration Vite
├── tailwind.config.ts      # Configuration Tailwind CSS
├── tsconfig.json           # Configuration TypeScript
└── package.json            # Dépendances du projet
```

## 🔧 Développement

### Architecture du projet

L'application suit une architecture modulaire avec :

- **Composants** : Composants React réutilisables et modulaires
- **Hooks** : Logique métier encapsulée dans des hooks personnalisés
- **Utils** : Fonctions utilitaires pures
- **Types** : Définitions TypeScript centralisées

### Ajout de nouvelles fonctionnalités

1. **Nouvelle migration de base de données** : Ajoutez un fichier SQL dans `supabase/migrations/`
2. **Nouveau composant** : Créez-le dans `src/components/`
3. **Nouvelle page** : Ajoutez-la dans `src/pages/` et configurez la route dans `App.tsx`

### Bonnes pratiques

- Utilisez TypeScript pour tous les nouveaux fichiers
- Suivez les conventions de nommage (PascalCase pour les composants, camelCase pour les fonctions)
- Commentez le code complexe en français
- Utilisez les hooks personnalisés pour la logique métier
- Validez les données avec Zod avant de les envoyer à Supabase

## 🚢 Déploiement

### Préparer le build

```bash
yarn build
```

### Déploiement sur Vercel

L'application est configurée pour être déployée sur Vercel. Un fichier `vercel.json` est présent à la racine du projet.

1. Connectez votre dépôt GitHub à Vercel
2. Configurez les variables d'environnement dans les paramètres du projet Vercel
3. Le déploiement se fera automatiquement à chaque push

### Variables d'environnement en production

Assurez-vous de configurer les variables d'environnement suivantes dans votre plateforme de déploiement :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📝 Notes importantes

- L'application utilise Supabase pour le backend. Assurez-vous que votre projet Supabase est correctement configuré
- Les migrations de base de données doivent être appliquées dans l'ordre
- Pour la production, configurez les politiques RLS appropriées pour la sécurité

## 📄 Licence

Ce projet est privé et destiné à un usage interne.

## 🤝 Support

Pour toute question ou problème, contactez l'équipe de développement.

---

**Développé avec ❤️ pour Archiged**
