# Guide des Règles Firestore - FleetManager

## ⚠️ IMPORTANT : Vous NE DEVEZ PAS garder les règles actuelles (`allow read, write: if false;`)

Ces règles bloquent **TOUT** l'accès à la base de données. Votre application ne fonctionnera pas avec ces règles !

## 📋 Règles de Sécurité Créées

J'ai créé un fichier `firestore.rules` avec des règles sécurisées basées sur les rôles.

### 🔐 Permissions par Rôle

#### **Admin** 👑
- ✅ Accès complet à toutes les collections
- ✅ Peut créer, lire, modifier et supprimer

#### **Comptable** 💰
- ✅ Lecture : camions, chauffeurs, missions, finances
- ✅ Écriture : missions, dépenses, recettes
- ❌ Pas d'accès au stock

#### **Magasinier** 📦
- ✅ Lecture : camions, chauffeurs, stock, mouvements
- ✅ Écriture : stock, mouvements de stock
- ❌ Pas d'accès aux finances

#### **Chauffeur** 🚛
- ✅ Lecture : ses propres missions, ses absences, liste des chauffeurs
- ❌ Pas d'écriture (sauf modifications autorisées par l'admin)

## 📤 Comment Déployer les Règles

### Option 1 : Via Firebase Console (Recommandé pour débuter)

1. Ouvrez [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet `trucksaas`
3. Allez dans **Firestore Database** → **Règles**
4. Copiez le contenu du fichier `firestore.rules`
5. Collez dans l'éditeur
6. Cliquez sur **Publier**

### Option 2 : Via Firebase CLI

```bash
# Installer Firebase CLI (si pas déjà installé)
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser Firebase (si pas déjà fait)
firebase init firestore

# Déployer les règles
firebase deploy --only firestore:rules
```

## 🔒 Structure des Règles

Les règles vérifient :
1. ✅ Authentification requise (utilisateur connecté)
2. ✅ Rôle de l'utilisateur dans la collection `users`
3. ✅ Permissions selon le rôle

## ⚡ Note de Performance

Les règles utilisent `get()` pour récupérer le rôle utilisateur. Cela ajoute une lecture supplémentaire, mais assure la sécurité.

## 🚨 Règles Temporaires (Pour le Développement)

Si vous avez besoin de règles plus permissives temporairement pour tester :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // ⚠️ ATTENTION : Règles de développement uniquement !
      // À NE JAMAIS utiliser en production !
      allow read, write: if request.auth != null;
    }
  }
}
```

## ✅ Vérification

Après déploiement, testez :
1. ✅ Créer un compte utilisateur
2. ✅ Se connecter
3. ✅ Accéder au dashboard
4. ✅ Créer/modifier des données selon votre rôle

## 📝 Collections Protégées

- `users` - Utilisateurs et rôles
- `camions` - Véhicules
- `chauffeurs` - Conducteurs
- `missions` - Missions/Trajets
- `depenses` - Dépenses
- `recettes` - Recettes
- `stock` - Stock/Magasin
- `mouvementsStock` - Mouvements de stock
- `assurances` - Assurances
- `visitesTechniques` - Visites techniques
- `entretiens` - Entretiens
- `absences` - Absences

---

**✅ Utilisez le fichier `firestore.rules` fourni au lieu des règles restrictives actuelles !**
