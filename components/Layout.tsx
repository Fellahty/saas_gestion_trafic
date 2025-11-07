'use client';

import { memo } from 'react';
import Sidebar from './Sidebar';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 container-zoom-safe">
      <Sidebar />
      <main className="flex-1 lg:ml-72 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 animate-fade-in container-zoom-safe overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

export default memo(Layout);

