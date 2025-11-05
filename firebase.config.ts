import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Validation et nettoyage des variables d'environnement
const cleanEnvVar = (value: string | undefined, fallback: string): string => {
  if (!value) return fallback;
  // Supprimer les espaces et les retours à la ligne
  return value.trim().replace(/[\r\n]/g, '');
};

const firebaseConfig = {
  apiKey: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, "AIzaSyA03A1KRYQ5gqYmB2ywCXytKRoCUcTFXv0"),
  authDomain: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, "trucksaas.firebaseapp.com"),
  projectId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, "trucksaas"),
  storageBucket: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, "trucksaas.firebasestorage.app"),
  messagingSenderId: String(cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, "816010012119")),
  appId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, "1:816010012119:web:e824b909c2d346783c1792"),
  measurementId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, "G-5K1RYDYZXV")
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

// Initialisation Firebase avec gestion d'erreur
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // En cas d'erreur, réessayer avec les valeurs par défaut
  try {
    const defaultConfig = {
      apiKey: "AIzaSyA03A1KRYQ5gqYmB2ywCXytKRoCUcTFXv0",
      authDomain: "trucksaas.firebaseapp.com",
      projectId: "trucksaas",
      storageBucket: "trucksaas.firebasestorage.app",
      messagingSenderId: "816010012119",
      appId: "1:816010012119:web:e824b909c2d346783c1792",
      measurementId: "G-5K1RYDYZXV"
    };
    app = initializeApp(defaultConfig, 'fallback');
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (fallbackError) {
    console.error('Firebase fallback initialization error:', fallbackError);
    throw fallbackError;
  }
}

// Storage - initialisation côté client uniquement pour éviter les problèmes SSR
export const getStorageInstance = (): FirebaseStorage | null => {
  if (typeof window === 'undefined') return null;
  if (!storage) {
    try {
      storage = getStorage(app);
    } catch (error) {
      console.error('Firebase Storage initialization error:', error);
      return null;
    }
  }
  return storage;
};

// Analytics sera initialisé côté client de manière asynchrone
// On l'exporte comme fonction pour éviter les problèmes SSR
export const getAnalyticsInstance = async (): Promise<Analytics | null> => {
  if (typeof window === 'undefined') return null;
  
  try {
    const supported = await isSupported();
    if (supported && !analytics) {
      analytics = getAnalytics(app);
    }
    return analytics;
  } catch (error) {
    console.error('Firebase Analytics initialization error:', error);
    return null;
  }
};

export { app, auth, db, storage, analytics };

