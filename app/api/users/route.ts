import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialiser Firebase Admin SDK (une seule fois)
function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    const serviceAccountPath = join(process.cwd(), 'trucksaas-firebase-adminsdk-fbsvc-7ff980fbf3.json');
    
    if (!existsSync(serviceAccountPath)) {
      throw new Error(`Service account file not found at: ${serviceAccountPath}`);
    }
    
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: 'trucksaas.firebasestorage.app'
    });
    
    return app;
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization error:', error);
    throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
  }
}

// GET - List users (for admin verification)
export async function GET(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    const auth = getAuth(adminApp);
    
    // Get the auth token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    const auth = getAuth(adminApp);
    
    // Get the auth token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { email, password, name, role } = body;
    
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }
    
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });
    
    // Create Firestore user document
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      role,
      createdAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.uid,
        email,
        name,
        role,
      }
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    let errorMessage = 'Erreur lors de la création de l\'utilisateur';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Cet email est déjà utilisé';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Adresse email invalide';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    const auth = getAuth(adminApp);
    
    // Get the auth token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { userId, email, name, role, password } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Update Firebase Auth user if email or password provided
    if (email || password) {
      const authUpdateData: any = {};
      if (email) authUpdateData.email = email;
      if (password) authUpdateData.password = password;
      
      await auth.updateUser(userId, authUpdateData);
    }
    
    // Update Firestore user document
    const firestoreUpdateData: any = {};
    if (name) firestoreUpdateData.name = name;
    if (role) firestoreUpdateData.role = role;
    if (email) firestoreUpdateData.email = email; // Also update email in Firestore
    
    if (Object.keys(firestoreUpdateData).length > 0) {
      await db.collection('users').doc(userId).update(firestoreUpdateData);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    let errorMessage = 'Erreur lors de la mise à jour de l\'utilisateur';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Cet email est déjà utilisé';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Adresse email invalide';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'Utilisateur non trouvé';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    const auth = getAuth(adminApp);
    
    // Get the auth token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user is admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Prevent deleting yourself
    if (userId === decodedToken.uid) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }
    
    // Delete Firebase Auth user
    await auth.deleteUser(userId);
    
    // Delete Firestore user document
    await db.collection('users').doc(userId).delete();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    let errorMessage = 'Erreur lors de la suppression de l\'utilisateur';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Utilisateur non trouvé';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

