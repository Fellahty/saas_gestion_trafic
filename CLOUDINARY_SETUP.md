# Configuration Cloudinary

Ce projet utilise Cloudinary pour le stockage et l'optimisation des images, ce qui évite les problèmes de CORS avec Firebase Storage.

## Pourquoi Cloudinary ?

- ✅ **Gratuit** jusqu'à 25GB de stockage et 25GB de bande passante/mois
- ✅ **Optimisation automatique** des images (compression, formats modernes)
- ✅ **Pas de problèmes CORS**
- ✅ **CDN global** pour des chargements rapides
- ✅ **Transformations d'images** à la volée (redimensionnement, crop, etc.)

## Configuration

1. **Créer un compte Cloudinary** (gratuit) :
   - Allez sur https://cloudinary.com/users/register/free
   - Créez un compte gratuit

2. **Obtenir vos clés API** :
   - Connectez-vous à https://console.cloudinary.com/
   - Allez dans **Settings** → **API Keys**
   - Copiez les valeurs suivantes :
     - Cloud Name
     - API Key
     - API Secret

3. **Configurer les variables d'environnement** :
   - Créez un fichier `.env.local` à la racine du projet (s'il n'existe pas déjà)
   - Ajoutez les variables suivantes :
   ```env
   CLOUDINARY_CLOUD_NAME=votre-cloud-name
   CLOUDINARY_API_KEY=votre-api-key
   CLOUDINARY_API_SECRET=votre-api-secret
   ```

4. **Redémarrer le serveur de développement** :
   ```bash
   npm run dev
   ```

## Utilisation

Les images uploadées via le formulaire de camions sont automatiquement :
- Stockées dans le dossier `camions/` sur Cloudinary
- Optimisées automatiquement (compression, formats modernes)
- Limitées à 1200x1200px maximum
- Accessibles via une URL publique sécurisée (HTTPS)

## Alternative : Utiliser Firebase Storage

Si vous préférez utiliser Firebase Storage, vous pouvez :
1. Configurer correctement les règles CORS dans Firebase Storage
2. Utiliser l'API route `/api/upload-image` au lieu de `/api/upload-cloudinary`
3. Modifier la fonction `uploadImage` dans `app/dashboard/camions/page.tsx`

## Support

Pour plus d'informations sur Cloudinary :
- Documentation : https://cloudinary.com/documentation
- Support : https://support.cloudinary.com/

