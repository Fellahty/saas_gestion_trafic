'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase.config';
import Image from 'next/image';
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  DollarSign,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Building,
  Bell,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  section?: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', section: 'main' },
  { icon: Calendar, label: 'Calendrier', href: '/dashboard/calendrier', section: 'main' },
  { icon: Bell, label: 'Alertes', href: '/dashboard/alertes', section: 'main' },
  { icon: BarChart3, label: 'Rapports', href: '/dashboard/rapports', section: 'main' },
  { icon: Truck, label: 'Camions', href: '/dashboard/camions', section: 'operations' },
  { icon: Users, label: 'Chauffeurs', href: '/dashboard/chauffeurs', section: 'operations' },
  { icon: MapPin, label: 'Trajets', href: '/dashboard/trajets', section: 'operations' },
  { icon: Package, label: 'Stock', href: '/dashboard/stock', section: 'operations' },
  { icon: FileText, label: 'Factures', href: '/dashboard/factures', section: 'finance' },
  { icon: Building, label: 'Clients', href: '/dashboard/clients', section: 'finance' },
  { icon: DollarSign, label: 'Finance', href: '/dashboard/finance', section: 'finance' },
  { icon: Settings, label: 'Paramètres', href: '/dashboard/parametres', section: 'main' },
];

const menuSections = {
  main: 'Principal',
  operations: 'Opérations',
  finance: 'Finance',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    main: true,
    operations: false,
    finance: false,
  });

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [router]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  // Close mobile menu when clicking outside or on a link
  const closeMobileMenu = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const getItemsBySection = useCallback((section: string) => {
    return menuItems.filter(item => item.section === section);
  }, []);

  return (
    <>
      {/* Skip to main content link (Accessibility) */}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      {/* Mobile menu button and logout button */}
      <div className="lg:hidden fixed top-3 left-3 right-3 z-[100] flex items-center justify-between gap-2 pointer-events-none">
        {/* Menu button - Modern design with backdrop blur */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          aria-label={isMobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={isMobileOpen}
          aria-controls="mobile-menu"
          className={`
            relative p-3 rounded-xl shadow-2xl
            backdrop-blur-md bg-white/90 dark:bg-gray-900/90
            border border-white/20
            transition-all duration-300 ease-out
            hover:scale-105 active:scale-95
            focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
            touch-manipulation pointer-events-auto
            ${isMobileOpen 
              ? 'bg-primary-600/90 text-white shadow-primary-500/50' 
              : 'text-gray-900 dark:text-white hover:bg-white/95'
            }
          `}
        >
          <div className="relative z-10">
            {isMobileOpen ? (
              <X size={22} className="transition-transform duration-300" />
            ) : (
              <Menu size={22} className="transition-transform duration-300" />
            )}
          </div>
          {/* Animated background glow */}
          {isMobileOpen && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 opacity-20 animate-pulse" />
          )}
        </button>
        
        {/* Mobile logout button - Modern design */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Déconnexion"
          className={`
            relative p-3 rounded-xl shadow-2xl
            backdrop-blur-md bg-white/90 dark:bg-gray-900/90
            border border-white/20
            transition-all duration-300 ease-out
            hover:scale-105 active:scale-95
            focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
            touch-manipulation pointer-events-auto
            text-red-600 hover:bg-red-50 active:bg-red-100
          `}
        >
          <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
            <LogOut size={18} className="sm:hidden" />
            <span className="hidden sm:inline text-xs sm:text-sm font-semibold">Déconnexion</span>
          </div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-xl bg-red-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="mobile-menu"
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-gray-200
          shadow-lg lg:shadow-none
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Navigation principale"
      >
        <div className="flex flex-col h-full">
          {/* Logo section - Simplified */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                {!logoError ? (
                  <Image
                    src="/images/logo_w.png"
                    alt="FleetManager"
                    width={32}
                    height={32}
                    className="brightness-0 invert"
                    priority
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <Truck className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">FleetManager</h1>
                <p className="text-xs text-gray-500">Gestion de flotte</p>
              </div>
            </div>
          </div>

          {/* Navigation - Grouped by sections */}
          <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Menu de navigation">
            {Object.entries(menuSections).map(([sectionKey, sectionLabel]) => {
              const items = getItemsBySection(sectionKey);
              const isExpanded = expandedSections[sectionKey];
              const hasActiveItem = items.some(item => pathname === item.href);

              return (
                <div key={sectionKey} className="mb-4">
                  {/* Section header - Collapsible */}
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => toggleSection(sectionKey)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
                      aria-expanded={isExpanded}
                    >
                      <span>{sectionLabel}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {sectionLabel}
                    </div>
                  )}

                  {/* Section items */}
                  <div className={items.length > 1 && !isExpanded ? 'hidden' : 'block'}>
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMobileMenu}
                          prefetch={false}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg mb-1
                            transition-colors duration-150
                            focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
                            ${isActive
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }
                          `}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} aria-hidden="true" />
                          <span className="text-sm">{item.label}</span>
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 bg-primary-600 rounded-full" aria-hidden="true" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Logout button - Simplified */}
          <div className="p-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              aria-label="Déconnexion"
            >
              <LogOut className="w-5 h-5 text-gray-500" aria-hidden="true" />
              <span className="text-sm font-medium">Déconnexion</span>
            </button>
          </div>

          {/* Logo branding - Bottom avec effet 3D (mobile uniquement) */}
          <div className="lg:hidden relative mt-auto p-6 pb-8 border-t border-gray-200 overflow-hidden">
            {/* Effet de trace arrière 3D */}
            <div className="absolute inset-0 opacity-10">
              {/* Couches multiples pour effet 3D */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 blur-3xl transform -translate-x-1/4 -translate-y-1/4 scale-150" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 via-blue-500 to-blue-600 blur-3xl transform translate-x-1/4 translate-y-1/4 scale-150" />
              <div className="absolute inset-0 bg-gradient-to-b from-primary-300 to-blue-300 blur-2xl transform translate-y-1/2 scale-125" />
            </div>
            
            {/* Logo avec effet 3D */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-3">
                {/* Ombre portée 3D */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-blue-600 rounded-2xl blur-xl opacity-40 transform translate-y-2 translate-x-1" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-blue-500 rounded-2xl blur-lg opacity-30 transform translate-y-1 translate-x-0.5" />
                
                {/* Conteneur logo avec effet glassmorphism */}
                <div className="relative w-full h-full bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 rounded-2xl p-4 shadow-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                  {/* Réflexion lumière */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                  
                  {/* Logo */}
                  {!logoError ? (
                    <Image
                      src="/images/logo_w.png"
                      alt="FleetManager Logo"
                      width={96}
                      height={96}
                      className="relative z-10 w-full h-full object-contain brightness-0 invert drop-shadow-2xl"
                      priority={false}
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <Truck className="w-12 h-12 sm:w-14 sm:h-14 text-white relative z-10 drop-shadow-2xl" />
                  )}
                  
                  {/* Effet de brillance animé */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full animate-shine" />
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

