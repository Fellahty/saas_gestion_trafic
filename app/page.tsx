'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase.config';

export default function Home() {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    // Timeout pour éviter un chargement infini
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Firebase Auth prend trop de temps, redirection vers login');
        router.push('/login');
      }
    }, 5000); // 5 secondes de timeout

    if (!loading) {
      clearTimeout(timeout);
      if (error) {
        console.error('Firebase Auth error:', error);
        router.push('/login');
      } else if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }

    return () => clearTimeout(timeout);
  }, [user, loading, error, router]);

  // Afficher l'erreur si présente
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <div className="text-red-600">Erreur d&apos;authentification: {error.message}</div>
        <button 
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg"
        >
          Aller à la page de connexion
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen flex-col gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p className="text-gray-600 text-sm">Chargement...</p>
    </div>
  );
}

