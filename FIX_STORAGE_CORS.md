# 🔧 Solution pour l'erreur CORS Firebase Storage

## Problème
L'erreur CORS indique que le bucket Firebase Storage n'a pas les bonnes configurations CORS pour accepter les requêtes depuis `localhost:3000`.

## Solutions possibles

### Solution 1: Configurer CORS via Google Cloud Console (Recommandé)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionnez votre projet: **trucksaas**
3. Dans le menu, allez dans **Cloud Storage** → **Buckets**
4. Cliquez sur votre bucket: `trucksaas.firebasestorage.app`
5. Cliquez sur l'onglet **Configuration**
6. Faites défiler jusqu'à **CORS configuration**
7. Cliquez sur **Edit CORS configuration**
8. Collez cette configuration:

```json
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3001"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
    "responseHeader": ["Content-Type", "Authorization", "x-goog-resumable", "x-goog-meta-*"],
    "maxAgeSeconds": 3600
  }
]
```

9. Cliquez sur **Save**

### Solution 2: Utiliser gsutil (Ligne de commande)

Si vous avez `gsutil` installé:

```bash
# Installer Google Cloud SDK si nécessaire
# https://cloud.google.com/sdk/docs/install

# Configurer CORS
gsutil cors set cors.json gs://trucksaas.firebasestorage.app
```

### Solution 3: Utiliser Firebase CLI

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Configurer CORS via Firebase CLI (si supporté)
# Note: Firebase CLI ne supporte pas directement CORS, utilisez gsutil
```

### Solution 4: Solution de contournement - Utiliser Firebase Admin SDK (Server-side)

Si les solutions ci-dessus ne fonctionnent pas, vous pouvez créer une API route Next.js qui gère l'upload côté serveur:

```typescript
// app/api/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Initialiser Firebase Admin (une seule fois)
if (!global.firebaseAdminApp) {
  global.firebaseAdminApp = initializeApp({
    credential: cert(/* votre service account */),
    storageBucket: 'trucksaas.firebasestorage.app'
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = getStorage().bucket();
    const fileName = `camions/${Date.now()}_${file.name}`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

## Vérification

Après avoir configuré CORS:

1. Attendez 1-2 minutes pour que les changements se propagent
2. Rechargez votre application
3. Essayez d'uploader une image
4. Vérifiez la console du navigateur

## Si ça ne fonctionne toujours pas

1. **Vérifiez que Storage est activé:**
   - Firebase Console → Storage
   - Si vous voyez "Get Started", activez Storage

2. **Vérifiez les règles Storage:**
   - Storage → Rules
   - Doit contenir: `allow read, write: if true;`

3. **Vérifiez l'authentification:**
   - Vous devez être connecté dans l'application
   - Vérifiez dans la console: `userId` doit être présent

4. **Essayez avec un autre navigateur:**
   - Parfois le cache du navigateur peut causer des problèmes

## Alternative: Upload via API Route (Solution de secours)

Si CORS continue à poser problème, je peux créer une API route Next.js qui gère l'upload côté serveur, ce qui contourne complètement les problèmes CORS.

