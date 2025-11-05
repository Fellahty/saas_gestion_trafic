'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, getStorageInstance } from '@/firebase.config';
import { Camion, Assurance, VisiteTechnique, Entretien, Kilometrage, Pneu, Reparation, Mission, Depense, Recette } from '@/lib/types';
import { Plus, Edit, Trash2, Truck, Shield, Wrench, Calendar, Gauge, Circle, History, Eye, X, TrendingUp, DollarSign, Activity, AlertTriangle, CheckCircle, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CamionsPage() {
  const [camions, setCamions] = useState<Camion[]>([]);
  const [assurances, setAssurances] = useState<Assurance[]>([]);
  const [visites, setVisites] = useState<VisiteTechnique[]>([]);
  const [entretiens, setEntretiens] = useState<Entretien[]>([]);
  const [kilometrages, setKilometrages] = useState<Kilometrage[]>([]);
  const [pneus, setPneus] = useState<Pneu[]>([]);
  const [reparations, setReparations] = useState<Reparation[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCamion, setSelectedCamion] = useState<Camion | null>(null);
  const [activeTab, setActiveTab] = useState<'camions' | 'assurance' | 'visite' | 'entretien' | 'kilometrage' | 'pneus' | 'reparations'>('camions');
  const [selectedCamionForDetail, setSelectedCamionForDetail] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [camionsSnap, assurancesSnap, visitesSnap, entretiensSnap, kilometragesSnap, pneusSnap, reparationsSnap, missionsSnap, depensesSnap] = await Promise.all([
        getDocs(collection(db, 'camions')),
        getDocs(collection(db, 'assurances')),
        getDocs(collection(db, 'visitesTechniques')),
        getDocs(collection(db, 'entretiens')),
        getDocs(collection(db, 'kilometrages')),
        getDocs(collection(db, 'pneus')),
        getDocs(collection(db, 'reparations')),
        getDocs(collection(db, 'missions')),
        getDocs(collection(db, 'depenses')),
      ]);

      setCamions(camionsSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        kilometrageActuel: doc.data().kilometrageActuel || 0,
        imageUrl: doc.data().imageUrl || '',
        couleur: doc.data().couleur || '#0ea5e9',
      } as Camion)));
      setAssurances(assurancesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assurance)));
      setVisites(visitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisiteTechnique)));
      setEntretiens(entretiensSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entretien)));
      setKilometrages(kilometragesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Kilometrage)));
      setPneus(pneusSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pneu)));
      setReparations(reparationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reparation)));
      setMissions(missionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission)));
      setDepenses(depensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Depense)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCamion = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce camion ?')) {
      try {
        await deleteDoc(doc(db, 'camions', id));
        setCamions(camions.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting camion:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Vue détaillée du camion
  if (selectedCamionForDetail) {
    const camion = camions.find(c => c.id === selectedCamionForDetail);
    if (!camion) return null;

    const camionAssurances = assurances.filter(a => a.camionId === camion.id);
    const camionVisites = visites.filter(v => v.camionId === camion.id);
    const camionEntretiens = entretiens.filter(e => e.camionId === camion.id);
    const camionKilometrages = kilometrages.filter(k => k.camionId === camion.id).sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    const camionPneus = pneus.filter(p => p.camionId === camion.id);
    const camionReparations = reparations.filter(r => r.camionId === camion.id).sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    const camionMissions = missions.filter(m => m.camionId === camion.id);
    const camionDepenses = depenses.filter(d => d.camionId === camion.id);

    const totalDepenses = camionDepenses.reduce((sum, d) => sum + d.montant, 0);
    const totalRecettes = camionMissions.reduce((sum, m) => sum + (m.recette || 0), 0);
    const profit = totalRecettes - totalDepenses;
    const totalReparations = camionReparations.reduce((sum, r) => sum + r.coutTotal, 0);
    const totalEntretiens = camionEntretiens.reduce((sum, e) => sum + e.cout, 0);

    // Données pour graphiques
    const monthlyData = useMemo(() => {
      const months: Record<string, { depenses: number; recettes: number }> = {};
      camionDepenses.forEach(d => {
        const date = d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!months[month]) months[month] = { depenses: 0, recettes: 0 };
        months[month].depenses += d.montant;
      });
      camionMissions.forEach(m => {
        const date = m.dateDebut instanceof Timestamp ? m.dateDebut.toDate() : new Date(m.dateDebut);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!months[month]) months[month] = { depenses: 0, recettes: 0 };
        months[month].recettes += m.recette || 0;
      });
      return Object.entries(months).slice(-6).map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        ...data,
      }));
    }, [camionDepenses, camionMissions]);

    return (
      <div className="w-full max-w-full overflow-x-hidden space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={() => setSelectedCamionForDetail(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors self-start"
          >
            <X size={20} />
            <span>Retour</span>
          </button>
          <button
            onClick={() => {
              setSelectedCamion(camion);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors self-start sm:self-auto"
          >
            <Edit size={18} />
            <span>Modifier</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
              {/* Image */}
              <div className="relative w-full sm:w-64 h-48 sm:h-64 rounded-xl overflow-hidden shadow-lg bg-white/10 backdrop-blur-sm">
                {camion.imageUrl ? (
                  <Image
                    src={camion.imageUrl}
                    alt={camion.matricule}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/20 to-white/10">
                    <Truck className="w-24 h-24 text-white/80" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{camion.matricule}</h1>
                  <p className="text-xl sm:text-2xl text-white/90 mb-4">{camion.marque} {camion.modele}</p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      camion.etat === 'actif' ? 'bg-green-500/90 text-white' :
                      camion.etat === 'en_maintenance' ? 'bg-yellow-500/90 text-white' :
                      'bg-red-500/90 text-white'
                    }`}>
                      {camion.etat === 'actif' ? 'Actif' :
                       camion.etat === 'en_maintenance' ? 'En maintenance' :
                       'Hors service'}
                    </span>
                    {camion.couleur && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                        <div className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: camion.couleur }}></div>
                        <span className="text-sm text-white">Couleur</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats rapides */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-white/80 mb-1">Kilométrage</p>
                    <p className="text-lg sm:text-xl font-bold text-white">{(camion.kilometrageActuel || 0).toLocaleString('fr-FR')} km</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-white/80 mb-1">Missions</p>
                    <p className="text-lg sm:text-xl font-bold text-white">{camionMissions.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-white/80 mb-1">Dépenses</p>
                    <p className="text-lg sm:text-xl font-bold text-white">{formatCurrency(totalDepenses)}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-white/80 mb-1">Profit</p>
                    <p className={`text-lg sm:text-xl font-bold ${profit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {formatCurrency(profit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total dépenses</p>
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDepenses)}</p>
            <p className="text-xs text-gray-500 mt-1">Réparations + Entretiens</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total recettes</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRecettes)}</p>
            <p className="text-xs text-gray-500 mt-1">Missions</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Réparations</p>
              <Wrench className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalReparations)}</p>
            <p className="text-xs text-gray-500 mt-1">{camionReparations.length} réparations</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Entretiens</p>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEntretiens)}</p>
            <p className="text-xs text-gray-500 mt-1">{camionEntretiens.length} entretiens</p>
          </div>
        </div>

        {/* Graphiques */}
        {monthlyData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Évolution financière</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="depenses" fill="#ef4444" name="Dépenses" />
                <Bar dataKey="recettes" fill="#10b981" name="Recettes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Informations détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Documents */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              Documents
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Assurances</span>
                <span className="text-sm font-semibold text-gray-900">{camionAssurances.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Visites techniques</span>
                <span className="text-sm font-semibold text-gray-900">{camionVisites.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Pneus</span>
                <span className="text-sm font-semibold text-gray-900">{camionPneus.length}</span>
              </div>
            </div>
          </div>

          {/* Dernières réparations */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary-600" />
              Dernières réparations
            </h2>
            <div className="space-y-3">
              {camionReparations.slice(0, 5).map((reparation) => (
                <div key={reparation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reparation.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(reparation.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(reparation.coutTotal)}</span>
                </div>
              ))}
              {camionReparations.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucune réparation</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Camions</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Gérez vos camions et leurs documents</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            {viewMode === 'grid' ? 'Liste' : 'Grille'}
          </button>
          <button
            onClick={() => {
              setSelectedCamion(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
          >
            <Plus size={18} />
            <span>Nouveau camion</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap space-x-2 sm:space-x-4 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'camions', label: 'Camions', icon: Truck },
          { id: 'assurance', label: 'Assurances', icon: Shield },
          { id: 'visite', label: 'Visites', icon: Calendar },
          { id: 'entretien', label: 'Entretiens', icon: Wrench },
          { id: 'kilometrage', label: 'Kilométrage', icon: Gauge },
          { id: 'pneus', label: 'Pneus', icon: Circle },
          { id: 'reparations', label: 'Réparations', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedCamionForDetail(null);
              }}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Camions Tab - Grid View */}
      {activeTab === 'camions' && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {camions.map((camion) => {
            const camionMissions = missions.filter(m => m.camionId === camion.id);
            const camionDepenses = depenses.filter(d => d.camionId === camion.id);
            const totalDepenses = camionDepenses.reduce((sum, d) => sum + d.montant, 0);
            const totalRecettes = camionMissions.reduce((sum, m) => sum + (m.recette || 0), 0);
            const profit = totalRecettes - totalDepenses;

            return (
              <div
                key={camion.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
                onClick={() => setSelectedCamionForDetail(camion.id)}
              >
                {/* Image Header */}
                <div className="relative h-48 overflow-hidden">
                  {camion.imageUrl ? (
                    <Image
                      src={camion.imageUrl}
                      alt={camion.matricule}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: camion.couleur || '#0ea5e9' }}
                    >
                      <Truck className="w-20 h-20 text-white/80" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      camion.etat === 'actif' ? 'bg-green-500 text-white' :
                      camion.etat === 'en_maintenance' ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {camion.etat === 'actif' ? 'Actif' :
                       camion.etat === 'en_maintenance' ? 'En maintenance' :
                       'Hors service'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{camion.matricule}</h3>
                  <p className="text-sm text-gray-600 mb-4">{camion.marque} {camion.modele}</p>
                  
                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Kilométrage</span>
                      <span className="font-semibold text-gray-900">{(camion.kilometrageActuel || 0).toLocaleString('fr-FR')} km</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Missions</span>
                      <span className="font-semibold text-gray-900">{camionMissions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Profit</span>
                      <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profit)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCamionForDetail(camion.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                    >
                      <Eye size={16} />
                      <span>Voir</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCamion(camion);
                        setShowForm(true);
                      }}
                      className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCamion(camion.id);
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Camions Tab - List View */}
      {activeTab === 'camions' && viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camion</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Marque / Modèle</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Kilométrage</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date d&apos;achat</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">État</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {camions.map((camion) => (
                    <tr key={camion.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCamionForDetail(camion.id)}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            {camion.imageUrl ? (
                              <Image
                                src={camion.imageUrl}
                                alt={camion.matricule}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div 
                                className="w-full h-full flex items-center justify-center"
                                style={{ backgroundColor: camion.couleur || '#0ea5e9' }}
                              >
                                <Truck className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-900">{camion.matricule}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                        {camion.marque} {camion.modele}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                        {(camion.kilometrageActuel || 0).toLocaleString('fr-FR')} km
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                        {formatDate(camion.dateAchat)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          camion.etat === 'actif' ? 'bg-green-100 text-green-800' :
                          camion.etat === 'en_maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {camion.etat === 'actif' ? 'Actif' :
                           camion.etat === 'en_maintenance' ? 'En maintenance' :
                           'Hors service'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedCamionForDetail(camion.id)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCamion(camion);
                              setShowForm(true);
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                          <button
                            onClick={() => handleDeleteCamion(camion.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs remain the same - keeping them for brevity */}
      {/* Assurance Tab */}
      {activeTab === 'assurance' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Camion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assurances.map((assurance) => {
                  const camion = camions.find(c => c.id === assurance.camionId);
                  return (
                    <tr key={assurance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {camion?.matricule || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assurance.numero}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(assurance.dateDebut)} - {formatDate(assurance.dateFin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(assurance.montant)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Visite Technique Tab */}
      {activeTab === 'visite' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Camion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prochaine visite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Résultat
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visites.map((visite) => {
                  const camion = camions.find(c => c.id === visite.camionId);
                  return (
                    <tr key={visite.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {camion?.matricule || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(visite.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(visite.prochaineDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            visite.resultat === 'valide'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {visite.resultat === 'valide' ? 'Valide' : 'Non valide'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Entretien Tab */}
      {activeTab === 'entretien' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Camion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coût
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entretiens.map((entretien) => {
                  const camion = camions.find(c => c.id === entretien.camionId);
                  return (
                    <tr key={entretien.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {camion?.matricule || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entretien.type === 'vidange' ? 'Vidange' : entretien.type === 'reparation' ? 'Réparation' : 'Autre'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(entretien.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {entretien.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(entretien.cout)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kilométrage Tab */}
      {activeTab === 'kilometrage' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Suivi kilométrique</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camion</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kilométrage</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Chauffeur</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {kilometrages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Aucun kilométrage enregistré
                      </td>
                    </tr>
                  ) : (
                    kilometrages
                      .sort((a, b) => {
                        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                        return dateB.getTime() - dateA.getTime();
                      })
                      .map((km) => {
                        const camion = camions.find(c => c.id === km.camionId);
                        return (
                          <tr key={km.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                              {camion?.matricule || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {formatDate(km.date)}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {km.kilometrage.toLocaleString('fr-FR')} km
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                              {km.chauffeurId ? 'Chauffeur' : '-'}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                              {km.notes || '-'}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pneus Tab */}
      {activeTab === 'pneus' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Gestion des pneus</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camion</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Marque / Modèle</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date installation</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Kilométrage</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">État</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pneus.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Aucun pneu enregistré
                      </td>
                    </tr>
                  ) : (
                    pneus.map((pneu) => {
                      const camion = camions.find(c => c.id === pneu.camionId);
                      const positionLabels: Record<string, string> = {
                        'avant_droit': 'Avant droit',
                        'avant_gauche': 'Avant gauche',
                        'arriere_droit': 'Arrière droit',
                        'arriere_gauche': 'Arrière gauche',
                        'roue_secours': 'Roue de secours',
                      };
                      const etatLabels: Record<string, string> = {
                        'bon': 'Bon',
                        'usure': 'Usure',
                        'a_remplacer': 'À remplacer',
                        'remplace': 'Remplacé',
                      };
                      return (
                        <tr key={pneu.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                            {camion?.matricule || 'N/A'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {positionLabels[pneu.position] || pneu.position}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                            {pneu.marque && pneu.modele ? `${pneu.marque} ${pneu.modele}` : '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                            {formatDate(pneu.dateInstallation)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                            {pneu.kilometrageActuel ? `${pneu.kilometrageActuel.toLocaleString('fr-FR')} km` : '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              pneu.etat === 'bon' ? 'bg-green-100 text-green-800' :
                              pneu.etat === 'usure' ? 'bg-yellow-100 text-yellow-800' :
                              pneu.etat === 'a_remplacer' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {etatLabels[pneu.etat] || pneu.etat}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Réparations Tab */}
      {activeTab === 'reparations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Historique des réparations</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camion</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Kilométrage</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Pièces</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coût total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reparations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Aucune réparation enregistrée
                      </td>
                    </tr>
                  ) : (
                    reparations
                      .sort((a, b) => {
                        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                        return dateB.getTime() - dateA.getTime();
                      })
                      .map((reparation) => {
                        const camion = camions.find(c => c.id === reparation.camionId);
                        const typeLabels: Record<string, string> = {
                          'preventive': 'Préventive',
                          'corrective': 'Corrective',
                          'revision': 'Révision',
                          'diagnostic': 'Diagnostic',
                          'autre': 'Autre',
                        };
                        return (
                          <tr key={reparation.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                              {camion?.matricule || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {formatDate(reparation.date)}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {typeLabels[reparation.type] || reparation.type}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                              {reparation.kilometrage.toLocaleString('fr-FR')} km
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                              {reparation.piecesUtilisees?.length || 0} pièce(s)
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                              {formatCurrency(reparation.coutTotal)}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <CamionForm
          camion={selectedCamion}
          onClose={() => {
            setShowForm(false);
            setSelectedCamion(null);
          }}
          onSuccess={async () => {
            setShowForm(false);
            setSelectedCamion(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

function CamionForm({ camion, onClose, onSuccess }: { camion: Camion | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    matricule: camion?.matricule || '',
    marque: camion?.marque || '',
    modele: camion?.modele || '',
    dateAchat: camion?.dateAchat ? new Date(camion.dateAchat).toISOString().split('T')[0] : '',
    kilometrageActuel: camion?.kilometrageActuel || 0,
    imageUrl: camion?.imageUrl || '',
    couleur: camion?.couleur || '#0ea5e9',
    etat: camion?.etat || 'actif',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(camion?.imageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fonction pour uploader une image vers Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const storage = getStorageInstance();
    if (!storage) {
      throw new Error('Firebase Storage n\'est pas disponible');
    }

    // Créer une référence unique pour le fichier
    const fileName = `camions/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, fileName);

    // Uploader le fichier
    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      setUploading(false);
      setUploadProgress(100);
      return downloadURL;
    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Gérer la sélection de fichier
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop grande (max 5MB)');
      return;
    }

    // Afficher la preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Uploader l'image
    try {
      const downloadURL = await uploadImage(file);
      setFormData({ ...formData, imageUrl: downloadURL });
    } catch (error) {
      alert('Erreur lors de l\'upload de l\'image');
      setImagePreview(null);
    }
  };

  // Gérer la prise de photo
  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.setAttribute('capture', 'environment');
      cameraInputRef.current.click();
    }
  };

  // Supprimer l'image
  const handleRemoveImage = async () => {
    if (formData.imageUrl && camion?.imageUrl && formData.imageUrl === camion.imageUrl) {
      // Supprimer l'ancienne image de Firebase Storage si elle existe
      // Note: Pour supprimer, on a besoin du chemin complet du fichier dans Storage
      // Pour l'instant, on supprime juste la preview et l'URL du formulaire
      try {
        const storage = getStorageInstance();
        if (storage && camion.imageUrl.includes('firebasestorage')) {
          // Extraire le chemin du fichier depuis l'URL
          // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
          const urlParts = camion.imageUrl.split('/o/');
          if (urlParts.length > 1) {
            const pathPart = urlParts[1].split('?')[0];
            const decodedPath = decodeURIComponent(pathPart);
            const oldImageRef = storageRef(storage, decodedPath);
            await deleteObject(oldImageRef);
          }
        }
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Continuer même si la suppression échoue
      }
    }
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) {
      alert('Veuillez attendre la fin de l\'upload de l\'image');
      return;
    }

    try {
      if (camion) {
        await updateDoc(doc(db, 'camions', camion.id), {
          ...formData,
          dateAchat: new Date(formData.dateAchat),
          kilometrageActuel: parseFloat(formData.kilometrageActuel.toString()) || 0,
        });
      } else {
        await addDoc(collection(db, 'camions'), {
          ...formData,
          dateAchat: new Date(formData.dateAchat),
          kilometrageActuel: parseFloat(formData.kilometrageActuel.toString()) || 0,
          createdAt: new Date(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving camion:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 my-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {camion ? 'Modifier' : 'Nouveau camion'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
            <input
              type="text"
              value={formData.matricule}
              onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
            <input
              type="text"
              value={formData.marque}
              onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
            <input
              type="text"
              value={formData.modele}
              onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;achat</label>
            <input
              type="date"
              value={formData.dateAchat}
              onChange={(e) => setFormData({ ...formData, dateAchat: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kilométrage actuel</label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.kilometrageActuel}
              onChange={(e) => setFormData({ ...formData, kilometrageActuel: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          {/* Upload Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo du camion</label>
            
            {/* Preview */}
            {imagePreview && (
              <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden border border-gray-300">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  aria-label="Supprimer l'image"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Upload en cours... {uploadProgress}%</p>
              </div>
            )}

            {/* Upload Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={18} />
                <span className="text-sm">Choisir un fichier</span>
              </button>
              <button
                type="button"
                onClick={handleCameraClick}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera size={18} />
                <span className="text-sm">Prendre une photo</span>
              </button>
            </div>

            {/* Hidden File Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <p className="text-xs text-gray-500 mt-2">
              Formats acceptés : JPG, PNG, GIF (max 5MB)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary-600" />
              Couleur du camion
            </label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
              <div className="relative">
                <input
                  type="color"
                  value={formData.couleur}
                  onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                  className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300 shadow-sm hover:shadow-md transition-all"
                  title="Sélectionner une couleur"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Truck 
                    className="w-6 h-6 text-white drop-shadow-lg" 
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-5 h-5 rounded border-2 border-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: formData.couleur }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700 truncate">{formData.couleur.toUpperCase()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Cliquez pour choisir une couleur</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
            <select
              value={formData.etat}
              onChange={(e) => setFormData({ ...formData, etat: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="actif">Actif</option>
              <option value="en_maintenance">En maintenance</option>
              <option value="hors_service">Hors service</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              {camion ? 'Modifier' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
