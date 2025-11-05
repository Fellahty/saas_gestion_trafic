'use client';

import { memo } from 'react';
import Sidebar from './Sidebar';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar />
      <main className="flex-1 lg:ml-72 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default memo(Layout);

