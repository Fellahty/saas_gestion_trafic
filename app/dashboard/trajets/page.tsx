'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Mission, Camion, Chauffeur } from '@/lib/types';
import { Plus, Edit, Trash2, MapPin, CheckCircle, Map, Filter } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import MissionMap from '@/components/MissionMap';

export default function TrajetsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [camions, setCamions] = useState<Camion[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterCamion, setFilterCamion] = useState<string>('all');
  const [filterChauffeur, setFilterChauffeur] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [missionsSnap, camionsSnap, chauffeursSnap] = await Promise.all([
        getDocs(collection(db, 'missions')),
        getDocs(collection(db, 'camions')),
        getDocs(collection(db, 'chauffeurs')),
      ]);

      setMissions(missionsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateDebut: data.dateDebut instanceof Timestamp ? data.dateDebut.toDate() : (data.dateDebut ? new Date(data.dateDebut) : new Date()),
          dateFin: data.dateFin instanceof Timestamp ? data.dateFin.toDate() : (data.dateFin ? new Date(data.dateFin) : undefined),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
        } as Mission;
      }));
      setCamions(camionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Camion)));
      setChauffeurs(chauffeursSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chauffeur)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMission = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      try {
        await deleteDoc(doc(db, 'missions', id));
        setMissions(missions.filter(m => m.id !== id));
      } catch (error) {
        console.error('Error deleting mission:', error);
      }
    }
  };

  const handleCompleteMission = async (mission: Mission) => {
    if (confirm('Marquer cette mission comme terminée ?')) {
      try {
        await updateDoc(doc(db, 'missions', mission.id), {
          statut: 'termine',
          dateFin: new Date(),
        });
        loadData();
      } catch (error) {
        console.error('Error completing mission:', error);
      }
    }
  };

  // Filtrer les missions selon les filtres sélectionnés
  const filteredMissions = missions.filter(mission => {
    if (filterCamion !== 'all' && mission.camionId !== filterCamion) return false;
    if (filterChauffeur !== 'all' && mission.chauffeurId !== filterChauffeur) return false;
    if (filterStatut !== 'all' && mission.statut !== filterStatut) return false;
    return true;
  });

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Trajets / Missions</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Gérez vos missions et trajets</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle View Mode */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'map'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map size={16} />
              Carte
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedMission(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={18} />
            <span>Nouvelle mission</span>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Filtres :</span>
          </div>
          <select
            value={filterCamion}
            onChange={(e) => setFilterCamion(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 sm:flex-none sm:min-w-[150px]"
          >
            <option value="all">Tous les camions</option>
            {camions.map(camion => (
              <option key={camion.id} value={camion.id}>{camion.matricule}</option>
            ))}
          </select>
          <select
            value={filterChauffeur}
            onChange={(e) => setFilterChauffeur(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 sm:flex-none sm:min-w-[150px]"
          >
            <option value="all">Tous les chauffeurs</option>
            {chauffeurs.map(chauffeur => (
              <option key={chauffeur.id} value={chauffeur.id}>{chauffeur.prenom} {chauffeur.nom}</option>
            ))}
          </select>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 sm:flex-none sm:min-w-[150px]"
          >
            <option value="all">Tous les statuts</option>
            <option value="planifie">Planifié</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
          </select>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <MissionMap
            missions={filteredMissions}
            selectedMission={selectedMission}
            onMissionSelect={(mission) => {
              setSelectedMission(mission);
              setShowForm(true);
            }}
          />
        </div>
      )}

      {/* Missions List */}
      {viewMode === 'list' && (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trajet</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Camion</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Chauffeur</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coût estimé</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Recette</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMissions.map((mission) => {
                  const camion = camions.find(c => c.id === mission.camionId);
                  const chauffeur = chauffeurs.find(c => c.id === mission.chauffeurId);
                  const coutEstime = mission.coutEstime.carburant + mission.coutEstime.peage + mission.coutEstime.repas + mission.coutEstime.autre;
                  const profit = mission.recette ? mission.recette - coutEstime : null;

                  return (
                    <tr key={mission.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span>{mission.depart} → {mission.destination}</span>
                          <span className="text-xs text-gray-500 mt-1 md:hidden">
                            {formatDate(mission.dateDebut)}
                            {camion?.matricule && ` • ${camion.matricule}`}
                            {chauffeur && ` • ${chauffeur.prenom} ${chauffeur.nom}`}
                            {mission.recette && ` • ${formatCurrency(mission.recette)}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                        {formatDate(mission.dateDebut)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                        {camion?.matricule || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                        {chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {formatCurrency(coutEstime)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                        {mission.recette ? formatCurrency(mission.recette) : '-'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          mission.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                          mission.statut === 'termine' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {mission.statut === 'en_cours' ? 'En cours' :
                           mission.statut === 'termine' ? 'Terminé' :
                           'Planifié'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {mission.statut === 'en_cours' && (
                            <button
                              onClick={() => handleCompleteMission(mission)}
                              className="text-green-600 hover:text-green-900"
                              title="Terminer la mission"
                            >
                              <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedMission(mission);
                              setShowForm(true);
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                          <button
                            onClick={() => handleDeleteMission(mission.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        </div>
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

      {/* Form Modal */}
      {showForm && (
        <MissionForm
          mission={selectedMission}
          camions={camions}
          chauffeurs={chauffeurs}
          onClose={() => {
            setShowForm(false);
            setSelectedMission(null);
          }}
          onSuccess={async () => {
            setShowForm(false);
            setSelectedMission(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

function MissionForm({
  mission,
  camions,
  chauffeurs,
  onClose,
  onSuccess,
}: {
  mission: Mission | null;
  camions: Camion[];
  chauffeurs: Chauffeur[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    depart: mission?.depart || '',
    destination: mission?.destination || '',
    dateDebut: mission?.dateDebut ? new Date(mission.dateDebut).toISOString().split('T')[0] : '',
    camionId: mission?.camionId || '',
    chauffeurId: mission?.chauffeurId || '',
    statut: mission?.statut || 'planifie',
    coutEstime: {
      carburant: mission?.coutEstime?.carburant || 0,
      peage: mission?.coutEstime?.peage || 0,
      repas: mission?.coutEstime?.repas || 0,
      autre: mission?.coutEstime?.autre || 0,
    },
    recette: mission?.recette || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mission) {
        await updateDoc(doc(db, 'missions', mission.id), {
          ...formData,
          dateDebut: new Date(formData.dateDebut),
          coutEstime: {
            carburant: parseFloat(formData.coutEstime.carburant.toString()),
            peage: parseFloat(formData.coutEstime.peage.toString()),
            repas: parseFloat(formData.coutEstime.repas.toString()),
            autre: parseFloat(formData.coutEstime.autre.toString()),
          },
          recette: parseFloat(formData.recette.toString()),
        });
      } else {
        await addDoc(collection(db, 'missions'), {
          ...formData,
          dateDebut: new Date(formData.dateDebut),
          coutEstime: {
            carburant: parseFloat(formData.coutEstime.carburant.toString()),
            peage: parseFloat(formData.coutEstime.peage.toString()),
            repas: parseFloat(formData.coutEstime.repas.toString()),
            autre: parseFloat(formData.coutEstime.autre.toString()),
          },
          recette: parseFloat(formData.recette.toString()),
          createdAt: new Date(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving mission:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {mission ? 'Modifier la mission' : 'Nouvelle mission'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Départ</label>
              <input
                type="text"
                value={formData.depart}
                onChange={(e) => setFormData({ ...formData, depart: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Camion</label>
              <select
                value={formData.camionId}
                onChange={(e) => setFormData({ ...formData, camionId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sélectionner un camion</option>
                {camions.map((camion) => (
                  <option key={camion.id} value={camion.id}>
                    {camion.matricule} - {camion.marque} {camion.modele}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chauffeur</label>
              <select
                value={formData.chauffeurId}
                onChange={(e) => setFormData({ ...formData, chauffeurId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sélectionner un chauffeur</option>
                {chauffeurs.filter(c => c.actif).map((chauffeur) => (
                  <option key={chauffeur.id} value={chauffeur.id}>
                    {chauffeur.prenom} {chauffeur.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Coût estimé</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carburant</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.coutEstime.carburant}
                  onChange={(e) => setFormData({
                    ...formData,
                    coutEstime: { ...formData.coutEstime, carburant: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Péage</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.coutEstime.peage}
                  onChange={(e) => setFormData({
                    ...formData,
                    coutEstime: { ...formData.coutEstime, peage: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repas</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.coutEstime.repas}
                  onChange={(e) => setFormData({
                    ...formData,
                    coutEstime: { ...formData.coutEstime, repas: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autre</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.coutEstime.autre}
                  onChange={(e) => setFormData({
                    ...formData,
                    coutEstime: { ...formData.coutEstime, autre: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recette</label>
            <input
              type="number"
              step="0.01"
              value={formData.recette}
              onChange={(e) => setFormData({ ...formData, recette: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              {mission ? 'Modifier' : 'Créer'}
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

