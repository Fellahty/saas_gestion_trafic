'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Depense, Recette, Camion, Chauffeur } from '@/lib/types';
import { Plus, DollarSign, TrendingUp, TrendingDown, Download, Trash2, Calendar, FileText, ArrowUpRight, ArrowDownRight, Edit2, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function FinancePage() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [camions, setCamions] = useState<Camion[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'depenses' | 'recettes'>('overview');
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [showRecetteForm, setShowRecetteForm] = useState(false);
  const [editingDepense, setEditingDepense] = useState<Depense | null>(null);
  const [editingRecette, setEditingRecette] = useState<Recette | null>(null);
  const [depenseSortField, setDepenseSortField] = useState<'date' | 'montant' | 'type'>('date');
  const [depenseSortDirection, setDepenseSortDirection] = useState<'asc' | 'desc'>('desc');
  const [recetteSortField, setRecetteSortField] = useState<'date' | 'montant' | 'description'>('date');
  const [recetteSortDirection, setRecetteSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [depensesSnap, recettesSnap, camionsSnap, chauffeursSnap] = await Promise.all([
        getDocs(collection(db, 'depenses')),
        getDocs(collection(db, 'recettes')),
        getDocs(collection(db, 'camions')),
        getDocs(collection(db, 'chauffeurs')),
      ]);

      // Convert Firestore Timestamps to Date objects
      const convertTimestamp = (timestamp: any): Date => {
        if (!timestamp) return new Date();
        if (timestamp instanceof Date && !isNaN(timestamp.getTime())) return timestamp;
        if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (typeof timestamp === 'string' || typeof timestamp === 'number') {
          const date = new Date(timestamp);
          return isNaN(date.getTime()) ? new Date() : date;
        }
        return new Date();
      };

      setDepenses(depensesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: convertTimestamp(data.date),
          createdAt: convertTimestamp(data.createdAt),
        } as Depense;
      }));
      setRecettes(recettesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: convertTimestamp(data.date),
          createdAt: convertTimestamp(data.createdAt),
        } as Recette;
      }));
      setCamions(camionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Camion)));
      setChauffeurs(chauffeursSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chauffeur)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);
  const totalRecettes = recettes.reduce((sum, r) => sum + r.montant, 0);
  const profit = totalRecettes - totalDepenses;

  // Monthly data
  const currentYear = new Date().getFullYear();
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(currentYear, i, 1);
    
    // Helper function to safely get date
    const getDate = (date: Date | any): Date => {
      if (date instanceof Date && !isNaN(date.getTime())) {
        return date;
      }
      if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
        return date.toDate();
      }
      const d = new Date(date);
      return isNaN(d.getTime()) ? new Date() : d;
    };
    
    const monthDepenses = depenses.filter(d => {
      const date = getDate(d.date);
      return date.getMonth() === i && date.getFullYear() === currentYear;
    }).reduce((sum, d) => sum + d.montant, 0);
    
    const monthRecettes = recettes.filter(r => {
      const date = getDate(r.date);
      return date.getMonth() === i && date.getFullYear() === currentYear;
    }).reduce((sum, r) => sum + r.montant, 0);

    return {
      month: month.toLocaleDateString('fr-FR', { month: 'short' }),
      depenses: monthDepenses,
      recettes: monthRecettes,
      profit: monthRecettes - monthDepenses,
    };
  });

  // Expenses by type
  const depensesByType = depenses.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + d.montant;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(depensesByType).map(([name, value], index) => ({
    name: name === 'carburant' ? 'Carburant' : name === 'entretien' ? 'Entretien' : name === 'salaire' ? 'Salaires' : name === 'achat' ? 'Achats' : 'Autre',
    value,
    color: COLORS[index % COLORS.length],
  }));

  const handleEditDepense = (depense: Depense) => {
    setEditingDepense(depense);
    setShowDepenseForm(true);
  };

  const handleEditRecette = (recette: Recette) => {
    setEditingRecette(recette);
    setShowRecetteForm(true);
  };

  const handleDeleteDepense = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      try {
        await deleteDoc(doc(db, 'depenses', id));
        setDepenses(depenses.filter(d => d.id !== id));
      } catch (error) {
        console.error('Error deleting depense:', error);
      }
    }
  };

  const handleDeleteRecette = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
      try {
        await deleteDoc(doc(db, 'recettes', id));
        setRecettes(recettes.filter(r => r.id !== id));
      } catch (error) {
        console.error('Error deleting recette:', error);
      }
    }
  };

  const toggleDepenseSortDirection = () => {
    setDepenseSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const toggleRecetteSortDirection = () => {
    setRecetteSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const getComparableDate = (value: Date | any): number => {
    if (value instanceof Date) {
      return value.getTime();
    }
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      return value.toDate().getTime();
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const compareStrings = (a: string, b: string) => a.localeCompare(b, 'fr', { sensitivity: 'base' });

  const sortedDepenses = [...depenses].sort((a, b) => {
    let comparison = 0;

    switch (depenseSortField) {
      case 'montant':
        comparison = a.montant - b.montant;
        break;
      case 'type':
        comparison = compareStrings(a.type || '', b.type || '');
        break;
      case 'date':
      default:
        comparison = getComparableDate(a.date) - getComparableDate(b.date);
        break;
    }

    return depenseSortDirection === 'asc' ? comparison : -comparison;
  });

  const sortedRecettes = [...recettes].sort((a, b) => {
    let comparison = 0;

    switch (recetteSortField) {
      case 'montant':
        comparison = a.montant - b.montant;
        break;
      case 'description':
        comparison = compareStrings(a.description || '', b.description || '');
        break;
      case 'date':
      default:
        comparison = getComparableDate(a.date) - getComparableDate(b.date);
        break;
    }

    return recetteSortDirection === 'asc' ? comparison : -comparison;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
          <p className="text-gray-600 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 sm:space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Finance / Comptabilité
          </h1>
          <p className="text-gray-500 text-sm sm:text-base flex items-center gap-2">
            <FileText size={16} />
            Suivez vos dépenses et recettes en temps réel
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingDepense(null);
              setShowDepenseForm(true);
            }}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base w-full sm:w-auto font-semibold"
          >
            <Plus size={20} />
            <span>Nouvelle dépense</span>
          </button>
          <button
            onClick={() => {
              setEditingRecette(null);
              setShowRecetteForm(true);
            }}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base w-full sm:w-auto font-semibold"
          >
            <Plus size={20} />
            <span>Nouvelle recette</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 sm:space-x-2 bg-white rounded-xl shadow-md p-2 border border-gray-100 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 sm:px-6 text-sm font-semibold whitespace-nowrap rounded-lg transition-all duration-200 ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg transform scale-105'
              : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
          }`}
        >
          Vue d&apos;ensemble
        </button>
        <button
          onClick={() => setActiveTab('depenses')}
          className={`py-3 px-4 sm:px-6 text-sm font-semibold whitespace-nowrap rounded-lg transition-all duration-200 ${
            activeTab === 'depenses'
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg transform scale-105'
              : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
          }`}
        >
          Dépenses
        </button>
        <button
          onClick={() => setActiveTab('recettes')}
          className={`py-3 px-4 sm:px-6 text-sm font-semibold whitespace-nowrap rounded-lg transition-all duration-200 ${
            activeTab === 'recettes'
              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg transform scale-105'
              : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
          }`}
        >
          Recettes
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Summary Cards */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="space-y-2 max-w-full sm:max-w-[70%] min-w-0">
                <p className="text-[11px] sm:text-sm font-semibold text-green-700 uppercase tracking-wide">Total Recettes</p>
                <p className="text-xl sm:text-3xl lg:text-4xl font-bold text-green-600 leading-tight break-words text-balance">{formatCurrency(totalRecettes)}</p>
                <div className="flex items-center gap-1.5 text-green-600 text-[11px] sm:text-sm font-medium">
                  <ArrowUpRight size={14} className="shrink-0" />
                  <span>Revenus</span>
                </div>
              </div>
              <div className="self-start sm:self-center bg-green-100 p-3 sm:p-4 rounded-xl flex-shrink-0">
                <TrendingUp className="text-green-600 w-7 h-7 sm:w-10 sm:h-10" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl shadow-lg p-6 border border-red-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="space-y-2 max-w-full sm:max-w-[70%] min-w-0">
                <p className="text-[11px] sm:text-sm font-semibold text-red-700 uppercase tracking-wide">Total Dépenses</p>
                <p className="text-xl sm:text-3xl lg:text-4xl font-bold text-red-600 leading-tight break-words text-balance">{formatCurrency(totalDepenses)}</p>
                <div className="flex items-center gap-1.5 text-red-600 text-[11px] sm:text-sm font-medium">
                  <ArrowDownRight size={14} className="shrink-0" />
                  <span>Charges</span>
                </div>
              </div>
              <div className="self-start sm:self-center bg-red-100 p-3 sm:p-4 rounded-xl flex-shrink-0">
                <TrendingDown className="text-red-600 w-7 h-7 sm:w-10 sm:h-10" />
              </div>
            </div>
          </div>
          
          <div className={`bg-gradient-to-br ${profit >= 0 ? 'from-blue-50 to-cyan-50' : 'from-orange-50 to-amber-50'} rounded-2xl shadow-lg p-6 border ${profit >= 0 ? 'border-blue-100' : 'border-orange-100'} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="space-y-2 max-w-full sm:max-w-[70%] min-w-0">
                <p className={`text-[11px] sm:text-sm font-semibold ${profit >= 0 ? 'text-blue-700' : 'text-orange-700'} uppercase tracking-wide`}>Profit Net</p>
                <p className={`text-xl sm:text-3xl lg:text-4xl font-bold leading-tight break-words text-balance ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</p>
                <div className={`flex items-center gap-1.5 text-[11px] sm:text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profit >= 0 ? <ArrowUpRight size={14} className="shrink-0" /> : <ArrowDownRight size={14} className="shrink-0" />}
                  <span>{profit >= 0 ? 'Bénéfice' : 'Perte'}</span>
                </div>
              </div>
              <div className={`self-start sm:self-center p-3 sm:p-4 rounded-xl flex-shrink-0 ${profit >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                <DollarSign className={`w-7 h-7 sm:w-10 sm:h-10 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>

          {/* Monthly Profit Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-primary-600" size={24} />
                Profit Mensuel ({currentYear})
              </h2>
            </div>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" minWidth={300} height={300} className="sm:min-h-[350px]">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label: string) => `Mois: ${label}`}
                    contentStyle={{ 
                      fontSize: '14px', 
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
                  <Bar 
                    dataKey="profit" 
                    name="Profit" 
                    fill="url(#colorProfit)"
                    radius={[8, 8, 0, 0]}
                  >
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expenses by Type Pie Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="text-primary-600" size={24} />
              Dépenses par Type
            </h2>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" minWidth={250} height={300} className="sm:min-h-[350px]">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      fontSize: '14px', 
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'depenses' && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-red-50 to-rose-50 px-6 py-4 border-b border-red-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingDown className="text-red-600" size={24} />
                  Liste des Dépenses
                </h2>
                <p className="text-sm text-gray-600 mt-1">{depenses.length} dépense{depenses.length > 1 ? 's' : ''} enregistrée{depenses.length > 1 ? 's' : ''}</p>
              </div>
              {depenses.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <div className="flex items-center gap-2 bg-white/70 border border-red-100 rounded-lg px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-600">Trier par</span>
                    <select
                      value={depenseSortField}
                      onChange={(event) => setDepenseSortField(event.target.value as 'date' | 'montant' | 'type')}
                      className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
                    >
                      <option value="date">Date</option>
                      <option value="montant">Montant</option>
                      <option value="type">Type</option>
                    </select>
                  </div>
                  <button
                    onClick={toggleDepenseSortDirection}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-100 bg-white/80 text-red-600 hover:bg-red-100 transition-colors"
                    title={`Ordre ${depenseSortDirection === 'asc' ? 'croissant' : 'décroissant'}`}
                    type="button"
                  >
                    {depenseSortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span>{depenseSortDirection === 'asc' ? 'Croissant' : 'Décroissant'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Table des dépenses */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Type</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Montant</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">Description</th>
                    <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {depenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <FileText size={48} className="mb-4 opacity-50" />
                          <p className="text-lg font-medium">Aucune dépense enregistrée</p>
                          <p className="text-sm mt-1">Commencez par ajouter une nouvelle dépense</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedDepenses.map((depense) => (
                      <tr key={depense.id} className="hover:bg-gradient-to-r hover:from-red-50 hover:to-transparent transition-colors duration-150">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="text-gray-400" size={16} />
                            <span className="text-sm font-medium text-gray-900">{formatDate(depense.date)}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            {depense.type}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-red-600">{formatCurrency(depense.montant)}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 hidden md:table-cell">
                          <div className="max-w-xs truncate">{depense.description}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditDepense(depense)}
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                              <span className="hidden sm:inline">Modifier</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDepense(depense.id)}
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-150"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                              <span className="hidden sm:inline">Supprimer</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recettes' && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={24} />
                  Liste des Recettes
                </h2>
                <p className="text-sm text-gray-600 mt-1">{recettes.length} recette{recettes.length > 1 ? 's' : ''} enregistrée{recettes.length > 1 ? 's' : ''}</p>
              </div>
              {recettes.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <div className="flex items-center gap-2 bg-white/70 border border-green-100 rounded-lg px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-green-600">Trier par</span>
                    <select
                      value={recetteSortField}
                      onChange={(event) => setRecetteSortField(event.target.value as 'date' | 'montant' | 'description')}
                      className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
                    >
                      <option value="date">Date</option>
                      <option value="montant">Montant</option>
                      <option value="description">Description</option>
                    </select>
                  </div>
                  <button
                    onClick={toggleRecetteSortDirection}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-100 bg-white/80 text-green-600 hover:bg-green-100 transition-colors"
                    title={`Ordre ${recetteSortDirection === 'asc' ? 'croissant' : 'décroissant'}`}
                    type="button"
                  >
                    {recetteSortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span>{recetteSortDirection === 'asc' ? 'Croissant' : 'Décroissant'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Table des recettes */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Description</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Montant</th>
                    <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {recettes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <FileText size={48} className="mb-4 opacity-50" />
                          <p className="text-lg font-medium">Aucune recette enregistrée</p>
                          <p className="text-sm mt-1">Commencez par ajouter une nouvelle recette</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedRecettes.map((recette) => (
                      <tr key={recette.id} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-transparent transition-colors duration-150">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="text-gray-400" size={16} />
                            <span className="text-sm font-medium text-gray-900">{formatDate(recette.date)}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                          <div className="max-w-xs truncate">{recette.description}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-green-600">{formatCurrency(recette.montant)}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditRecette(recette)}
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                              <span className="hidden sm:inline">Modifier</span>
                            </button>
                            <button
                              onClick={() => handleDeleteRecette(recette.id)}
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-150"
                              title="Supprimer"
                              aria-label="Supprimer cette recette"
                            >
                              <Trash2 size={16} />
                              <span className="hidden sm:inline">Supprimer</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Forms */}
      {showDepenseForm && (
        <DepenseForm
          camions={camions}
          chauffeurs={chauffeurs}
          editingDepense={editingDepense}
          onClose={() => {
            setShowDepenseForm(false);
            setEditingDepense(null);
          }}
          onSuccess={async () => {
            setShowDepenseForm(false);
            setEditingDepense(null);
            await loadData();
          }}
        />
      )}

      {showRecetteForm && (
        <RecetteForm
          editingRecette={editingRecette}
          onClose={() => {
            setShowRecetteForm(false);
            setEditingRecette(null);
          }}
          onSuccess={async () => {
            setShowRecetteForm(false);
            setEditingRecette(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

function DepenseForm({
  camions,
  chauffeurs,
  editingDepense,
  onClose,
  onSuccess,
}: {
  camions: Camion[];
  chauffeurs: Chauffeur[];
  editingDepense: Depense | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!editingDepense;
  
  const getInitialFormData = () => {
    if (editingDepense) {
      const date = editingDepense.date instanceof Date 
        ? editingDepense.date.toISOString().split('T')[0]
        : editingDepense.date && typeof editingDepense.date === 'object' && 'toDate' in editingDepense.date
        ? editingDepense.date.toDate().toISOString().split('T')[0]
        : new Date(editingDepense.date).toISOString().split('T')[0];
      
      return {
        type: editingDepense.type || 'carburant',
        montant: editingDepense.montant || 0,
        description: editingDepense.description || '',
        camionId: editingDepense.camionId || '',
        chauffeurId: editingDepense.chauffeurId || '',
        date: date,
      };
    }
    return {
      type: 'carburant' as Depense['type'],
      montant: 0,
      description: '',
      camionId: '',
      chauffeurId: '',
      date: new Date().toISOString().split('T')[0],
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (editingDepense) {
      const date = editingDepense.date instanceof Date 
        ? editingDepense.date.toISOString().split('T')[0]
        : editingDepense.date && typeof editingDepense.date === 'object' && 'toDate' in editingDepense.date
        ? editingDepense.date.toDate().toISOString().split('T')[0]
        : new Date(editingDepense.date).toISOString().split('T')[0];
      
      setFormData({
        type: editingDepense.type || 'carburant',
        montant: editingDepense.montant || 0,
        description: editingDepense.description || '',
        camionId: editingDepense.camionId || '',
        chauffeurId: editingDepense.chauffeurId || '',
        date: date,
      });
    } else {
      setFormData({
        type: 'carburant' as Depense['type'],
        montant: 0,
        description: '',
        camionId: '',
        chauffeurId: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [editingDepense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        montant: parseFloat(formData.montant.toString()),
        date: new Date(formData.date),
        camionId: formData.camionId || undefined,
        chauffeurId: formData.chauffeurId || undefined,
      };

      if (isEditing && editingDepense) {
        // Update existing dépense
        await updateDoc(doc(db, 'depenses', editingDepense.id), dataToSave);
      } else {
        // Create new dépense
        await addDoc(collection(db, 'depenses'), {
          ...dataToSave,
          createdAt: new Date(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving depense:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="text-red-600" size={24} />
            {isEditing ? 'Modifier la dépense' : 'Ajouter une dépense'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300"
            >
              <option value="carburant">Carburant</option>
              <option value="entretien">Entretien</option>
              <option value="salaire">Salaire</option>
              <option value="achat">Achat</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Montant</label>
            <input
              type="number"
              step="0.01"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300 resize-none"
              placeholder="Décrivez la dépense..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Camion (optionnel)</label>
              <select
                value={formData.camionId}
                onChange={(e) => setFormData({ ...formData, camionId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300"
              >
                <option value="">Aucun</option>
                {camions.map((camion) => (
                  <option key={camion.id} value={camion.id}>
                    {camion.matricule}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Chauffeur (optionnel)</label>
              <select
                value={formData.chauffeurId}
                onChange={(e) => setFormData({ ...formData, chauffeurId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300"
              >
                <option value="">Aucun</option>
                {chauffeurs.map((chauffeur) => (
                  <option key={chauffeur.id} value={chauffeur.id}>
                    {chauffeur.prenom} {chauffeur.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300"
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold transform hover:-translate-y-0.5"
            >
              {isEditing ? 'Mettre à jour' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecetteForm({ 
  editingRecette, 
  onClose, 
  onSuccess 
}: { 
  editingRecette: Recette | null; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const isEditing = !!editingRecette;
  
  const getInitialFormData = () => {
    if (editingRecette) {
      const date = editingRecette.date instanceof Date 
        ? editingRecette.date.toISOString().split('T')[0]
        : editingRecette.date && typeof editingRecette.date === 'object' && 'toDate' in editingRecette.date
        ? editingRecette.date.toDate().toISOString().split('T')[0]
        : new Date(editingRecette.date).toISOString().split('T')[0];
      
      return {
        montant: editingRecette.montant || 0,
        description: editingRecette.description || '',
        client: (editingRecette as any)?.client || '',
        date: date,
      };
    }
    return {
      montant: 0,
      description: '',
      client: '',
      date: new Date().toISOString().split('T')[0],
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (editingRecette) {
      const date = editingRecette.date instanceof Date 
        ? editingRecette.date.toISOString().split('T')[0]
        : editingRecette.date && typeof editingRecette.date === 'object' && 'toDate' in editingRecette.date
        ? editingRecette.date.toDate().toISOString().split('T')[0]
        : new Date(editingRecette.date).toISOString().split('T')[0];
      
      setFormData({
        montant: editingRecette.montant || 0,
        description: editingRecette.description || '',
        client: (editingRecette as any)?.client || '',
        date: date,
      });
    } else {
      setFormData({
        montant: 0,
        description: '',
        client: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [editingRecette]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        montant: parseFloat(formData.montant.toString()),
        date: new Date(formData.date),
      };

      if (isEditing && editingRecette) {
        // Update existing recette
        await updateDoc(doc(db, 'recettes', editingRecette.id), dataToSave);
      } else {
        // Create new recette
        await addDoc(collection(db, 'recettes'), {
          ...dataToSave,
          createdAt: new Date(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving recette:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-green-600" size={24} />
            {isEditing ? 'Modifier la recette' : 'Nouvelle recette'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Montant</label>
            <input
              type="number"
              step="0.01"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300 resize-none"
              placeholder="Décrivez la recette..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Client (optionnel)</label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300"
              placeholder="Nom du client..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300"
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold transform hover:-translate-y-0.5"
            >
              {isEditing ? 'Mettre à jour' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

