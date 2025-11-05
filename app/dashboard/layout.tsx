'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase.config';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!loading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main id="main-content" className="flex-1 overflow-y-auto min-w-0 max-w-full" role="main" tabIndex={-1}>
        {/* Spacer pour mobile - éviter que le contenu passe sous les boutons */}
        <div className="lg:hidden h-16 w-full flex-shrink-0" />
        <div className="w-full max-w-full mx-auto px-2 sm:px-3 lg:px-4 py-3 sm:py-4">
          <div className="w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

