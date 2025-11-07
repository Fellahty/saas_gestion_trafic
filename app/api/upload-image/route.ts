import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialiser Firebase Admin SDK (une seule fois)
function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    // Chercher le fichier service account
    const serviceAccountPath = join(process.cwd(), 'trucksaas-firebase-adminsdk-fbsvc-7ff980fbf3.json');
    
    if (!existsSync(serviceAccountPath)) {
      throw new Error(`Service account file not found at: ${serviceAccountPath}`);
    }
    
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: 'trucksaas.firebasestorage.app'
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    return app;
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization error:', error);
    throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer FormData (une seule fois)
    const formData = await request.formData();
    
    // Initialiser Firebase Admin (doit être après le FormData car getAdminApp peut throw)
    let adminApp;
    try {
      adminApp = getAdminApp();
    } catch (error: any) {
      console.error('❌ Failed to initialize Firebase Admin:', error);
      return NextResponse.json(
        { 
          error: 'Erreur d\'initialisation Firebase Admin',
          message: error.message 
        },
        { status: 500 }
      );
    }
    
    if (!adminApp) {
      return NextResponse.json(
        { error: 'Firebase Admin non initialisé' },
        { status: 500 }
      );
    }
    
    // Vérifier l'authentification via le token (dans header ou formData)
    const authHeader = request.headers.get('authorization');
    let idToken: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.split('Bearer ')[1];
    } else {
      // Essayer de récupérer depuis FormData
      const tokenFromForm = formData.get('token') as string;
      if (tokenFromForm) {
        idToken = tokenFromForm;
      }
    }

    if (!idToken) {
      return NextResponse.json(
        { error: 'Non autorisé. Token manquant.' },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      const auth = getAuth(adminApp);
      decodedToken = await auth.verifyIdToken(idToken);
      console.log('✅ Token verified for user:', decodedToken.uid);
    } catch (error: any) {
      console.error('❌ Token verification error:', error);
      return NextResponse.json(
        { error: 'Token invalide ou expiré', details: error.message },
        { status: 401 }
      );
    }

    // Récupérer le fichier
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Le fichier est trop grand (max 10MB)' },
        { status: 400 }
      );
    }

    // Sanitizer le nom de fichier
    const sanitizeFileName = (fileName: string): string => {
      const lastDotIndex = fileName.lastIndexOf('.');
      const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1).toLowerCase() : '';
      const nameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
      
      let sanitized = nameWithoutExt
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
      
      if (!sanitized || sanitized === '_') {
        sanitized = 'image';
      }
      
      const maxLength = 30;
      if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
      }
      
      sanitized = sanitized.replace(/^_+|_+$/g, '');
      
      return extension ? `${sanitized}.${extension}` : sanitized;
    };

    const sanitizedFileName = sanitizeFileName(file.name);
    const fileName = `camions/${Date.now()}_${sanitizedFileName}`;

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('📤 Uploading file to Storage...', {
      fileName,
      size: buffer.length,
      contentType: file.type
    });

    // Uploader vers Firebase Storage
    const storage = getStorage(adminApp);
    const bucket = storage.bucket();
    const fileRef = bucket.file(fileName);

    // Uploader le fichier
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: decodedToken.uid,
          uploadedAt: new Date().toISOString(),
        },
      },
      public: true, // Rendre le fichier public directement
    });

    console.log('✅ File uploaded successfully');

    // Obtenir l'URL publique
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Vérifier que l'URL est accessible
    console.log('📎 File URL:', publicUrl);

    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      fileName 
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    
    // Retourner un message d'erreur plus détaillé
    const errorMessage = error.message || 'Erreur inconnue';
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? error.stack 
      : undefined;
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'upload',
        message: errorMessage,
        ...(errorDetails && { details: errorDetails })
      },
      { status: 500 }
    );
  }
}

