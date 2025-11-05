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
    <div className="w-full max-w-full overflow-x-hidden space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Vue d&apos;ensemble de votre flotte
            {isSyncing && (
              <span className="ml-2 inline-flex items-center gap-1 text-primary-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Synchronisation...
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs - ARIA compliant according to WAI-ARIA patterns */}
      <div 
        role="tablist" 
        aria-label="Sections du tableau de bord"
        className="flex space-x-1 sm:space-x-2 border-b border-gray-200 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0"
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
          className={`px-3 sm:px-4 py-2 border-b-2 transition-all duration-200 text-xs sm:text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none min-w-[120px] sm:min-w-0 ${
            activeTab === 'overview'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
          className={`px-3 sm:px-4 py-2 border-b-2 transition-all duration-200 text-xs sm:text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none min-w-[100px] sm:min-w-0 ${
            activeTab === 'finance'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
          className={`px-3 sm:px-4 py-2 border-b-2 transition-all duration-200 text-xs sm:text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none min-w-[100px] sm:min-w-0 ${
            activeTab === 'operations'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
          }`}
        >
          Opérations
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" tabIndex={0}>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Chiffre d&apos;affaires</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(metrics.totalRecettes)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Marge: {metrics.marge.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Bénéfice net</p>
                  <p className={`text-lg sm:text-xl md:text-2xl font-bold mt-1 ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(metrics.profit)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {todayStats.profit >= 0 ? '+' : ''}{formatCurrency(todayStats.profit)} aujourd&apos;hui
                  </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2 ${metrics.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Camions actifs</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1">
                    {metrics.camionsActifs}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Sur {metrics.camionsTotal} au total
                  </p>
                </div>
                <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Missions en cours</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1">
                    {metrics.missionsEnCours}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {metrics.missionsAujourdhui} aujourd&apos;hui
                  </p>
                </div>
                <div className="bg-orange-100 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 md:p-6 w-full max-w-full">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Actions rapides</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full">
              <Link
                href="/dashboard/camions"
                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group touch-manipulation"
              >
                <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Camions</span>
              </Link>
              <Link
                href="/dashboard/chauffeurs"
                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group touch-manipulation"
              >
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Chauffeurs</span>
              </Link>
              <Link
                href="/dashboard/trajets"
                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group touch-manipulation"
              >
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Trajets</span>
              </Link>
              <Link
                href="/dashboard/factures"
                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group touch-manipulation"
              >
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Factures</span>
              </Link>
            </div>
          </div>

          {/* Recent Missions & Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full max-w-full">
            {/* Recent Missions */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                  <span className="hidden sm:inline">Missions récentes</span>
                  <span className="sm:hidden">Missions</span>
                </h2>
                <Link
                  href="/dashboard/trajets"
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Voir tout</span>
                  <span className="sm:hidden">Tout</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {recentMissions.length === 0 ? (
                  <p className="text-center text-gray-500 py-3 sm:py-4 text-xs sm:text-sm">Aucune mission récente</p>
                ) : (
                  recentMissions.map((mission) => (
                    <div
                      key={mission.id}
                      className="flex items-start justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                          <p className="font-medium text-gray-900 text-xs sm:text-sm md:text-base truncate">
                            {mission.depart} → {mission.destination}
                          </p>
                          {mission.statut === 'en_cours' && (
                            <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap">
                              En cours
                            </span>
                          )}
                          {mission.statut === 'termine' && (
                            <span className="px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-800 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap">
                              Terminé
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                          <span>{format(mission.dateDebut instanceof Date ? mission.dateDebut : new Date(mission.dateDebut), 'dd/MM/yyyy', { locale: fr })}</span>
                          {mission.camion && <span className="hidden sm:inline">• {mission.camion.matricule}</span>}
                          {mission.chauffeur && (
                            <span className="hidden md:inline">• {mission.chauffeur.prenom} {mission.chauffeur.nom}</span>
                          )}
                        </div>
                        {mission.recette && (
                          <p className="text-xs sm:text-sm font-medium text-green-600 mt-1">
                            {formatCurrency(mission.recette)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Status Summary */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                Résumé
              </h2>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Camions</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{metrics.camionsActifs}/{metrics.camionsTotal}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">actifs</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Chauffeurs</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{metrics.chauffeursActifs}/{chauffeurs.length}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">actifs</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Missions</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{metrics.missionsEnCours}/{metrics.missionsTotal}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">en cours</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Aujourd&apos;hui</span>  
                  </div>
                  <div className="text-right">
                    <p className={`text-xs sm:text-sm font-bold ${todayStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {todayStats.profit >= 0 ? '+' : ''}{formatCurrency(todayStats.profit)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">bénéfice</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === 'finance' && (
        <div role="tabpanel" id="panel-finance" aria-labelledby="tab-finance" tabIndex={0} className="space-y-4 w-full max-w-full">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 w-full max-w-full">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Évolution financière</h2>
            <div className="w-full max-w-full overflow-x-auto">
              <div className="min-w-[600px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="recettes" stroke="#10b981" strokeWidth={2} name="Recettes" />
                    <Line type="monotone" dataKey="depenses" stroke="#ef4444" strokeWidth={2} name="Dépenses" />
                    <Line type="monotone" dataKey="profit" stroke="#0ea5e9" strokeWidth={2} name="Bénéfice" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-full">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
              <p className="text-sm text-gray-600">Total recettes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">{formatCurrency(metrics.totalRecettes)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
              <p className="text-sm text-gray-600">Total dépenses</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">{formatCurrency(metrics.totalDepenses)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
              <p className="text-sm text-gray-600">Bénéfice net</p>
              <p className={`text-xl sm:text-2xl font-bold mt-2 ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.profit)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Operations Tab */}
      {activeTab === 'operations' && (
        <div role="tabpanel" id="panel-operations" aria-labelledby="tab-operations" tabIndex={0} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-full">
          <Link href="/dashboard/camions" className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow w-full max-w-full">
            <Truck className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Camions</h3>
            <p className="text-sm text-gray-600 mb-4">Gérez votre flotte de camions</p>
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.camionsTotal}</span>
              <span className="text-sm text-primary-600">Voir →</span>
            </div>
          </Link>

          <Link href="/dashboard/chauffeurs" className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow w-full max-w-full">
            <Users className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Chauffeurs</h3>
            <p className="text-sm text-gray-600 mb-4">Gérez vos chauffeurs</p>
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">{chauffeurs.length}</span>
              <span className="text-sm text-primary-600">Voir →</span>
            </div>
          </Link>

          <Link href="/dashboard/trajets" className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow w-full max-w-full">
            <MapPin className="w-8 h-8 text-primary-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Trajets</h3>
            <p className="text-sm text-gray-600 mb-4">Suivez vos missions</p>
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.missionsTotal}</span>
              <span className="text-sm text-primary-600">Voir →</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

