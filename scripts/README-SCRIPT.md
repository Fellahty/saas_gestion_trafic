# Scripts de génération de données

## Option 1: Script avec Firebase Admin SDK (Terminal)

### Prérequis
1. Installer Firebase Admin SDK :
   ```bash
   npm install firebase-admin
   ```

2. Obtenir un Service Account Key :
   - Aller sur [Firebase Console](https://console.firebase.google.com/)
   - Sélectionner votre projet
   - Aller dans **Project Settings** > **Service Accounts**
   - Cliquer sur **Generate new private key**
   - Télécharger le fichier JSON
   - Le renommer en `serviceAccountKey.json`
   - Le placer dans la racine du projet (même niveau que `package.json`)

3. Ajouter `serviceAccountKey.json` au `.gitignore` :
   ```
   serviceAccountKey.json
   ```

### Utilisation
```bash
node scripts/clear-and-seed-admin.js
```

## Option 2: Page Web (Recommandé - Plus simple)

Aller sur `/dashboard/admin/clear-and-seed` dans votre navigateur et utiliser l'interface web.

## Option 3: Règles temporaires (Non recommandé - Risque de sécurité)

⚠️ **ATTENTION** : Ne pas utiliser en production !

1. Sauvegarder les règles actuelles :
   ```bash
   cp firestore.rules firestore.rules.backup
   ```

2. Copier les règles temporaires :
   ```bash
   cp firestore.rules.temp firestore.rules
   ```

3. Déployer les règles temporaires :
   ```bash
   firebase deploy --only firestore:rules
   ```

4. Exécuter le script :
   ```bash
   node scripts/clear-and-seed.js
   ```

5. Restaurer les règles originales :
   ```bash
   cp firestore.rules.backup firestore.rules
   firebase deploy --only firestore:rules
   ```

6. Supprimer le fichier temporaire :
   ```bash
   rm firestore.rules.backup
   ```

