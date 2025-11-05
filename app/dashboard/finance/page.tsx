'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Depense, Recette, Camion, Chauffeur } from '@/lib/types';
import { Plus, DollarSign, TrendingUp, TrendingDown, Download } from 'lucide-react';
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

      setDepenses(depensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Depense)));
      setRecettes(recettesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recette)));
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
    const monthDepenses = depenses.filter(
      d => new Date(d.date).getMonth() === i && new Date(d.date).getFullYear() === currentYear
    ).reduce((sum, d) => sum + d.montant, 0);
    const monthRecettes = recettes.filter(
      r => new Date(r.date).getMonth() === i && new Date(r.date).getFullYear() === currentYear
    ).reduce((sum, r) => sum + r.montant, 0);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Finance / Comptabilité</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Suivez vos dépenses et recettes</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <button
            onClick={() => setShowDepenseForm(true)}
            className="flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={18} />
            <span>Nouvelle dépense</span>
          </button>
          <button
            onClick={() => setShowRecetteForm(true)}
            className="flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={18} />
            <span>Nouvelle recette</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 sm:space-x-4 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Vue d&apos;ensemble
        </button>
        <button
          onClick={() => setActiveTab('depenses')}
          className={`py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap ${activeTab === 'depenses' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Dépenses
        </button>
        <button
          onClick={() => setActiveTab('recettes')}
          className={`py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap ${activeTab === 'recettes' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Recettes
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Financial Summary Cards */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Recettes</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{formatCurrency(totalRecettes)}</p>
              </div>
              <TrendingUp className="text-green-500 w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Dépenses</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-2">{formatCurrency(totalDepenses)}</p>
              </div>
              <TrendingDown className="text-red-500 w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Profit Net</p>
                <p className={`text-2xl sm:text-3xl font-bold mt-2 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</p>
              </div>
              <DollarSign className={`w-8 h-8 sm:w-10 sm:h-10 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </div>

          {/* Monthly Profit Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Profit Mensuel ({currentYear})</h2>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" minWidth={300} height={250} className="sm:min-h-[300px]">
                <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label: string) => `Mois: ${label}`}
                    contentStyle={{ fontSize: '12px', padding: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="profit" name="Profit" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expenses by Type Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Dépenses par Type</h2>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" minWidth={250} height={250} className="sm:min-h-[300px]">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ fontSize: '12px', padding: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'depenses' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 p-4 sm:p-6 pb-0">Liste des Dépenses</h2>
          {/* Table des dépenses */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {depenses.map((depense) => (
                    <tr key={depense.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {formatDate(depense.date)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                        {depense.type}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-red-600">
                        {formatCurrency(depense.montant)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 hidden md:table-cell">
                        <div className="max-w-xs truncate">{depense.description}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <button
                          onClick={() => handleDeleteDepense(depense.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recettes' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 p-4 sm:p-6 pb-0">Liste des Recettes</h2>
          {/* Table des recettes */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recettes.map((recette) => (
                    <tr key={recette.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {formatDate(recette.date)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        <div className="max-w-xs truncate">{recette.description}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-green-600">
                        {formatCurrency(recette.montant)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <button
                          onClick={() => handleDeleteRecette(recette.id)}
                          className="text-red-600 hover:text-red-900 focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                          aria-label="Supprimer cette recette"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
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
          onClose={() => setShowDepenseForm(false)}
          onSuccess={async () => {
            setShowDepenseForm(false);
            await loadData();
          }}
        />
      )}

      {showRecetteForm && (
        <RecetteForm
          onClose={() => setShowRecetteForm(false)}
          onSuccess={async () => {
            setShowRecetteForm(false);
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
  onClose,
  onSuccess,
}: {
  camions: Camion[];
  chauffeurs: Chauffeur[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    type: 'carburant' as Depense['type'],
    montant: 0,
    description: '',
    camionId: '',
    chauffeurId: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'depenses'), {
        ...formData,
        montant: parseFloat(formData.montant.toString()),
        date: new Date(formData.date),
        camionId: formData.camionId || undefined,
        chauffeurId: formData.chauffeurId || undefined,
        createdAt: new Date(),
      });
      onSuccess();
    } catch (error) {
      console.error('Error saving depense:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ajouter une dépense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="carburant">Carburant</option>
              <option value="entretien">Entretien</option>
              <option value="salaire">Salaire</option>
              <option value="achat">Achat</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
            <input
              type="number"
              step="0.01"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Camion (optionnel)</label>
              <select
                value={formData.camionId}
                onChange={(e) => setFormData({ ...formData, camionId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Chauffeur (optionnel)</label>
              <select
                value={formData.chauffeurId}
                onChange={(e) => setFormData({ ...formData, chauffeurId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecetteForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    montant: 0,
    description: '',
    client: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'recettes'), {
        ...formData,
        montant: parseFloat(formData.montant.toString()),
        date: new Date(formData.date),
        createdAt: new Date(),
      });
      onSuccess();
    } catch (error) {
      console.error('Error saving recette:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Nouvelle recette</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
            <input
              type="number"
              step="0.01"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client (optionnel)</label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

