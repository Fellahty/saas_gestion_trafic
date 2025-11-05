'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Chauffeur, Absence } from '@/lib/types';
import { Plus, Edit, Trash2, Users, Calendar, AlertCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function ChauffeursPage() {
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedChauffeur, setSelectedChauffeur] = useState<Chauffeur | null>(null);
  const [activeTab, setActiveTab] = useState<'chauffeurs' | 'absences'>('chauffeurs');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [chauffeursSnap, absencesSnap] = await Promise.all([
        getDocs(collection(db, 'chauffeurs')),
        getDocs(collection(db, 'absences')),
      ]);

      setChauffeurs(chauffeursSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chauffeur)));
      setAbsences(absencesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Absence)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChauffeur = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) {
      try {
        await deleteDoc(doc(db, 'chauffeurs', id));
        setChauffeurs(chauffeurs.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting chauffeur:', error);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chauffeurs</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Gestion des chauffeurs et absences</p>
        </div>
        <button
          onClick={() => {
            setSelectedChauffeur(null);
            setShowForm(true);
          }}
          className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Nouveau chauffeur</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap space-x-2 sm:space-x-4 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chauffeurs')}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${
            activeTab === 'chauffeurs'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Chauffeurs</span>
        </button>
        <button
          onClick={() => setActiveTab('absences')}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 border-b-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${
            activeTab === 'absences'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Absences</span>
        </button>
      </div>

      {/* Chauffeurs Tab */}
      {activeTab === 'chauffeurs' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Téléphone</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Permis</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Salaire</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chauffeurs.map((chauffeur) => (
                    <tr key={chauffeur.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        <div className="sm:hidden">
                          <div>{chauffeur.prenom} {chauffeur.nom}</div>
                          <div className="text-xs text-gray-500 mt-1">{chauffeur.telephone}</div>
                          <div className="text-xs text-gray-500 mt-1">Permis: {chauffeur.permis || 'N/A'} • Salaire: {formatCurrency(chauffeur.salaire)}</div>
                        </div>
                        <span className="hidden sm:inline">{chauffeur.prenom} {chauffeur.nom}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                        {chauffeur.telephone}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                        {chauffeur.permis}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                        {formatCurrency(chauffeur.salaire)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedChauffeur(chauffeur);
                              setShowForm(true);
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                          <button
                            onClick={() => handleDeleteChauffeur(chauffeur.id)}
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

      {/* Absences Tab */}
      {activeTab === 'absences' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chauffeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {absences.map((absence) => {
                  const chauffeur = chauffeurs.find(c => c.id === absence.chauffeurId);
                  return (
                    <tr key={absence.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            absence.type === 'conge'
                              ? 'bg-blue-100 text-blue-800'
                              : absence.type === 'maladie'
                              ? 'bg-yellow-100 text-yellow-800'
                              : absence.type === 'accident'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {absence.type === 'conge'
                            ? 'Congé'
                            : absence.type === 'maladie'
                            ? 'Maladie'
                            : absence.type === 'accident'
                            ? 'Accident'
                            : 'Autre'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(absence.dateDebut)} - {formatDate(absence.dateFin)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {absence.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ChauffeurForm
          chauffeur={selectedChauffeur}
          onClose={() => {
            setShowForm(false);
            setSelectedChauffeur(null);
          }}
          onSuccess={async () => {
            setShowForm(false);
            setSelectedChauffeur(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

function ChauffeurForm({ chauffeur, onClose, onSuccess }: { chauffeur: Chauffeur | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    nom: chauffeur?.nom || '',
    prenom: chauffeur?.prenom || '',
    email: chauffeur?.email || '',
    telephone: chauffeur?.telephone || '',
    permis: chauffeur?.permis || '',
    dateObtentionPermis: chauffeur?.dateObtentionPermis ? (chauffeur.dateObtentionPermis instanceof Date ? chauffeur.dateObtentionPermis.toISOString().split('T')[0] : new Date(chauffeur.dateObtentionPermis).toISOString().split('T')[0]) : '',
    typeContrat: chauffeur?.typeContrat || 'cdi',
    salaire: chauffeur?.salaire || 0,
    dateEmbauche: chauffeur?.dateEmbauche ? (chauffeur.dateEmbauche instanceof Date ? chauffeur.dateEmbauche.toISOString().split('T')[0] : new Date(chauffeur.dateEmbauche).toISOString().split('T')[0]) : '',
    actif: chauffeur?.actif !== undefined ? chauffeur.actif : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (chauffeur) {
        await updateDoc(doc(db, 'chauffeurs', chauffeur.id), {
          ...formData,
          dateObtentionPermis: new Date(formData.dateObtentionPermis),
          dateEmbauche: new Date(formData.dateEmbauche),
          salaire: parseFloat(formData.salaire.toString()),
        });
      } else {
        await addDoc(collection(db, 'chauffeurs'), {
          ...formData,
          dateObtentionPermis: new Date(formData.dateObtentionPermis),
          dateEmbauche: new Date(formData.dateEmbauche),
          salaire: parseFloat(formData.salaire.toString()),
          createdAt: new Date(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving chauffeur:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 my-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {chauffeur ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de permis</label>
              <input
                type="text"
                value={formData.permis}
                onChange={(e) => setFormData({ ...formData, permis: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;obtention du permis</label>
              <input
                type="date"
                value={formData.dateObtentionPermis}
                onChange={(e) => setFormData({ ...formData, dateObtentionPermis: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
              <select
                value={formData.typeContrat}
                onChange={(e) => setFormData({ ...formData, typeContrat: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="cdi">CDI</option>
                <option value="cdd">CDD</option>
                <option value="interim">Intérim</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salaire</label>
              <input
                type="number"
                step="0.01"
                value={formData.salaire}
                onChange={(e) => setFormData({ ...formData, salaire: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;embauche</label>
            <input
              type="date"
              value={formData.dateEmbauche}
              onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Actif</span>
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              {chauffeur ? 'Modifier' : 'Créer'}
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

