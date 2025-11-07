'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, getStorageInstance, auth } from '@/firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
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
  
  // États pour les formulaires des autres entités
  const [showAssuranceForm, setShowAssuranceForm] = useState(false);
  const [selectedAssurance, setSelectedAssurance] = useState<Assurance | null>(null);
  const [showVisiteForm, setShowVisiteForm] = useState(false);
  const [selectedVisite, setSelectedVisite] = useState<VisiteTechnique | null>(null);
  const [showEntretienForm, setShowEntretienForm] = useState(false);
  const [selectedEntretien, setSelectedEntretien] = useState<Entretien | null>(null);
  const [showKilometrageForm, setShowKilometrageForm] = useState(false);
  const [selectedKilometrage, setSelectedKilometrage] = useState<Kilometrage | null>(null);
  const [showPneuForm, setShowPneuForm] = useState(false);
  const [selectedPneu, setSelectedPneu] = useState<Pneu | null>(null);
  const [showReparationForm, setShowReparationForm] = useState(false);
  const [selectedReparation, setSelectedReparation] = useState<Reparation | null>(null);

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

      setCamions(camionsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateAchat: data.dateAchat instanceof Timestamp ? data.dateAchat.toDate() : (data.dateAchat ? new Date(data.dateAchat) : new Date()),
          kilometrageActuel: data.kilometrageActuel || 0,
          imageUrl: data.imageUrl || '',
          couleur: data.couleur || '#0ea5e9',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
        } as Camion;
      }));
      
      setAssurances(assurancesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateDebut: data.dateDebut instanceof Timestamp ? data.dateDebut.toDate() : (data.dateDebut ? new Date(data.dateDebut) : new Date()),
          dateFin: data.dateFin instanceof Timestamp ? data.dateFin.toDate() : (data.dateFin ? new Date(data.dateFin) : new Date()),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
        } as Assurance;
      }));
      
      setVisites(visitesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : (data.date ? new Date(data.date) : new Date()),
          prochaineDate: data.prochaineDate instanceof Timestamp ? data.prochaineDate.toDate() : (data.prochaineDate ? new Date(data.prochaineDate) : new Date()),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
        } as VisiteTechnique;
      }));
      
      setEntretiens(entretiensSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : (data.date ? new Date(data.date) : new Date()),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
        } as Entretien;
      }));
      
      setKilometrages(kilometragesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : (data.date ? new Date(data.date) : new Date()),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
        } as Kilometrage;
      }));
      
      setPneus(pneusSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateInstallation: data.dateInstallation instanceof Timestamp ? data.dateInstallation.toDate() : (data.dateInstallation ? new Date(data.dateInstallation) : new Date()),
          dateFabrication: data.dateFabrication instanceof Timestamp ? data.dateFabrication.toDate() : (data.dateFabrication ? new Date(data.dateFabrication) : undefined),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
        } as Pneu;
      }));
      
      setReparations(reparationsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : (data.date ? new Date(data.date) : new Date()),
          garantie: data.garantie ? {
            ...data.garantie,
            dateFin: data.garantie.dateFin instanceof Timestamp ? data.garantie.dateFin.toDate() : (data.garantie.dateFin ? new Date(data.garantie.dateFin) : new Date()),
          } : undefined,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
        } as Reparation;
      }));
      
      setMissions(missionsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateDebut: data.dateDebut instanceof Timestamp ? data.dateDebut.toDate() : (data.dateDebut ? new Date(data.dateDebut) : new Date()),
          dateFin: data.dateFin instanceof Timestamp ? data.dateFin.toDate() : (data.dateFin ? new Date(data.dateFin) : undefined),
        } as Mission;
      }));
      
      setDepenses(depensesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : (data.date ? new Date(data.date) : new Date()),
        } as Depense;
      }));
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

  // Fonctions de suppression pour les autres entités
  const handleDeleteAssurance = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette assurance ?')) {
      try {
        await deleteDoc(doc(db, 'assurances', id));
        setAssurances(assurances.filter(a => a.id !== id));
      } catch (error) {
        console.error('Error deleting assurance:', error);
        alert('Erreur lors de la suppression de l\'assurance');
      }
    }
  };

  const handleDeleteVisite = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette visite technique ?')) {
      try {
        await deleteDoc(doc(db, 'visitesTechniques', id));
        setVisites(visites.filter(v => v.id !== id));
      } catch (error) {
        console.error('Error deleting visite:', error);
        alert('Erreur lors de la suppression de la visite technique');
      }
    }
  };

  const handleDeleteEntretien = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet entretien ?')) {
      try {
        await deleteDoc(doc(db, 'entretiens', id));
        setEntretiens(entretiens.filter(e => e.id !== id));
      } catch (error) {
        console.error('Error deleting entretien:', error);
        alert('Erreur lors de la suppression de l\'entretien');
      }
    }
  };

  const handleDeleteKilometrage = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement kilométrique ?')) {
      try {
        await deleteDoc(doc(db, 'kilometrages', id));
        setKilometrages(kilometrages.filter(k => k.id !== id));
      } catch (error) {
        console.error('Error deleting kilometrage:', error);
        alert('Erreur lors de la suppression de l\'enregistrement kilométrique');
      }
    }
  };

  const handleDeletePneu = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce pneu ?')) {
      try {
        await deleteDoc(doc(db, 'pneus', id));
        setPneus(pneus.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting pneu:', error);
        alert('Erreur lors de la suppression du pneu');
      }
    }
  };

  const handleDeleteReparation = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réparation ?')) {
      try {
        await deleteDoc(doc(db, 'reparations', id));
        setReparations(reparations.filter(r => r.id !== id));
      } catch (error) {
        console.error('Error deleting reparation:', error);
        alert('Erreur lors de la suppression de la réparation');
      }
    }
  };

  // Compute filtered data for selected camion (always at top level for hooks)
  const detailCamion = selectedCamionForDetail 
    ? camions.find(c => c.id === selectedCamionForDetail) 
    : null;

  const camionMissions = useMemo(() => {
    return detailCamion 
      ? missions.filter(m => m.camionId === detailCamion.id)
      : [];
  }, [detailCamion, missions]);

  const camionDepenses = useMemo(() => {
    return detailCamion 
      ? depenses.filter(d => d.camionId === detailCamion.id)
      : [];
  }, [detailCamion, depenses]);

  const camionAssurances = useMemo(() => {
    return detailCamion 
      ? assurances.filter(a => a.camionId === detailCamion.id)
      : [];
  }, [detailCamion, assurances]);

  const camionVisites = useMemo(() => {
    return detailCamion 
      ? visites.filter(v => v.camionId === detailCamion.id)
      : [];
  }, [detailCamion, visites]);

  const camionEntretiens = useMemo(() => {
    return detailCamion 
      ? entretiens.filter(e => e.camionId === detailCamion.id)
      : [];
  }, [detailCamion, entretiens]);

  const camionKilometrages = useMemo(() => {
    if (!detailCamion) return [];
    return kilometrages.filter(k => k.camionId === detailCamion.id).sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [detailCamion, kilometrages]);

  const camionPneus = useMemo(() => {
    return detailCamion 
      ? pneus.filter(p => p.camionId === detailCamion.id)
      : [];
  }, [detailCamion, pneus]);

  const camionReparations = useMemo(() => {
    if (!detailCamion) return [];
    return reparations.filter(r => r.camionId === detailCamion.id).sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [detailCamion, reparations]);

  // Données pour graphiques - hook must be at top level
  const monthlyData = useMemo(() => {
    if (!detailCamion || (camionDepenses.length === 0 && camionMissions.length === 0)) {
      return [];
    }
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
  }, [detailCamion, camionDepenses, camionMissions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Vue détaillée du camion (affichée seulement si le formulaire n'est pas ouvert)
  if (selectedCamionForDetail && !showForm) {
    if (!detailCamion) return null;

    const totalDepenses = camionDepenses.reduce((sum, d) => sum + d.montant, 0);
    const totalRecettes = camionMissions.reduce((sum, m) => sum + (m.recette || 0), 0);
    const profit = totalRecettes - totalDepenses;
    const totalReparations = camionReparations.reduce((sum, r) => sum + r.coutTotal, 0);
    const totalEntretiens = camionEntretiens.reduce((sum, e) => sum + e.cout, 0);

    return (
      <div className="w-full max-w-full overflow-x-hidden space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={() => setSelectedCamionForDetail(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors self-start text-sm sm:text-base"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
            <span>Retour</span>
          </button>
          <button
            onClick={() => {
              setSelectedCamion(detailCamion);
              setSelectedCamionForDetail(null); // Fermer la vue détaillée
              setShowForm(true); // Ouvrir le formulaire
            }}
            className="flex items-center gap-2 bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors self-start sm:self-auto text-sm sm:text-base"
          >
            <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Modifier</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8">
              {/* Image */}
              <div className="relative w-full sm:w-56 lg:w-64 h-40 sm:h-56 lg:h-64 rounded-lg sm:rounded-xl overflow-hidden shadow-lg bg-white/10 backdrop-blur-sm flex-shrink-0">
                {detailCamion.imageUrl ? (
                  <Image
                    src={detailCamion.imageUrl}
                    alt={detailCamion.matricule}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/20 to-white/10">
                    <Truck className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-white/80" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 truncate">{detailCamion.matricule}</h1>
                  <p className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-3 sm:mb-4 truncate">{detailCamion.marque} {detailCamion.modele}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                      detailCamion.etat === 'actif' ? 'bg-green-500/90 text-white' :
                      detailCamion.etat === 'en_maintenance' ? 'bg-yellow-500/90 text-white' :
                      'bg-red-500/90 text-white'
                    }`}>
                      {detailCamion.etat === 'actif' ? 'Actif' :
                       detailCamion.etat === 'en_maintenance' ? 'En maintenance' :
                       'Hors service'}
                    </span>
                    {detailCamion.couleur && (
                      <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white flex-shrink-0" style={{ backgroundColor: detailCamion.couleur }}></div>
                        <span className="text-xs sm:text-sm text-white whitespace-nowrap">Couleur</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats rapides */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mt-3 sm:mt-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 lg:p-4">
                    <p className="text-xs text-white/80 mb-1">Kilométrage</p>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-white break-words">{(detailCamion.kilometrageActuel || 0).toLocaleString('fr-FR')} km</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 lg:p-4">
                    <p className="text-xs text-white/80 mb-1">Missions</p>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-white">{camionMissions.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 lg:p-4">
                    <p className="text-xs text-white/80 mb-1">Dépenses</p>
                    <p className="text-xs sm:text-sm lg:text-base font-bold text-white break-words">{formatCurrency(totalDepenses)}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 lg:p-4">
                    <p className="text-xs text-white/80 mb-1">Profit</p>
                    <p className={`text-xs sm:text-sm lg:text-base font-bold break-words ${profit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
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
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Total dépenses</p>
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(totalDepenses)}</p>
            <p className="text-xs text-gray-500 mt-1">Réparations + Entretiens</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Total recettes</p>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(totalRecettes)}</p>
            <p className="text-xs text-gray-500 mt-1">Missions</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Réparations</p>
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(totalReparations)}</p>
            <p className="text-xs text-gray-500 mt-1">{camionReparations.length} réparations</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Entretiens</p>
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(totalEntretiens)}</p>
            <p className="text-xs text-gray-500 mt-1">{camionEntretiens.length} entretiens</p>
          </div>
        </div>

        {/* Graphiques */}
        {monthlyData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 overflow-x-auto">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Évolution financière</h2>
            <div className="w-full min-w-[300px]">
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ fontSize: '12px', padding: '8px' }}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                  <Bar dataKey="depenses" fill="#ef4444" name="Dépenses" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recettes" fill="#10b981" name="Recettes" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Informations du camion - Carte structurée */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 flex-shrink-0" />
            <span>Informations du camion</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Matricule */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Matricule</label>
              <div className="text-base sm:text-lg font-bold text-gray-900">{detailCamion.matricule}</div>
            </div>

            {/* Marque */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Marque</label>
              <div className="flex items-center gap-2">
                {getMarqueLogoUrl(detailCamion.marque) ? (
                  <Image
                    src={getMarqueLogoUrl(detailCamion.marque)!}
                    alt={`${detailCamion.marque} logo`}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                ) : (
                  marqueEmojis[detailCamion.marque] && (
                    <span className="text-2xl">{marqueEmojis[detailCamion.marque]}</span>
                  )
                )}
                <span className="text-base sm:text-lg font-semibold text-gray-900">{detailCamion.marque}</span>
              </div>
            </div>

            {/* Modèle */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Modèle</label>
              <div className="text-base sm:text-lg font-semibold text-gray-900">{detailCamion.modele}</div>
            </div>

            {/* Date d'achat */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Date d&apos;achat</label>
              <div className="text-base sm:text-lg text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formatDate(detailCamion.dateAchat)}</span>
              </div>
            </div>

            {/* Date de création */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Date de création</label>
              <div className="text-base sm:text-lg text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formatDate(detailCamion.createdAt)}</span>
              </div>
            </div>

            {/* Kilométrage actuel */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Kilométrage actuel</label>
              <div className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-gray-400" />
                <span>{(detailCamion.kilometrageActuel || 0).toLocaleString('fr-FR')} km</span>
              </div>
            </div>

            {/* État */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">État</label>
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                  detailCamion.etat === 'actif' ? 'bg-green-100 text-green-800' :
                  detailCamion.etat === 'en_maintenance' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {detailCamion.etat === 'actif' ? 'Actif' :
                   detailCamion.etat === 'en_maintenance' ? 'En maintenance' :
                   'Hors service'}
                </span>
              </div>
            </div>

            {/* Couleur */}
            {detailCamion.couleur && (
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Couleur</label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm" 
                    style={{ backgroundColor: detailCamion.couleur }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{detailCamion.couleur.toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Documents */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
              <span>Documents</span>
            </h2>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-700">Assurances</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900">{camionAssurances.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-700">Visites techniques</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900">{camionVisites.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-700">Pneus</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900">{camionPneus.length}</span>
              </div>
            </div>
          </div>

          {/* Dernières réparations */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
              <span>Dernières réparations</span>
            </h2>
            <div className="space-y-2 sm:space-y-3">
              {camionReparations.slice(0, 5).map((reparation) => (
                <div key={reparation.id} className="flex items-start sm:items-center justify-between gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{reparation.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(reparation.date)}</p>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 flex-shrink-0 ml-2">{formatCurrency(reparation.coutTotal)}</span>
                </div>
              ))}
              {camionReparations.length === 0 && (
                <p className="text-xs sm:text-sm text-gray-500 text-center py-4">Aucune réparation</p>
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
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Assurances</h2>
              <button
                onClick={() => {
                  setSelectedAssurance(null);
                  setShowAssuranceForm(true);
                }}
                className="flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                <span>Nouvelle assurance</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camion</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Compagnie</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temps restant</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assurances.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          Aucune assurance enregistrée
                        </td>
                      </tr>
                    ) : (
                      assurances.map((assurance) => {
                        const camion = camions.find(c => c.id === assurance.camionId);
                        
                        // Calculer le temps restant avant expiration
                        const calculateTimeRemaining = (dateFin: Date) => {
                          const now = new Date();
                          const fin = new Date(dateFin);
                          const diffTime = fin.getTime() - now.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (diffDays < 0) {
                            return {
                              text: `Expirée depuis ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`,
                              status: 'expired',
                              days: diffDays
                            };
                          } else if (diffDays === 0) {
                            return {
                              text: 'Expire aujourd\'hui',
                              status: 'expiring',
                              days: 0
                            };
                          } else if (diffDays <= 30) {
                            return {
                              text: `${diffDays} jour${diffDays > 1 ? 's' : ''}`,
                              status: 'warning',
                              days: diffDays
                            };
                          } else if (diffDays <= 90) {
                            const months = Math.floor(diffDays / 30);
                            const days = diffDays % 30;
                            return {
                              text: months > 0 
                                ? `${months} mois${days > 0 ? ` et ${days} jour${days > 1 ? 's' : ''}` : ''}`
                                : `${diffDays} jours`,
                              status: 'attention',
                              days: diffDays
                            };
                          } else {
                            const months = Math.floor(diffDays / 30);
                            return {
                              text: `${months} mois`,
                              status: 'ok',
                              days: diffDays
                            };
                          }
                        };
                        
                        const timeRemaining = calculateTimeRemaining(assurance.dateFin);
                        
                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'expired':
                              return 'bg-red-100 text-red-800 border-red-200';
                            case 'expiring':
                              return 'bg-red-100 text-red-800 border-red-200';
                            case 'warning':
                              return 'bg-orange-100 text-orange-800 border-orange-200';
                            case 'attention':
                              return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                            default:
                              return 'bg-green-100 text-green-800 border-green-200';
                          }
                        };
                        
                        return (
                          <tr key={assurance.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {camion?.matricule || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {assurance.numero}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                              {assurance.compagnie || '-'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex flex-col">
                                <span>{formatDate(assurance.dateDebut)}</span>
                                <span className="text-xs text-gray-400">→ {formatDate(assurance.dateFin)}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(timeRemaining.status)}`}>
                                {timeRemaining.text}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatCurrency(assurance.montant)}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedAssurance(assurance);
                                    setShowAssuranceForm(true);
                                  }}
                                  className="text-primary-600 hover:text-primary-900"
                                  title="Modifier"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteAssurance(assurance.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Supprimer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
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
        </div>
      )}

      {/* Visite Technique Tab */}
      {activeTab === 'visite' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Visites techniques</h2>
              <button
                onClick={() => {
                  setSelectedVisite(null);
                  setShowVisiteForm(true);
                }}
                className="flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                <span>Nouvelle visite</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camion</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Prochaine visite</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Résultat</th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visites.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          Aucune visite technique enregistrée
                        </td>
                      </tr>
                    ) : (
                      visites.map((visite) => {
                        const camion = camions.find(c => c.id === visite.camionId);
                        return (
                          <tr key={visite.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {camion?.matricule || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(visite.date)}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                              {formatDate(visite.prochaineDate)}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
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
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedVisite(visite);
                                    setShowVisiteForm(true);
                                  }}
                                  className="text-primary-600 hover:text-primary-900"
                                  title="Modifier"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteVisite(visite.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Supprimer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
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
        </div>
      )}

      {/* Entretien Tab */}
      {activeTab === 'entretien' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Entretiens</h2>
              <button
                onClick={() => {
                  setSelectedEntretien(null);
                  setShowEntretienForm(true);
                }}
                className="flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                <span>Nouvel entretien</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camion</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coût</th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entretiens.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          Aucun entretien enregistré
                        </td>
                      </tr>
                    ) : (
                      entretiens.map((entretien) => {
                        const camion = camions.find(c => c.id === entretien.camionId);
                        return (
                          <tr key={entretien.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {camion?.matricule || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {entretien.type === 'vidange' ? 'Vidange' : entretien.type === 'reparation' ? 'Réparation' : 'Autre'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(entretien.date)}
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                              <div className="max-w-xs truncate" title={entretien.description}>
                                {entretien.description}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatCurrency(entretien.cout)}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedEntretien(entretien);
                                    setShowEntretienForm(true);
                                  }}
                                  className="text-primary-600 hover:text-primary-900"
                                  title="Modifier"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteEntretien(entretien.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Supprimer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
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
        </div>
      )}

      {/* Kilométrage Tab */}
      {activeTab === 'kilometrage' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Suivi kilométrique</h2>
              <button
                onClick={() => {
                  setSelectedKilometrage(null);
                  setShowKilometrageForm(true);
                }}
                className="flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                <span>Nouveau kilométrage</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camion</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kilométrage</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Chauffeur</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Notes</th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {kilometrages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
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
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {camion?.matricule || 'N/A'}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(km.date)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {km.kilometrage.toLocaleString('fr-FR')} km
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                {km.chauffeurId ? 'Chauffeur' : '-'}
                              </td>
                              <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                                <div className="max-w-xs truncate" title={km.notes}>
                                  {km.notes || '-'}
                                </div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedKilometrage(km);
                                      setShowKilometrageForm(true);
                                    }}
                                    className="text-primary-600 hover:text-primary-900"
                                    title="Modifier"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteKilometrage(km.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
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
        </div>
      )}

      {/* Pneus Tab */}
      {activeTab === 'pneus' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Gestion des pneus</h2>
              <button
                onClick={() => {
                  setSelectedPneu(null);
                  setShowPneuForm(true);
                }}
                className="flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                <span>Nouveau pneu</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camion</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Marque / Modèle</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date installation</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Kilométrage</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">État</th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pneus.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
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
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {camion?.matricule || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {positionLabels[pneu.position] || pneu.position}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                              {pneu.marque && pneu.modele ? `${pneu.marque} ${pneu.modele}` : '-'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                              {formatDate(pneu.dateInstallation)}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                              {pneu.kilometrageActuel ? `${pneu.kilometrageActuel.toLocaleString('fr-FR')} km` : '-'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                pneu.etat === 'bon' ? 'bg-green-100 text-green-800' :
                                pneu.etat === 'usure' ? 'bg-yellow-100 text-yellow-800' :
                                pneu.etat === 'a_remplacer' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {etatLabels[pneu.etat] || pneu.etat}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedPneu(pneu);
                                    setShowPneuForm(true);
                                  }}
                                  className="text-primary-600 hover:text-primary-900"
                                  title="Modifier"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePneu(pneu.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Supprimer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
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
        </div>
      )}

      {/* Réparations Tab */}
      {activeTab === 'reparations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Historique des réparations</h2>
              <button
                onClick={() => {
                  setSelectedReparation(null);
                  setShowReparationForm(true);
                }}
                className="flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                <span>Nouvelle réparation</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camion</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Kilométrage</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Pièces</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coût total</th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reparations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
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
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {camion?.matricule || 'N/A'}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(reparation.date)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                  {typeLabels[reparation.type] || reparation.type}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                {reparation.kilometrage.toLocaleString('fr-FR')} km
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                                {reparation.piecesUtilisees?.length || 0} pièce(s)
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {formatCurrency(reparation.coutTotal)}
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedReparation(reparation);
                                      setShowReparationForm(true);
                                    }}
                                    className="text-primary-600 hover:text-primary-900"
                                    title="Modifier"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReparation(reparation.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
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
        </div>
      )}

      {/* Form Modals */}
      {showForm && (
        <CamionForm
          camion={selectedCamion}
          onClose={() => {
            setShowForm(false);
            setSelectedCamion(null);
          }}
          onSuccess={async () => {
            const camionId = selectedCamion?.id; // Sauvegarder l'ID du camion avant de le réinitialiser
            setShowForm(false);
            setSelectedCamion(null);
            await loadData();
            // Rouvrir la vue détaillée si on était en mode détail
            if (camionId) {
              // Utiliser setTimeout pour s'assurer que les données sont chargées
              setTimeout(() => {
                setSelectedCamionForDetail(camionId);
              }, 100);
            }
          }}
        />
      )}

      {showAssuranceForm && (
        <AssuranceForm
          assurance={selectedAssurance}
          camions={camions}
          onClose={() => {
            setShowAssuranceForm(false);
            setSelectedAssurance(null);
          }}
          onSuccess={async () => {
            setShowAssuranceForm(false);
            setSelectedAssurance(null);
            await loadData();
          }}
        />
      )}

      {showVisiteForm && (
        <VisiteForm
          visite={selectedVisite}
          camions={camions}
          onClose={() => {
            setShowVisiteForm(false);
            setSelectedVisite(null);
          }}
          onSuccess={async () => {
            setShowVisiteForm(false);
            setSelectedVisite(null);
            await loadData();
          }}
        />
      )}

      {showEntretienForm && (
        <EntretienForm
          entretien={selectedEntretien}
          camions={camions}
          onClose={() => {
            setShowEntretienForm(false);
            setSelectedEntretien(null);
          }}
          onSuccess={async () => {
            setShowEntretienForm(false);
            setSelectedEntretien(null);
            await loadData();
          }}
        />
      )}

      {showKilometrageForm && (
        <KilometrageForm
          kilometrage={selectedKilometrage}
          camions={camions}
          onClose={() => {
            setShowKilometrageForm(false);
            setSelectedKilometrage(null);
          }}
          onSuccess={async () => {
            setShowKilometrageForm(false);
            setSelectedKilometrage(null);
            await loadData();
          }}
        />
      )}

      {showPneuForm && (
        <PneuForm
          pneu={selectedPneu}
          camions={camions}
          onClose={() => {
            setShowPneuForm(false);
            setSelectedPneu(null);
          }}
          onSuccess={async () => {
            setShowPneuForm(false);
            setSelectedPneu(null);
            await loadData();
          }}
        />
      )}

      {showReparationForm && (
        <ReparationForm
          reparation={selectedReparation}
          camions={camions}
          onClose={() => {
            setShowReparationForm(false);
            setSelectedReparation(null);
          }}
          onSuccess={async () => {
            setShowReparationForm(false);
            setSelectedReparation(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

// Mapping des marques avec leurs domaines pour l'API Brandfetch
const marqueDomains: Record<string, string> = {
  'Mercedes-Benz': 'mercedes-benz.com',
  'Volvo': 'volvo.com',
  'Scania': 'scania.com',
  'MAN': 'man.eu',
  'Iveco': 'iveco.com',
  'Renault': 'renault.com',
  'Daimler': 'daimler.com',
  'DAF': 'daf.com',
};

// Fallback emojis si l'API ne fonctionne pas
const marqueEmojis: Record<string, string> = {
  'Mercedes-Benz': '🚛',
  'Volvo': '🚚',
  'Scania': '🚛',
  'MAN': '🚚',
  'Iveco': '🚛',
  'Renault': '🚚',
  'Daimler': '🚛',
  'DAF': '🚚',
};

// Fonction pour obtenir l'URL du logo via Brandfetch API
// Note: Désactivé temporairement - utilisez des emojis pour l'instant
// Pour activer les logos locaux, téléchargez les fichiers dans /public/images/logos/
const getMarqueLogoUrl = (marque: string): string | null => {
  // Désactivé pour l'instant - retourne null pour utiliser les emojis
  // Une fois que vous avez téléchargé les logos, décommentez la ligne suivante:
  // return getLocalMarqueLogoUrl(marque);
  return null;
  
  // Si vous voulez utiliser Brandfetch API, vous devez:
  // 1. Créer un compte sur brandfetch.com
  // 2. Obtenir une clé API
  // 3. Utiliser l'endpoint: https://api.brandfetch.io/v2/brands/{domain}
  // const domain = marqueDomains[marque];
  // if (!domain) return null;
  // return `https://cdn.brandfetch.io/${domain}/logo.png`;
};

// Alternative: utiliser des logos hébergés localement
// Si vous préférez télécharger les logos et les héberger vous-même
const getLocalMarqueLogoUrl = (marque: string): string | null => {
  const logoMap: Record<string, string> = {
    'Mercedes-Benz': '/images/logos/mercedes-benz.png',
    'Volvo': '/images/logos/volvo.png',
    'Scania': '/images/logos/scania.png',
    'MAN': '/images/logos/man.png',
    'Iveco': '/images/logos/iveco.png',
    'Renault': '/images/logos/renault.png',
    'Daimler': '/images/logos/daimler.png',
    'DAF': '/images/logos/daf.png',
  };
  return logoMap[marque] || null;
};

const marquesDisponibles = ['Mercedes-Benz', 'Volvo', 'Scania', 'MAN', 'Iveco', 'Renault', 'Daimler', 'DAF'];

function CamionForm({ camion, onClose, onSuccess }: { camion: Camion | null; onClose: () => void; onSuccess: () => void }) {
  const [user] = useAuthState(auth);
  
  // Helper function to safely convert date to ISO string for input
  const formatDateForInput = (date: Date | Timestamp | string | undefined): string => {
    if (!date) return '';
    try {
      let dateObj: Date;
      if (date instanceof Timestamp) {
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return '';
      }
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const [formData, setFormData] = useState({
    matricule: camion?.matricule || '',
    marque: camion?.marque || '',
    modele: camion?.modele || '',
    dateAchat: formatDateForInput(camion?.dateAchat),
    kilometrageActuel: camion?.kilometrageActuel || 0,
    imageUrl: camion?.imageUrl || '',
    couleur: camion?.couleur || '#0ea5e9',
    etat: camion?.etat || 'actif',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(camion?.imageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<Record<string, boolean>>({});
  const [oldImageUrl, setOldImageUrl] = useState<string | null>(camion?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset form when camion changes (for edit mode)
  useEffect(() => {
    if (camion) {
      setFormData({
        matricule: camion.matricule || '',
        marque: camion.marque || '',
        modele: camion.modele || '',
        dateAchat: formatDateForInput(camion.dateAchat),
        kilometrageActuel: camion.kilometrageActuel || 0,
        imageUrl: camion.imageUrl || '',
        couleur: camion.couleur || '#0ea5e9',
        etat: camion.etat || 'actif',
      });
      setImagePreview(camion.imageUrl || null);
      setOldImageUrl(camion.imageUrl || null);
      setSelectedFile(null);
      setUploading(false);
      setUploadProgress(0);
      setLogoError({});
      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } else {
      // Reset for new camion
      setFormData({
        matricule: '',
        marque: '',
        modele: '',
        dateAchat: '',
        kilometrageActuel: 0,
        imageUrl: '',
        couleur: '#0ea5e9',
        etat: 'actif',
      });
      setImagePreview(null);
      setOldImageUrl(null);
      setSelectedFile(null);
      setUploading(false);
      setUploadProgress(0);
      setLogoError({});
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camion?.id]); // Only reset when camion ID changes

  // Fonction pour sanitizer le nom de fichier
  const sanitizeFileName = (fileName: string): string => {
    // Extraire l'extension d'abord
    const lastDotIndex = fileName.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1).toLowerCase() : '';
    const nameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
    
    // Remplacer les caractères spéciaux et espaces par des underscores
    // Garder seulement les caractères alphanumériques et underscores
    let sanitized = nameWithoutExt
      .replace(/[^a-zA-Z0-9]/g, '_') // Remplacer tout ce qui n'est pas alphanumérique
      .replace(/_{2,}/g, '_') // Remplacer les underscores multiples par un seul
      .toLowerCase();
    
    // Si le nom est vide après sanitization, utiliser un nom par défaut
    if (!sanitized || sanitized === '_') {
      sanitized = 'image';
    }
    
    // Limiter la longueur du nom (sans l'extension)
    const maxLength = 30;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    // Retirer les underscores en début et fin
    sanitized = sanitized.replace(/^_+|_+$/g, '');
    
    // Retourner avec l'extension si elle existe
    return extension ? `${sanitized}.${extension}` : sanitized;
  };

  // Fonction pour uploader une image via Cloudinary
  const uploadImage = async (file: File): Promise<string> => {
    // Vérifier que l'utilisateur est authentifié
    if (!user) {
      throw new Error('Vous devez être connecté pour uploader une image');
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('🔄 Upload vers Cloudinary...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId: user?.uid
      });

      // Créer FormData
      const formData = new FormData();
      formData.append('file', file);

      // Uploader via Cloudinary API route
      const response = await fetch('/api/upload-cloudinary', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('❌ Erreur Cloudinary:', errorData);
        
        // Si Cloudinary n'est pas configuré, proposer d'utiliser une URL
        if (errorData.code === 'CLOUDINARY_NOT_CONFIGURED') {
          const useUrl = confirm(
            'Cloudinary n\'est pas configuré.\n\n' +
            'Souhaitez-vous entrer une URL d\'image directement ?\n\n' +
            'Sinon, configurez Cloudinary en suivant les instructions dans CLOUDINARY_SETUP.md'
          );
          
          if (useUrl) {
            const imageUrl = prompt('Entrez l\'URL de l\'image:');
            if (imageUrl && imageUrl.trim()) {
              setFormData(prev => ({ ...prev, imageUrl: imageUrl.trim() }));
              setImagePreview(imageUrl.trim());
              setUploading(false);
              setUploadProgress(100);
              return imageUrl.trim();
            }
          }
        }
        
        throw new Error(errorData.error || errorData.message || 'Erreur lors de l\'upload');
      }

      const data = await response.json();
      console.log('✅ Upload réussi via Cloudinary!', { url: data.url });
      setUploading(false);
      setUploadProgress(100);
      return data.url;
    } catch (error: any) {
      setUploading(false);
      setUploadProgress(0);
      console.error('❌ Erreur lors de l\'upload:', error);
      
      const errorMessage = error.message || 'Erreur lors de l\'upload de l\'image';
      alert(errorMessage);
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
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop grande (max 5MB)');
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);

    // Afficher la preview immédiatement
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Uploader l'image immédiatement
    try {
      const downloadURL = await uploadImage(file);
      setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
      // Reset file input after successful upload
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erreur lors de l\'upload de l\'image. Veuillez réessayer.');
      // Restaurer la preview précédente en cas d'erreur
      setImagePreview(oldImageUrl || null);
      setSelectedFile(null);
      // Reset file input on error
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
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
    const imageUrlToDelete = formData.imageUrl;
    
    // Supprimer l'image de Firebase Storage si elle existe
    if (imageUrlToDelete && imageUrlToDelete.includes('firebasestorage')) {
      try {
        const storage = getStorageInstance();
        if (storage) {
          // Extraire le chemin du fichier depuis l'URL
          // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
          const urlParts = imageUrlToDelete.split('/o/');
          if (urlParts.length > 1) {
            const pathPart = urlParts[1].split('?')[0];
            const decodedPath = decodeURIComponent(pathPart);
            const imageRef = storageRef(storage, decodedPath);
            await deleteObject(imageRef);
          }
        }
      } catch (error) {
        console.error('Error deleting image from storage:', error);
        // Continuer même si la suppression échoue
      }
    }
    
    // Réinitialiser l'état
    setImagePreview(null);
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) {
      alert('Veuillez attendre la fin de l\'upload de l\'image');
      return;
    }

    // Si un fichier a été sélectionné mais pas encore uploadé, l'uploader maintenant
    if (selectedFile && !formData.imageUrl) {
      try {
        setUploading(true);
        const downloadURL = await uploadImage(selectedFile);
        setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
        setSelectedFile(null);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Erreur lors de l\'upload de l\'image. Veuillez réessayer.');
        setUploading(false);
        return;
      }
    }

    try {
      const dataToSave = {
        matricule: formData.matricule,
        marque: formData.marque,
        modele: formData.modele,
        dateAchat: new Date(formData.dateAchat),
        kilometrageActuel: parseFloat(formData.kilometrageActuel.toString()) || 0,
        couleur: formData.couleur,
        etat: formData.etat,
        ...(formData.imageUrl && { imageUrl: formData.imageUrl }), // Inclure imageUrl seulement s'il existe
      };

      if (camion) {
        await updateDoc(doc(db, 'camions', camion.id), dataToSave);
      } else {
        await addDoc(collection(db, 'camions'), {
          ...dataToSave,
          createdAt: new Date(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving camion:', error);
      alert('Erreur lors de l\'enregistrement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-6 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary-600" />
            <span>{camion ? 'Modifier le camion' : 'Nouveau camion'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations de base */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Truck className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Informations de base</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Matricule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Matricule <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  required
                  placeholder="Ex: M2566-38"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Modèle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Modèle <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.modele}
                  onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                  required
                  placeholder="Ex: FM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Marque */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Marque <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    list="marques-list"
                    value={formData.marque}
                    onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                    placeholder="Sélectionner ou saisir une marque"
                    required
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <datalist id="marques-list">
                    {marquesDisponibles.map((marque) => (
                      <option key={marque} value={marque} />
                    ))}
                  </datalist>
                  {formData.marque && (getMarqueLogoUrl(formData.marque) || marqueEmojis[formData.marque]) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      {getMarqueLogoUrl(formData.marque) && !logoError[formData.marque] ? (
                        <Image
                          src={getMarqueLogoUrl(formData.marque)!}
                          alt={`${formData.marque} logo`}
                          width={20}
                          height={20}
                          className="object-contain"
                          onError={() => {
                            setLogoError(prev => ({ ...prev, [formData.marque]: true }));
                          }}
                        />
                      ) : (
                        <span className="text-xl">{marqueEmojis[formData.marque]}</span>
                      )}
                    </div>
                  )}
                </div>
                {/* Afficher le logo si une marque connue est sélectionnée */}
                {formData.marque && (getMarqueLogoUrl(formData.marque) || marqueEmojis[formData.marque]) && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    {getMarqueLogoUrl(formData.marque) && !logoError[formData.marque] ? (
                      <Image
                        src={getMarqueLogoUrl(formData.marque)!}
                        alt={`${formData.marque} logo`}
                        width={28}
                        height={28}
                        className="object-contain"
                        onError={() => {
                          setLogoError(prev => ({ ...prev, [formData.marque]: true }));
                        }}
                      />
                    ) : (
                      <span className="text-2xl">{marqueEmojis[formData.marque]}</span>
                    )}
                    <span className="text-sm text-gray-600 font-medium">Logo {formData.marque}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Informations techniques */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Gauge className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Informations techniques</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date d'achat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date d&apos;achat <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.dateAchat}
                    onChange={(e) => setFormData({ ...formData, dateAchat: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Kilométrage actuel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kilométrage actuel
                </label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.kilometrageActuel}
                    onChange={(e) => setFormData({ ...formData, kilometrageActuel: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">km</span>
                </div>
              </div>
            </div>

            {/* État */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                État <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.etat}
                onChange={(e) => setFormData({ ...formData, etat: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="actif">Actif</option>
                <option value="en_maintenance">En maintenance</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>
          </div>
          {/* Section: Apparence */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <ImageIcon className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Apparence</h3>
            </div>

            {/* Photo du camion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo du camion
              </label>
              
              {/* Preview */}
              {imagePreview && (
                <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden border border-gray-300 bg-gray-50">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
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
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Upload size={18} />
                  <span>Choisir un fichier</span>
                </button>
                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Camera size={18} />
                  <span>Prendre une photo</span>
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

              <p className="text-xs text-gray-500 mb-4">
                Formats acceptés : JPG, PNG, GIF (max 5MB)
              </p>

              {/* URL Image Input (Alternative) */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou entrez une URL d&apos;image directement
                </label>
                <input
                  type="url"
                  placeholder="https://exemple.com/image.jpg"
                  value={formData.imageUrl && !imagePreview?.startsWith('data:') ? formData.imageUrl : ''}
                  onChange={(e) => {
                    const url = e.target.value.trim();
                    if (url) {
                      setFormData(prev => ({ ...prev, imageUrl: url }));
                      setImagePreview(url);
                      setSelectedFile(null);
                    } else {
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                      setImagePreview(oldImageUrl || null);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Utilisez cette option si Cloudinary n&apos;est pas configuré ou pour utiliser une image hébergée ailleurs
                </p>
              </div>
            </div>

            {/* Couleur du camion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur du camion
              </label>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
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
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-6 h-6 rounded border-2 border-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: formData.couleur }}
                    ></div>
                    <span className="text-sm font-semibold text-gray-700">{formData.couleur.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-gray-500">Cliquez sur le carré pour choisir une couleur</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-primary-600 text-white py-2.5 px-4 rounded-lg hover:bg-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Enregistrement...' : (camion ? 'Modifier le camion' : 'Créer le camion')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Formulaire Assurance
function AssuranceForm({ 
  assurance, 
  camions, 
  onClose, 
  onSuccess 
}: { 
  assurance: Assurance | null; 
  camions: Camion[]; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const formatDateForInput = (date: Date | Timestamp | string | undefined): string => {
    if (!date) return '';
    try {
      let dateObj: Date;
      if (date instanceof Timestamp) {
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return '';
      }
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    camionId: assurance?.camionId || '',
    numero: assurance?.numero || '',
    compagnie: assurance?.compagnie || '',
    dateDebut: formatDateForInput(assurance?.dateDebut),
    dateFin: formatDateForInput(assurance?.dateFin),
    montant: assurance?.montant || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        camionId: formData.camionId,
        numero: formData.numero,
        compagnie: formData.compagnie,
        dateDebut: Timestamp.fromDate(new Date(formData.dateDebut)),
        dateFin: Timestamp.fromDate(new Date(formData.dateFin)),
        montant: parseFloat(formData.montant.toString()) || 0,
      };

      if (assurance) {
        await updateDoc(doc(db, 'assurances', assurance.id), dataToSave);
      } else {
        await addDoc(collection(db, 'assurances'), {
          ...dataToSave,
          createdAt: Timestamp.now(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving assurance:', error);
      alert('Erreur lors de l\'enregistrement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-6 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-600" />
            <span>{assurance ? 'Modifier l\'assurance' : 'Nouvelle assurance'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations de base */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Shield className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Informations de l&apos;assurance</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Camion */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Camion <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.camionId}
                  onChange={(e) => setFormData({ ...formData, camionId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">Sélectionner un camion</option>
                  {camions.map((camion) => (
                    <option key={camion.id} value={camion.id}>
                      {camion.matricule} - {camion.marque} {camion.modele}
                    </option>
                  ))}
                </select>
              </div>

              {/* Numéro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Numéro <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  required
                  placeholder="Numéro de police"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Compagnie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Compagnie d&apos;assurance
                </label>
                <input
                  type="text"
                  value={formData.compagnie}
                  onChange={(e) => setFormData({ ...formData, compagnie: e.target.value })}
                  placeholder="Nom de la compagnie"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Date début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Date fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Montant <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.montant}
                    onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2.5 px-4 rounded-lg hover:bg-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 font-medium"
            >
              {assurance ? 'Modifier l\'assurance' : 'Créer l\'assurance'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Formulaire Visite Technique
function VisiteForm({ 
  visite, 
  camions, 
  onClose, 
  onSuccess 
}: { 
  visite: VisiteTechnique | null; 
  camions: Camion[]; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const formatDateForInput = (date: Date | Timestamp | string | undefined): string => {
    if (!date) return '';
    try {
      let dateObj: Date;
      if (date instanceof Timestamp) {
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return '';
      }
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    camionId: visite?.camionId || '',
    date: formatDateForInput(visite?.date),
    prochaineDate: formatDateForInput(visite?.prochaineDate),
    resultat: visite?.resultat || 'valide' as 'valide' | 'non_valide',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        camionId: formData.camionId,
        date: Timestamp.fromDate(new Date(formData.date)),
        prochaineDate: Timestamp.fromDate(new Date(formData.prochaineDate)),
        resultat: formData.resultat,
      };

      if (visite) {
        await updateDoc(doc(db, 'visitesTechniques', visite.id), dataToSave);
      } else {
        await addDoc(collection(db, 'visitesTechniques'), {
          ...dataToSave,
          createdAt: Timestamp.now(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving visite:', error);
      alert('Erreur lors de l\'enregistrement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-6 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            <span>{visite ? 'Modifier la visite technique' : 'Nouvelle visite technique'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Informations de la visite</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Camion */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Camion <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.camionId}
                  onChange={(e) => setFormData({ ...formData, camionId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">Sélectionner un camion</option>
                  {camions.map((camion) => (
                    <option key={camion.id} value={camion.id}>
                      {camion.matricule} - {camion.marque} {camion.modele}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date de la visite <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Prochaine date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prochaine visite <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.prochaineDate}
                    onChange={(e) => setFormData({ ...formData, prochaineDate: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Résultat */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Résultat <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.resultat}
                  onChange={(e) => setFormData({ ...formData, resultat: e.target.value as 'valide' | 'non_valide' })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="valide">Valide</option>
                  <option value="non_valide">Non valide</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2.5 px-4 rounded-lg hover:bg-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 font-medium"
            >
              {visite ? 'Modifier la visite' : 'Créer la visite'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Formulaire Entretien
function EntretienForm({ 
  entretien, 
  camions, 
  onClose, 
  onSuccess 
}: { 
  entretien: Entretien | null; 
  camions: Camion[]; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const formatDateForInput = (date: Date | Timestamp | string | undefined): string => {
    if (!date) return '';
    try {
      let dateObj: Date;
      if (date instanceof Timestamp) {
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return '';
      }
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    camionId: entretien?.camionId || '',
    type: entretien?.type || 'vidange' as 'vidange' | 'reparation' | 'autre',
    date: formatDateForInput(entretien?.date),
    description: entretien?.description || '',
    cout: entretien?.cout || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        camionId: formData.camionId,
        type: formData.type,
        date: Timestamp.fromDate(new Date(formData.date)),
        description: formData.description,
        cout: parseFloat(formData.cout.toString()) || 0,
      };

      if (entretien) {
        await updateDoc(doc(db, 'entretiens', entretien.id), dataToSave);
      } else {
        await addDoc(collection(db, 'entretiens'), {
          ...dataToSave,
          createdAt: Timestamp.now(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving entretien:', error);
      alert('Erreur lors de l\'enregistrement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-6 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary-600" />
            <span>{entretien ? 'Modifier l\'entretien' : 'Nouvel entretien'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Wrench className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Informations de l&apos;entretien</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Camion */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Camion <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.camionId}
                  onChange={(e) => setFormData({ ...formData, camionId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">Sélectionner un camion</option>
                  {camions.map((camion) => (
                    <option key={camion.id} value={camion.id}>
                      {camion.matricule} - {camion.marque} {camion.modele}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'vidange' | 'reparation' | 'autre' })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="vidange">Vidange</option>
                  <option value="reparation">Réparation</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Coût */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Coût <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cout}
                    onChange={(e) => setFormData({ ...formData, cout: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Description de l'entretien"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2.5 px-4 rounded-lg hover:bg-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 font-medium"
            >
              {entretien ? 'Modifier l\'entretien' : 'Créer l\'entretien'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Formulaire Kilométrage
function KilometrageForm({ 
  kilometrage, 
  camions, 
  onClose, 
  onSuccess 
}: { 
  kilometrage: Kilometrage | null; 
  camions: Camion[]; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const formatDateForInput = (date: Date | Timestamp | string | undefined): string => {
    if (!date) return '';
    try {
      let dateObj: Date;
      if (date instanceof Timestamp) {
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return '';
      }
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    camionId: kilometrage?.camionId || '',
    date: formatDateForInput(kilometrage?.date),
    kilometrage: kilometrage?.kilometrage || 0,
    notes: kilometrage?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        camionId: formData.camionId,
        date: Timestamp.fromDate(new Date(formData.date)),
        kilometrage: parseFloat(formData.kilometrage.toString()) || 0,
        ...(formData.notes && { notes: formData.notes }),
      };

      if (kilometrage) {
        await updateDoc(doc(db, 'kilometrages', kilometrage.id), dataToSave);
      } else {
        await addDoc(collection(db, 'kilometrages'), {
          ...dataToSave,
          createdAt: Timestamp.now(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving kilometrage:', error);
      alert('Erreur lors de l\'enregistrement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-6 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gauge className="w-6 h-6 text-primary-600" />
            <span>{kilometrage ? 'Modifier le kilométrage' : 'Nouveau kilométrage'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Gauge className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Enregistrement kilométrique</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Camion */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Camion <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.camionId}
                  onChange={(e) => setFormData({ ...formData, camionId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">Sélectionner un camion</option>
                  {camions.map((camion) => (
                    <option key={camion.id} value={camion.id}>
                      {camion.matricule} - {camion.marque} {camion.modele}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Kilométrage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kilométrage <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.kilometrage}
                    onChange={(e) => setFormData({ ...formData, kilometrage: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">km</span>
                </div>
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Notes supplémentaires (optionnel)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2.5 px-4 rounded-lg hover:bg-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 font-medium"
            >
              {kilometrage ? 'Modifier le kilométrage' : 'Créer l\'enregistrement'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Formulaire Pneu
function PneuForm({ 
  pneu, 
  camions, 
  onClose, 
  onSuccess 
}: { 
  pneu: Pneu | null; 
  camions: Camion[]; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const formatDateForInput = (date: Date | Timestamp | string | undefined): string => {
    if (!date) return '';
    try {
      let dateObj: Date;
      if (date instanceof Timestamp) {
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return '';
      }
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    camionId: pneu?.camionId || '',
    position: pneu?.position || 'avant_droit' as 'avant_droit' | 'avant_gauche' | 'arriere_droit' | 'arriere_gauche' | 'roue_secours',
    marque: pneu?.marque || '',
    modele: pneu?.modele || '',
    numeroSerie: pneu?.numeroSerie || '',
    dateInstallation: formatDateForInput(pneu?.dateInstallation),
    dateFabrication: formatDateForInput(pneu?.dateFabrication),
    kilometrageInstallation: pneu?.kilometrageInstallation || 0,
    kilometrageActuel: pneu?.kilometrageActuel || 0,
    etat: pneu?.etat || 'bon' as 'bon' | 'usure' | 'a_remplacer' | 'remplace',
    profondeur: pneu?.profondeur || 0,
    prix: pneu?.prix || 0,
    fournisseur: pneu?.fournisseur || '',
    notes: pneu?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        camionId: formData.camionId,
        position: formData.position,
        dateInstallation: Timestamp.fromDate(new Date(formData.dateInstallation)),
        kilometrageInstallation: parseFloat(formData.kilometrageInstallation.toString()) || 0,
        etat: formData.etat,
        ...(formData.marque && { marque: formData.marque }),
        ...(formData.modele && { modele: formData.modele }),
        ...(formData.numeroSerie && { numeroSerie: formData.numeroSerie }),
        ...(formData.dateFabrication && { dateFabrication: Timestamp.fromDate(new Date(formData.dateFabrication)) }),
        ...(formData.kilometrageActuel && { kilometrageActuel: parseFloat(formData.kilometrageActuel.toString()) }),
        ...(formData.profondeur && { profondeur: parseFloat(formData.profondeur.toString()) }),
        ...(formData.prix && { prix: parseFloat(formData.prix.toString()) }),
        ...(formData.fournisseur && { fournisseur: formData.fournisseur }),
        ...(formData.notes && { notes: formData.notes }),
      };

      if (pneu) {
        await updateDoc(doc(db, 'pneus', pneu.id), {
          ...dataToSave,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(collection(db, 'pneus'), {
          ...dataToSave,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving pneu:', error);
      alert('Erreur lors de l\'enregistrement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-6 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Circle className="w-6 h-6 text-primary-600" />
            <span>{pneu ? 'Modifier le pneu' : 'Nouveau pneu'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations de base */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Circle className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Informations du pneu</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Camion */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Camion <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.camionId}
                  onChange={(e) => setFormData({ ...formData, camionId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">Sélectionner un camion</option>
                  {camions.map((camion) => (
                    <option key={camion.id} value={camion.id}>
                      {camion.matricule} - {camion.marque} {camion.modele}
                    </option>
                  ))}
                </select>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Position <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="avant_droit">Avant droit</option>
                  <option value="avant_gauche">Avant gauche</option>
                  <option value="arriere_droit">Arrière droit</option>
                  <option value="arriere_gauche">Arrière gauche</option>
                  <option value="roue_secours">Roue de secours</option>
                </select>
              </div>

              {/* État */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  État <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.etat}
                  onChange={(e) => setFormData({ ...formData, etat: e.target.value as any })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="bon">Bon</option>
                  <option value="usure">Usure</option>
                  <option value="a_remplacer">À remplacer</option>
                  <option value="remplace">Remplacé</option>
                </select>
              </div>

              {/* Marque */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Marque</label>
                <input
                  type="text"
                  value={formData.marque}
                  onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                  placeholder="Marque du pneu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Modèle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Modèle</label>
                <input
                  type="text"
                  value={formData.modele}
                  onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                  placeholder="Modèle du pneu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Numéro de série */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro de série</label>
                <input
                  type="text"
                  value={formData.numeroSerie}
                  onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                  placeholder="Numéro de série"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Date d'installation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date d&apos;installation <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.dateInstallation}
                    onChange={(e) => setFormData({ ...formData, dateInstallation: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Date de fabrication */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de fabrication</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.dateFabrication}
                    onChange={(e) => setFormData({ ...formData, dateFabrication: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Kilométrage installation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kilométrage à l&apos;installation <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.kilometrageInstallation}
                    onChange={(e) => setFormData({ ...formData, kilometrageInstallation: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">km</span>
                </div>
              </div>

              {/* Kilométrage actuel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kilométrage actuel</label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.kilometrageActuel}
                    onChange={(e) => setFormData({ ...formData, kilometrageActuel: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">km</span>
                </div>
              </div>

              {/* Profondeur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Profondeur (mm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.profondeur}
                  onChange={(e) => setFormData({ ...formData, profondeur: parseFloat(e.target.value) || 0 })}
                  placeholder="Profondeur de la bande"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Prix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prix}
                    onChange={(e) => setFormData({ ...formData, prix: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Fournisseur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fournisseur</label>
                <input
                  type="text"
                  value={formData.fournisseur}
                  onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                  placeholder="Nom du fournisseur"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Notes supplémentaires (optionnel)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2.5 px-4 rounded-lg hover:bg-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 font-medium"
            >
              {pneu ? 'Modifier le pneu' : 'Créer le pneu'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Formulaire Réparation
function ReparationForm({ 
  reparation, 
  camions, 
  onClose, 
  onSuccess 
}: { 
  reparation: Reparation | null; 
  camions: Camion[]; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const formatDateForInput = (date: Date | Timestamp | string | undefined): string => {
    if (!date) return '';
    try {
      let dateObj: Date;
      if (date instanceof Timestamp) {
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return '';
      }
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    camionId: reparation?.camionId || '',
    date: formatDateForInput(reparation?.date),
    type: reparation?.type || 'preventive' as 'preventive' | 'corrective' | 'revision' | 'diagnostic' | 'autre',
    kilometrage: reparation?.kilometrage || 0,
    description: reparation?.description || '',
    mainOeuvre: reparation?.mainOeuvre || 0,
    piecesUtilisees: reparation?.piecesUtilisees || [] as Array<{ nom: string; reference?: string; quantite: number; prixUnitaire: number; total: number }>,
    coutTotal: reparation?.coutTotal || 0,
    garage: reparation?.garage || '',
    factureNumero: reparation?.factureNumero || '',
    notes: reparation?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculer le coût total si les pièces sont définies
      const totalPieces = formData.piecesUtilisees.reduce((sum, piece) => sum + piece.total, 0);
      const total = formData.mainOeuvre + totalPieces;

      const dataToSave = {
        camionId: formData.camionId,
        date: Timestamp.fromDate(new Date(formData.date)),
        type: formData.type,
        kilometrage: parseFloat(formData.kilometrage.toString()) || 0,
        description: formData.description,
        mainOeuvre: parseFloat(formData.mainOeuvre.toString()) || 0,
        piecesUtilisees: formData.piecesUtilisees,
        coutTotal: total,
        ...(formData.garage && { garage: formData.garage }),
        ...(formData.factureNumero && { factureNumero: formData.factureNumero }),
        ...(formData.notes && { notes: formData.notes }),
      };

      if (reparation) {
        await updateDoc(doc(db, 'reparations', reparation.id), {
          ...dataToSave,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(collection(db, 'reparations'), {
          ...dataToSave,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving reparation:', error);
      alert('Erreur lors de l\'enregistrement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-4 sm:p-6 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-6 h-6 text-primary-600" />
            <span>{reparation ? 'Modifier la réparation' : 'Nouvelle réparation'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations de base */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <History className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Informations de la réparation</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Camion */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Camion <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.camionId}
                  onChange={(e) => setFormData({ ...formData, camionId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">Sélectionner un camion</option>
                  {camions.map((camion) => (
                    <option key={camion.id} value={camion.id}>
                      {camion.matricule} - {camion.marque} {camion.modele}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="preventive">Préventive</option>
                  <option value="corrective">Corrective</option>
                  <option value="revision">Révision</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Kilométrage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kilométrage <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.kilometrage}
                    onChange={(e) => setFormData({ ...formData, kilometrage: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">km</span>
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Description de la réparation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Garage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Garage</label>
                <input
                  type="text"
                  value={formData.garage}
                  onChange={(e) => setFormData({ ...formData, garage: e.target.value })}
                  placeholder="Nom du garage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Numéro de facture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro de facture</label>
                <input
                  type="text"
                  value={formData.factureNumero}
                  onChange={(e) => setFormData({ ...formData, factureNumero: e.target.value })}
                  placeholder="Numéro de facture"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Main d'œuvre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Main d&apos;œuvre <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.mainOeuvre}
                    onChange={(e) => setFormData({ ...formData, mainOeuvre: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Coût total (calculé automatiquement) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Coût total (calculé)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={formatCurrency((formData.piecesUtilisees.reduce((sum, p) => sum + p.total, 0) + formData.mainOeuvre))}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Notes supplémentaires (optionnel)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2.5 px-4 rounded-lg hover:bg-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 font-medium"
            >
              {reparation ? 'Modifier la réparation' : 'Créer la réparation'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

