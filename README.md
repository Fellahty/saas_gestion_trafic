# FleetManager - SaaS Platform

Plateforme SaaS moderne pour la gestion de flotte de camions avec Firebase.

## Fonctionnalités

### 1. Camions
- Enregistrement des camions (matricule, marque, modèle, date d'achat, état)
- Suivi administratif (assurance, visite technique, vidanges, entretiens)
- Historique des affectations

### 2. Chauffeurs
- Fiche chauffeur (nom, contact, permis, contrat, salaire)
- Gestion des absences, congés, accidents
- Affectation aux trajets

### 3. Trajets / Missions
- Création de missions (départ, destination, date, camion, chauffeur)
- Coût estimé (carburant, péage, repas, etc.)
- Bilan à la fin du trajet (recette vs dépense)

### 4. Finance / Comptabilité
- Gestion des dépenses (carburant, entretien, salaires, achats divers)
- Gestion des recettes (paiements clients, livraisons)
- Suivi de trésorerie
- Rapports mensuels (profit, dépenses par camion ou chauffeur)
- Graphiques de performance

### 5. Stock / Magasin
- Gestion des pièces de rechange, pneus, huiles, filtres
- Entrées / sorties de stock
- Alertes de niveau bas
- Historique des mouvements

### 6. Utilisateurs et rôles
- Admin, comptable, magasinier, chauffeur
- Permissions par module

### 7. Dashboard
- Vue globale (nombre de camions, dépenses, recettes, missions en cours)
- Graphiques de performance par camion / chauffeur

## Technologies

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Firebase** - Base de données et authentification
- **Tailwind CSS** - Styling
- **Recharts** - Graphiques et visualisations
- **Lucide React** - Icônes

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer Firebase :
   - Créer un projet Firebase
   - Configurer les variables d'environnement dans `.env.local` :
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

3. Démarrer le serveur de développement :
```bash
npm run dev
```

4. Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Structure du projet

```
├── app/
│   ├── dashboard/          # Pages du dashboard
│   │   ├── camions/        # Module camions
│   │   ├── chauffeurs/     # Module chauffeurs
│   │   ├── trajets/        # Module trajets/missions
│   │   ├── finance/        # Module finance/comptabilité
│   │   ├── stock/          # Module stock/magasin
│   │   └── parametres/     # Paramètres et utilisateurs
│   ├── login/              # Page de connexion
│   └── layout.tsx          # Layout principal
├── components/
│   ├── Sidebar.tsx         # Sidebar de navigation
│   └── Layout.tsx           # Layout avec sidebar
├── lib/
│   ├── types.ts            # Types TypeScript
│   └── utils.ts             # Fonctions utilitaires
└── firebase.config.ts       # Configuration Firebase
```

## Rôles utilisateurs

- **Admin** : Accès complet à toutes les fonctionnalités
- **Comptable** : Accès au module Finance uniquement
- **Magasinier** : Accès au module Stock uniquement
- **Chauffeur** : Accès limité aux missions qui lui sont assignées

## Licence

MIT

# saas_gestion_trafic
