'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Stock, MouvementStock } from '@/lib/types';
import { Plus, Edit, Trash2, Package, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function StockPage() {
  const [stock, setStock] = useState<Stock[]>([]);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMouvementForm, setShowMouvementForm] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [activeTab, setActiveTab] = useState<'stock' | 'mouvements' | 'alertes'>('stock');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stockSnap, mouvementsSnap] = await Promise.all([
        getDocs(collection(db, 'stock')),
        getDocs(collection(db, 'mouvementsStock')),
      ]);

      setStock(stockSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stock)));
      setMouvements(mouvementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MouvementStock)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStock = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article du stock ?')) {
      try {
        await deleteDoc(doc(db, 'stock', id));
        setStock(stock.filter(s => s.id !== id));
      } catch (error) {
        console.error('Error deleting stock:', error);
      }
    }
  };

  const stockAlerte = stock.filter(s => s.quantite <= s.seuilAlerte);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement du stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stock / Magasin</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Gérez votre stock et vos mouvements</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedStock(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={18} />
            <span>Nouvel article</span>
          </button>
          <button
            onClick={() => setShowMouvementForm(true)}
            className="flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={18} />
            <span>Mouvement</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap space-x-2 sm:space-x-4 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${
            activeTab === 'stock'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Stock</span>
        </button>
        <button
          onClick={() => setActiveTab('mouvements')}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${
            activeTab === 'mouvements'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowUp size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Mouvements</span>
        </button>
        <button
          onClick={() => setActiveTab('alertes')}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${
            activeTab === 'alertes'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Alertes ({stockAlerte.length})</span>
        </button>
      </div>

      {/* Stock Tab */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Seuil</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Prix unitaire</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stock.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 ${item.quantite <= item.seuilAlerte ? 'bg-red-50' : ''}`}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        <div className="sm:hidden">
                          <div>{item.nom}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.type}</div>
                          <div className="text-xs text-gray-500 mt-1">Seuil: {item.seuilAlerte} • Prix: {formatCurrency(item.prixUnitaire)}</div>
                        </div>
                        <span className="hidden sm:inline">{item.nom}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                        {item.type}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                        <span className={`font-medium ${item.quantite <= item.seuilAlerte ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.quantite}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                        {item.seuilAlerte}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                        {formatCurrency(item.prixUnitaire)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedStock(item);
                              setShowForm(true);
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                          <button
                            onClick={() => handleDeleteStock(item.id)}
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

      {/* Mouvements Tab */}
      {activeTab === 'mouvements' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raison
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mouvements.map((mouvement) => {
                  const stockItem = stock.find(s => s.id === mouvement.stockId);
                  return (
                    <tr key={mouvement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(mouvement.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stockItem?.nom || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            mouvement.type === 'entree'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {mouvement.type === 'entree' ? 'Entrée' : 'Sortie'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {mouvement.quantite}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {mouvement.raison}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alertes Tab */}
      {activeTab === 'alertes' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité actuelle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seuil d&apos;alerte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockAlerte.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-900">
                      {item.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.type === 'piece_rechange' ? 'Pièce de rechange' : item.type === 'pneu' ? 'Pneu' : item.type === 'huile' ? 'Huile' : item.type === 'filtre' ? 'Filtre' : 'Autre'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                      {item.quantite}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.seuilAlerte}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedStock(item);
                          setShowMouvementForm(true);
                        }}
                        className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                      >
                        <ArrowUp size={16} />
                        <span>Réapprovisionner</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Forms */}
      {showForm && (
        <StockForm
          stock={selectedStock}
          onClose={() => {
            setShowForm(false);
            setSelectedStock(null);
          }}
          onSuccess={async () => {
            setShowForm(false);
            setSelectedStock(null);
            await loadData();
          }}
        />
      )}

      {showMouvementForm && selectedStock && (
        <MouvementForm
          stock={selectedStock}
          onClose={() => {
            setShowMouvementForm(false);
            setSelectedStock(null);
          }}
          onSuccess={async () => {
            setShowMouvementForm(false);
            setSelectedStock(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

function StockForm({ stock, onClose, onSuccess }: { stock: Stock | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    nom: stock?.nom || '',
    type: stock?.type || 'piece_rechange',
    quantite: stock?.quantite || 0,
    seuilAlerte: stock?.seuilAlerte || 10,
    prixUnitaire: stock?.prixUnitaire || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (stock) {
        await updateDoc(doc(db, 'stock', stock.id), {
          ...formData,
          quantite: parseFloat(formData.quantite.toString()),
          seuilAlerte: parseFloat(formData.seuilAlerte.toString()),
          prixUnitaire: parseFloat(formData.prixUnitaire.toString()),
        });
      } else {
        await addDoc(collection(db, 'stock'), {
          ...formData,
          quantite: parseFloat(formData.quantite.toString()),
          seuilAlerte: parseFloat(formData.seuilAlerte.toString()),
          prixUnitaire: parseFloat(formData.prixUnitaire.toString()),
          createdAt: new Date(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving stock:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {stock ? 'Modifier l\'article' : 'Nouvel article'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="piece_rechange">Pièce de rechange</option>
              <option value="pneu">Pneu</option>
              <option value="huile">Huile</option>
              <option value="filtre">Filtre</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d&apos;alerte</label>
              <input
                type="number"
                step="0.01"
                value={formData.seuilAlerte}
                onChange={(e) => setFormData({ ...formData, seuilAlerte: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire</label>
            <input
              type="number"
              step="0.01"
              value={formData.prixUnitaire}
              onChange={(e) => setFormData({ ...formData, prixUnitaire: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              {stock ? 'Modifier' : 'Créer'}
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

function MouvementForm({ stock, onClose, onSuccess }: { stock: Stock; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    type: 'entree' as 'entree' | 'sortie',
    quantite: 0,
    raison: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nouvelleQuantite = formData.type === 'entree'
        ? stock.quantite + formData.quantite
        : stock.quantite - formData.quantite;

      if (formData.type === 'sortie' && nouvelleQuantite < 0) {
        alert('Quantité insuffisante en stock');
        return;
      }

      // Mettre à jour le stock
      await updateDoc(doc(db, 'stock', stock.id), {
        quantite: nouvelleQuantite,
      });

      // Créer le mouvement
      await addDoc(collection(db, 'mouvementsStock'), {
        stockId: stock.id,
        type: formData.type,
        quantite: formData.quantite,
        raison: formData.raison,
        date: new Date(formData.date),
        createdAt: new Date(),
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving mouvement:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Mouvement de stock - {stock.nom}
        </h2>
        <p className="text-sm text-gray-600 mb-4">Quantité actuelle: {stock.quantite}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="entree">Entrée</option>
              <option value="sortie">Sortie</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <input
              type="number"
              step="0.01"
              value={formData.quantite}
              onChange={(e) => setFormData({ ...formData, quantite: parseFloat(e.target.value) || 0 })}
              required
              min="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
            <textarea
              value={formData.raison}
              onChange={(e) => setFormData({ ...formData, raison: e.target.value })}
              required
              rows={3}
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

