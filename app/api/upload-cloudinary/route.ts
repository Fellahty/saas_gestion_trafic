import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export async function POST(request: NextRequest) {
  try {
    // Vérifier la configuration
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('❌ Cloudinary non configuré. Variables manquantes:', {
        hasCloudName: !!cloudName,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
      });
      
      return NextResponse.json(
        { 
          error: 'Cloudinary n\'est pas configuré',
          message: 'Veuillez configurer CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans votre fichier .env.local. Consultez CLOUDINARY_SETUP.md pour plus d\'informations.',
          code: 'CLOUDINARY_NOT_CONFIGURED'
        },
        { status: 500 }
      );
    }

    // Récupérer FormData
    const formData = await request.formData();
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

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convertir le buffer en base64
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Uploader vers Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: 'camions',
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // Limiter la taille
        { quality: 'auto' }, // Optimisation automatique
      ],
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });

  } catch (error: any) {
    console.error('❌ Cloudinary upload error:', error);
    
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'upload',
        message: error.message || 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

