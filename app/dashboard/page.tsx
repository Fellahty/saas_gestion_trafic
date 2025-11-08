'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Camion, Chauffeur, Mission, Depense, Recette } from '@/lib/types';
import { 
  Truck, 
  Users, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Loader2,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Activity
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, startOfDay, endOfDay, isToday, isYesterday, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function DashboardPage() {
  const [camions, setCamions] = useState<Camion[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'operations'>('overview');

  useEffect(() => {
    // Real-time synchronization with Firebase
    const unsubscribeCamions = onSnapshot(
      collection(db, 'camions'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setCamions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Camion)));
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 1000);
      }
    );

    const unsubscribeChauffeurs = onSnapshot(
      collection(db, 'chauffeurs'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setChauffeurs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chauffeur)));
      }
    );

    const unsubscribeMissions = onSnapshot(
      collection(db, 'missions'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setMissions(snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dateDebut: data.dateDebut instanceof Timestamp ? data.dateDebut.toDate() : (data.dateDebut ? new Date(data.dateDebut) : new Date()),
            dateFin: data.dateFin instanceof Timestamp ? data.dateFin.toDate() : (data.dateFin ? new Date(data.dateFin) : undefined),
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
          } as Mission;
        }));
      }
    );

    const unsubscribeDepenses = onSnapshot(
      collection(db, 'depenses'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setDepenses(snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : (data.date ? new Date(data.date) : new Date()),
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
          } as Depense;
        }));
      }
    );

    const unsubscribeRecettes = onSnapshot(
      collection(db, 'recettes'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        setRecettes(snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : (data.date ? new Date(data.date) : new Date()),
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
          } as Recette;
        }));
      }
    );

    setLoading(false);

    return () => {
      unsubscribeCamions();
      unsubscribeChauffeurs();
      unsubscribeMissions();
      unsubscribeDepenses();
      unsubscribeRecettes();
    };
  }, []);

  // Key Metrics
  const metrics = useMemo(() => {
    const totalRecettes = recettes.reduce((sum, r) => sum + r.montant, 0);
    const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);
    const profit = totalRecettes - totalDepenses;
    const marge = totalRecettes > 0 ? (profit / totalRecettes) * 100 : 0;

    const camionsActifs = camions.filter(c => c.etat === 'actif').length;
    const missionsEnCours = missions.filter(m => m.statut === 'en_cours').length;
    const missionsAujourdhui = missions.filter(m => {
      const date = m.dateDebut instanceof Date ? m.dateDebut : new Date(m.dateDebut);
      return isToday(date);
    }).length;

    return {
      totalRecettes,
      totalDepenses,
      profit,
      marge,
      camionsActifs,
      camionsTotal: camions.length,
      chauffeursActifs: chauffeurs.filter(c => c.actif).length,
      missionsTotal: missions.length,
      missionsEnCours,
      missionsAujourdhui,
    };
  }, [camions, chauffeurs, missions, depenses, recettes]);

  // Recent missions
  const recentMissions = useMemo(() => {
    return missions
      .sort((a, b) => {
        const dateA = a.dateDebut instanceof Date ? a.dateDebut : new Date(a.dateDebut);
        const dateB = b.dateDebut instanceof Date ? b.dateDebut : new Date(b.dateDebut);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map(mission => {
        const camion = camions.find(c => c.id === mission.camionId);
        const chauffeur = chauffeurs.find(c => c.id === mission.chauffeurId);
        const coutEstime = mission.coutEstime.carburant + mission.coutEstime.peage + mission.coutEstime.repas + mission.coutEstime.autre;
        const profit = mission.recette ? mission.recette - coutEstime : null;

        return {
          ...mission,
          camion,
          chauffeur,
          coutEstime,
          profit,
        };
      });
  }, [missions, camions, chauffeurs]);

  // Monthly chart data
  const currentYear = new Date().getFullYear();
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = new Date(currentYear, i, 1);
      const monthDepenses = depenses.filter(d => {
        const date = d.date instanceof Date ? d.date : new Date(d.date);
        return date.getMonth() === i && date.getFullYear() === currentYear;
      }).reduce((sum, d) => sum + d.montant, 0);
      
      const monthRecettes = recettes.filter(r => {
        const date = r.date instanceof Date ? r.date : new Date(r.date);
        return date.getMonth() === i && date.getFullYear() === currentYear;
      }).reduce((sum, r) => sum + r.montant, 0);

      return {
        month: month.toLocaleDateString('fr-FR', { month: 'short' }),
        depenses: monthDepenses,
        recettes: monthRecettes,
        profit: monthRecettes - monthDepenses,
      };
    });
  }, [depenses, recettes, currentYear]);

  // Today's statistics
  const todayStats = useMemo(() => {
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const todayDepenses = depenses.filter(d => {
      const date = d.date instanceof Date ? d.date : new Date(d.date);
      return date >= today && date <= todayEnd;
    }).reduce((sum, d) => sum + d.montant, 0);

    const todayRecettes = recettes.filter(r => {
      const date = r.date instanceof Date ? r.date : new Date(r.date);
      return date >= today && date <= todayEnd;
    }).reduce((sum, r) => sum + r.montant, 0);

    return {
      depenses: todayDepenses,
      recettes: todayRecettes,
      profit: todayRecettes - todayDepenses,
    };
  }, [depenses, recettes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-full overflow-hidden space-y-5 sm:space-y-6 lg:space-y-8 min-w-0">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 h-72 bg-gradient-to-b from-primary-100/70 via-white to-transparent blur-3xl opacity-60 sm:opacity-80"
        aria-hidden="true"
      />

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-blue-600 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-32 -right-20 h-60 w-60 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-24 left-12 h-56 w-56 rounded-full bg-blue-400/30 blur-2xl" />
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-white/5 via-transparent to-transparent md:block" />
        </div>
        <div className="relative px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="flex flex-col gap-5 sm:gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 shadow-sm backdrop-blur">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-300" aria-hidden="true" />
                Vue d&apos;ensemble
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Tableau de bord
              </h1>
              <p className="mt-2 text-sm text-white/80 sm:text-base">
                Surveillez vos opérations logistiques, vos performances financières et vos équipes en temps réel, sur ordinateur comme sur mobile.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 shadow-sm backdrop-blur">
                {isSyncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Synchronisation des données...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    Données à jour
                  </>
                )}
              </div>
            </div>
            <div className="grid min-w-[200px] grid-cols-2 gap-2 sm:min-w-[280px] sm:gap-3">
              <div className="rounded-2xl bg-white/15 p-3 sm:p-4 shadow-lg backdrop-blur">
                <p className="text-xs font-medium text-white/70">Chiffre d&apos;affaires</p>
                <p className="mt-1 text-lg font-semibold sm:text-xl">
                  {formatCurrency(metrics.totalRecettes)}
                </p>
                <p className="mt-1 text-[11px] text-white/70">+{formatCurrency(todayStats.recettes)} aujourd&apos;hui</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 sm:p-4 shadow-lg backdrop-blur">
                <p className="text-xs font-medium text-white/70">Bénéfice net</p>
                <p className="mt-1 text-lg font-semibold sm:text-xl">
                  {formatCurrency(metrics.profit)}
                </p>
                <p className="mt-1 text-[11px] text-white/70">Marge {metrics.marge.toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 sm:p-4 shadow-lg backdrop-blur">
                <p className="text-xs font-medium text-white/70">Missions actives</p>
                <p className="mt-1 text-lg font-semibold sm:text-xl">
                  {metrics.missionsEnCours}
                </p>
                <p className="mt-1 text-[11px] text-white/70">{metrics.missionsAujourdhui} aujourd&apos;hui</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 sm:p-4 shadow-lg backdrop-blur">
                <p className="text-xs font-medium text-white/70">Camions actifs</p>
                <p className="mt-1 text-lg font-semibold sm:text-xl">
                  {metrics.camionsActifs}
                </p>
                <p className="mt-1 text-[11px] text-white/70">Sur {metrics.camionsTotal} au total</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs - ARIA compliant according to WAI-ARIA patterns */}
      <div
        role="tablist"
        aria-label="Sections du tableau de bord"
        className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/70 bg-white/80 p-1 shadow-sm backdrop-blur-sm sm:gap-3"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'overview'}
          aria-controls="panel-overview"
          id="tab-overview"
          onClick={() => setActiveTab('overview')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              setActiveTab('finance');
            }
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setActiveTab('operations');
            }
          }}
          className={`min-w-[120px] rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:min-w-0 sm:px-4 sm:text-sm ${
            activeTab === 'overview'
              ? 'bg-white text-primary-600 shadow-md'
              : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
          }`}
        >
          Vue d&apos;ensemble
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'finance'}
          aria-controls="panel-finance"
          id="tab-finance"
          onClick={() => setActiveTab('finance')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              setActiveTab('operations');
            }
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setActiveTab('overview');
            }
          }}
          className={`min-w-[110px] rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:min-w-0 sm:px-4 sm:text-sm ${
            activeTab === 'finance'
              ? 'bg-white text-primary-600 shadow-md'
              : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
          }`}
        >
          Finances
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'operations'}
          aria-controls="panel-operations"
          id="tab-operations"
          onClick={() => setActiveTab('operations')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              setActiveTab('overview');
            }
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setActiveTab('finance');
            }
          }}
          className={`min-w-[120px] rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:min-w-0 sm:px-4 sm:text-sm ${
            activeTab === 'operations'
              ? 'bg-white text-primary-600 shadow-md'
              : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
          }`}
        >
          Opérations
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" tabIndex={0} className="space-y-6 sm:space-y-7">
          <div className="overflow-x-auto -mx-2 px-2 pb-2 sm:mx-0 sm:px-0 sm:pb-0">
            <div className="flex flex-nowrap gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
              <div className="relative min-w-[200px] overflow-hidden rounded-2xl bg-white/90 p-3 sm:p-4 md:p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl sm:min-w-0">
                <div className="absolute inset-x-8 -top-16 h-24 rounded-full bg-primary-100/70 blur-3xl" aria-hidden="true" />
                <div className="relative flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">Chiffre d&apos;affaires</p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100">
                      <TrendingUp className="h-4 w-4 text-primary-600" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">{formatCurrency(metrics.totalRecettes)}</p>
                  <p className="text-[11px] text-gray-500 sm:text-xs">Marge : {metrics.marge.toFixed(1)}%</p>
                </div>
              </div>

              <div className="relative min-w-[200px] overflow-hidden rounded-2xl bg-white/90 p-3 sm:p-4 md:p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl sm:min-w-0">
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-50 via-transparent to-transparent opacity-80" aria-hidden="true" />
                <div className="relative flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">Bénéfice net</p>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${metrics.profit >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                      <DollarSign className={`h-4 w-4 ${metrics.profit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`} />
                    </div>
                  </div>
                  <p className={`text-lg font-bold sm:text-xl md:text-2xl ${metrics.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(metrics.profit)}
                  </p>
                  <p className="text-[11px] text-gray-500 sm:text-xs">
                    {todayStats.profit >= 0 ? '+' : ''}
                    {formatCurrency(todayStats.profit)} aujourd&apos;hui
                  </p>
                </div>
              </div>

              <div className="relative min-w-[200px] overflow-hidden rounded-2xl bg-white/90 p-3 sm:p-4 md:p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl sm:min-w-0">
                <div className="relative flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">Camions actifs</p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100">
                      <Truck className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">{metrics.camionsActifs}</p>
                  <p className="text-[11px] text-gray-500 sm:text-xs">Sur {metrics.camionsTotal} au total</p>
                </div>
              </div>

              <div className="relative min-w-[200px] overflow-hidden rounded-2xl bg-white/90 p-3 sm:p-4 md:p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl sm:min-w-0">
                <div className="relative flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">Missions en cours</p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100">
                      <MapPin className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">{metrics.missionsEnCours}</p>
                  <p className="text-[11px] text-gray-500 sm:text-xs">{metrics.missionsAujourdhui} aujourd&apos;hui</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Actions rapides</h2>
              <p className="text-xs text-gray-500 sm:text-sm">
                Accédez instantanément à vos modules les plus utilisés.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
              <Link
                href="/dashboard/camions"
                className="group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-primary-50 via-white to-white p-3 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg touch-manipulation"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/40 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <Truck className="relative h-7 w-7 text-primary-600 transition-transform duration-200 group-hover:scale-110 sm:h-9 sm:w-9" />
                <span className="relative text-xs font-semibold text-gray-700 sm:text-sm">Camions</span>
              </Link>
              <Link
                href="/dashboard/chauffeurs"
                className="group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-primary-50 via-white to-white p-3 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg touch-manipulation"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/40 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <Users className="relative h-7 w-7 text-primary-600 transition-transform duration-200 group-hover:scale-110 sm:h-9 sm:w-9" />
                <span className="relative text-xs font-semibold text-gray-700 sm:text-sm">Chauffeurs</span>
              </Link>
              <Link
                href="/dashboard/trajets"
                className="group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-primary-50 via-white to-white p-3 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg touch-manipulation"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/40 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <MapPin className="relative h-7 w-7 text-primary-600 transition-transform duration-200 group-hover:scale-110 sm:h-9 sm:w-9" />
                <span className="relative text-xs font-semibold text-gray-700 sm:text-sm">Trajets</span>
              </Link>
              <Link
                href="/dashboard/factures"
                className="group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-primary-50 via-white to-white p-3 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg touch-manipulation"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/40 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <DollarSign className="relative h-7 w-7 text-primary-600 transition-transform duration-200 group-hover:scale-110 sm:h-9 sm:w-9" />
                <span className="relative text-xs font-semibold text-gray-700 sm:text-sm">Factures</span>
              </Link>
            </div>
          </div>

          {/* Recent Missions & Status */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-sm sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-100">
                    <Clock className="h-4 w-4 text-primary-600 sm:h-5 sm:w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Missions récentes</h2>
                    <p className="text-xs text-gray-500 sm:text-sm">Suivez les dernières opérations et leur statut.</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/trajets"
                  className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-100 sm:text-sm"
                >
                  Voir tout
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {recentMissions.length === 0 ? (
                  <p className="rounded-2xl bg-gray-50 py-6 text-center text-sm text-gray-500 sm:text-base">
                    Aucune mission récente
                  </p>
                ) : (
                  recentMissions.map((mission) => (
                    <div
                      key={mission.id}
                      className="group flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white/60 p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary-100 hover:bg-primary-50/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 sm:text-base md:text-lg">
                            {mission.depart} → {mission.destination}
                          </p>
                          {mission.statut === 'en_cours' && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800 sm:text-xs">
                              En cours
                            </span>
                          )}
                          {mission.statut === 'termine' && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 sm:text-xs">
                              Terminé
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500 sm:text-xs">
                          <span>{format(mission.dateDebut instanceof Date ? mission.dateDebut : new Date(mission.dateDebut), 'dd/MM/yyyy', { locale: fr })}</span>
                          {mission.camion && <span className="hidden sm:inline">• {mission.camion.matricule}</span>}
                          {mission.chauffeur && (
                            <span className="hidden md:inline">
                              • {mission.chauffeur.prenom} {mission.chauffeur.nom}
                            </span>
                          )}
                        </div>
                        {mission.recette && (
                          <p className="mt-2 text-sm font-semibold text-emerald-600">
                            {formatCurrency(mission.recette)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-sm sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-100">
                    <Activity className="h-4 w-4 text-primary-600 sm:h-5 sm:w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Résumé opérationnel</h2>
                    <p className="text-xs text-gray-500 sm:text-sm">Indicateurs clés mis à jour en continu.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/60 p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                      <Truck className="h-4 w-4 text-primary-600 sm:h-5 sm:w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 sm:text-base">Camions actifs</p>
                      <p className="text-xs text-gray-500 sm:text-sm">Utilisation de la flotte</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 sm:text-xl">
                      {metrics.camionsActifs}/{metrics.camionsTotal}
                    </p>
                    <p className="text-[11px] text-gray-500 sm:text-xs">actifs</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/60 p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                      <Users className="h-4 w-4 text-primary-600 sm:h-5 sm:w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 sm:text-base">Chauffeurs disponibles</p>
                      <p className="text-xs text-gray-500 sm:text-sm">État des équipes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 sm:text-xl">
                      {metrics.chauffeursActifs}/{chauffeurs.length}
                    </p>
                    <p className="text-[11px] text-gray-500 sm:text-xs">actifs</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/60 p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                      <MapPin className="h-4 w-4 text-primary-600 sm:h-5 sm:w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 sm:text-base">Missions en cours</p>
                      <p className="text-xs text-gray-500 sm:text-sm">Progression en temps réel</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 sm:text-xl">
                      {metrics.missionsEnCours}/{metrics.missionsTotal}
                    </p>
                    <p className="text-[11px] text-gray-500 sm:text-xs">en cours</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/60 p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                      <DollarSign className="h-4 w-4 text-primary-600 sm:h-5 sm:w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 sm:text-base">Performances du jour</p>
                      <p className="text-xs text-gray-500 sm:text-sm">Bénéfice actuel</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold sm:text-xl ${todayStats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {todayStats.profit >= 0 ? '+' : ''}
                      {formatCurrency(todayStats.profit)}
                    </p>
                    <p className="text-[11px] text-gray-500 sm:text-xs">bénéfice</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === 'finance' && (
        <div role="tabpanel" id="panel-finance" aria-labelledby="tab-finance" tabIndex={0} className="space-y-6 w-full max-w-full">
          <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Évolution financière</h2>
                <p className="text-xs text-gray-500 sm:text-sm">Comparer recettes, dépenses et bénéfices par mois.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 sm:text-sm">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {currentYear}
              </div>
            </div>
            <div className="w-full max-w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-[600px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#475569" />
                    <YAxis stroke="#475569" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ paddingTop: 12 }} />
                    <Line type="monotone" dataKey="recettes" stroke="#10b981" strokeWidth={3} name="Recettes" dot={{ strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="depenses" stroke="#ef4444" strokeWidth={3} name="Dépenses" dot={{ strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={3} name="Bénéfice" dot={{ strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 w-full max-w-full">
            <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-emerald-50 via-white to-white p-4 sm:p-6 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 sm:text-sm">Total recettes</p>
              <p className="mt-2 text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">{formatCurrency(metrics.totalRecettes)}</p>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">Somme des revenus enregistrés</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-rose-50 via-white to-white p-4 sm:p-6 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 sm:text-sm">Total dépenses</p>
              <p className="mt-2 text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">{formatCurrency(metrics.totalDepenses)}</p>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">Charges opérationnelles cumulées</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-gradient-to-br from-sky-50 via-white to-white p-4 sm:p-6 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 sm:text-sm">Bénéfice net</p>
              <p className={`mt-2 text-lg font-bold sm:text-xl md:text-2xl ${metrics.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(metrics.profit)}
              </p>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">Résultat après dépenses</p>
            </div>
          </div>
        </div>
      )}

      {/* Operations Tab */}
      {activeTab === 'operations' && (
        <div
          role="tabpanel"
          id="panel-operations"
          aria-labelledby="tab-operations"
          tabIndex={0}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-full"
        >
          <Link
            href="/dashboard/camions"
            className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-4 sm:p-5 shadow-xl backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/40 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
                  <Truck className="h-5 w-5 text-primary-600" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-primary-600">Flotte</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Camions</h3>
                <p className="mt-1 text-sm text-gray-600">Gérez votre flotte et surveillez son état en temps réel.</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">{metrics.camionsTotal}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
                  Voir
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/chauffeurs"
            className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-4 sm:p-5 shadow-xl backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/40 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
                  <Users className="h-5 w-5 text-primary-600" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-primary-600">Équipe</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Chauffeurs</h3>
                <p className="mt-1 text-sm text-gray-600">Attribuez les missions et suivez la disponibilité.</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">{chauffeurs.length}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
                  Voir
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/trajets"
            className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-4 sm:p-5 shadow-xl backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/40 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
                  <MapPin className="h-5 w-5 text-primary-600" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-primary-600">Opérations</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Trajets</h3>
                <p className="mt-1 text-sm text-gray-600">Suivez la progression de vos missions en cours.</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">{metrics.missionsTotal}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
                  Voir
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

