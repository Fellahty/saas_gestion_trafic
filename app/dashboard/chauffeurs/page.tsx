'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Chauffeur, Absence } from '@/lib/types';
import { Plus, Edit, Trash2, Users, Calendar, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function ChauffeursPage() {
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedChauffeur, setSelectedChauffeur] = useState<Chauffeur | null>(null);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
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

      setChauffeurs(chauffeursSnap.docs.map(doc => {
        const data = doc.data();
        
        // Helper to safely convert date
        const convertDate = (dateValue: any): Date | undefined => {
          if (!dateValue) return undefined;
          try {
            if (dateValue instanceof Timestamp) {
              return dateValue.toDate();
            }
            if (dateValue instanceof Date) {
              return isNaN(dateValue.getTime()) ? undefined : dateValue;
            }
            const dateObj = new Date(dateValue);
            return isNaN(dateObj.getTime()) ? undefined : dateObj;
          } catch {
            return undefined;
          }
        };
        
        return {
          id: doc.id,
          ...data,
          dateObtentionPermis: convertDate(data.dateObtentionPermis),
          dateEmbauche: convertDate(data.dateEmbauche),
          createdAt: convertDate(data.createdAt) || new Date(),
        } as Chauffeur;
      }));
      setAbsences(absencesSnap.docs.map(doc => {
        const data = doc.data();
        
        // Helper to safely convert date
        const convertDate = (dateValue: any): Date => {
          if (!dateValue) return new Date();
          try {
            if (dateValue instanceof Timestamp) {
              return dateValue.toDate();
            }
            if (dateValue instanceof Date) {
              return isNaN(dateValue.getTime()) ? new Date() : dateValue;
            }
            const dateObj = new Date(dateValue);
            return isNaN(dateObj.getTime()) ? new Date() : dateObj;
          } catch {
            return new Date();
          }
        };
        
        return {
          id: doc.id,
          ...data,
          dateDebut: convertDate(data.dateDebut),
          dateFin: convertDate(data.dateFin),
          createdAt: convertDate(data.createdAt),
        } as Absence;
      }).sort((a, b) => {
        // Sort by dateDebut descending (most recent first)
        return b.dateDebut.getTime() - a.dateDebut.getTime();
      }));
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

  const handleDeleteAbsence = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette absence ?')) {
      try {
        await deleteDoc(doc(db, 'absences', id));
        setAbsences(absences.filter(a => a.id !== id));
      } catch (error) {
        console.error('Error deleting absence:', error);
      }
    }
  };

  // Calculate used vacation days for a chauffeur
  const calculateUsedCongeDays = (chauffeurId: string): number => {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    return absences
      .filter(a => 
        a.chauffeurId === chauffeurId && 
        a.type === 'conge' &&
        a.dateDebut >= yearStart &&
        a.dateDebut <= yearEnd
      )
      .reduce((total, absence) => {
        const start = new Date(absence.dateDebut);
        const end = new Date(absence.dateFin);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
        return total + diffDays;
      }, 0);
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
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Solde congés</span>
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chauffeurs.map((chauffeur) => {
                    const usedCongeDays = calculateUsedCongeDays(chauffeur.id);
                    const soldConge = chauffeur.soldAnnuelConge || 0;
                    const remainingConge = soldConge - usedCongeDays;
                    
                    return (
                      <tr key={chauffeur.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          <div className="sm:hidden">
                            <div>{chauffeur.prenom} {chauffeur.nom}</div>
                            <div className="text-xs text-gray-500 mt-1">{chauffeur.telephone}</div>
                            <div className="text-xs text-gray-500 mt-1">Permis: {chauffeur.permis || 'N/A'} • Salaire: {formatCurrency(chauffeur.salaire)}</div>
                            {soldConge > 0 && (
                              <div className="text-xs mt-1">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-primary-600" />
                                  <span className="font-semibold text-gray-900">
                                    {remainingConge}/{soldConge}
                                  </span>
                                  <span className="text-gray-500">jours restants</span>
                                </div>
                                <div className="mt-0.5">
                                  <span className="text-gray-400">{usedCongeDays} utilisés</span>
                                </div>
                              </div>
                            )}
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
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden xl:table-cell">
                          {soldConge > 0 ? (
                            <div className="flex items-center gap-3 min-w-[140px]">
                              {/* Progress Bar */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className={`text-sm font-bold ${
                                    remainingConge < 5 
                                      ? 'text-red-600' 
                                      : remainingConge < 10 
                                      ? 'text-yellow-600' 
                                      : 'text-green-600'
                                  }`}>
                                    {remainingConge}
                                  </span>
                                  <span className="text-xs text-gray-500 font-medium">
                                    / {soldConge}
                                  </span>
                                </div>
                                {/* Progress Bar Visual */}
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      remainingConge < 5 
                                        ? 'bg-red-500' 
                                        : remainingConge < 10 
                                        ? 'bg-yellow-500' 
                                        : 'bg-green-500'
                                    }`}
                                    style={{ 
                                      width: `${Math.min(100, Math.max(0, (remainingConge / soldConge) * 100))}%` 
                                    }}
                                  />
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-gray-500">
                                    {usedCongeDays} utilisés
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    jours
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">Non défini</span>
                            </div>
                          )}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Absences Tab */}
      {activeTab === 'absences' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Gestion des absences</h2>
              <p className="text-sm text-gray-600 mt-1">Suivez les absences de vos chauffeurs</p>
            </div>
            <button
              onClick={() => {
                setSelectedAbsence(null);
                setShowAbsenceForm(true);
              }}
              className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus size={18} />
              <span>Nouvelle absence</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chauffeur</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Période</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {absences.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                          Aucune absence enregistrée
                        </td>
                      </tr>
                    ) : (
                      absences.map((absence) => {
                        const chauffeur = chauffeurs.find(c => c.id === absence.chauffeurId);
                        return (
                          <tr key={absence.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                              <div className="sm:hidden">
                                <div>{chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : 'N/A'}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatDate(absence.dateDebut)} - {formatDate(absence.dateFin)}
                                </div>
                                {absence.description && (
                                  <div className="text-xs text-gray-500 mt-1">{absence.description}</div>
                                )}
                              </div>
                              <span className="hidden sm:inline">{chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : 'N/A'}</span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
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
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                              {formatDate(absence.dateDebut)} - {formatDate(absence.dateFin)}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 hidden md:table-cell max-w-xs truncate">
                              {absence.description || '-'}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedAbsence(absence);
                                    setShowAbsenceForm(true);
                                  }}
                                  className="text-primary-600 hover:text-primary-900"
                                  aria-label="Modifier l'absence"
                                >
                                  <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAbsence(absence.id)}
                                  className="text-red-600 hover:text-red-900"
                                  aria-label="Supprimer l'absence"
                                >
                                  <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
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

      {/* Absence Form Modal */}
      {showAbsenceForm && (
        <AbsenceForm
          absence={selectedAbsence}
          chauffeurs={chauffeurs}
          absences={absences}
          onClose={() => {
            setShowAbsenceForm(false);
            setSelectedAbsence(null);
          }}
          onSuccess={async () => {
            setShowAbsenceForm(false);
            setSelectedAbsence(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

// Helper function to safely convert date to YYYY-MM-DD format for date inputs
function formatDateForInput(date: Date | undefined | null | any): string {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (date && typeof date.toDate === 'function') {
      // Firestore Timestamp
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
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
}

function ChauffeurForm({ chauffeur, onClose, onSuccess }: { chauffeur: Chauffeur | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    nom: chauffeur?.nom || '',
    prenom: chauffeur?.prenom || '',
    email: chauffeur?.email || '',
    telephone: chauffeur?.telephone || '',
    permis: chauffeur?.permis || '',
    dateObtentionPermis: formatDateForInput(chauffeur?.dateObtentionPermis),
    typeContrat: chauffeur?.typeContrat || 'cdi',
    salaire: chauffeur?.salaire || 0,
    dateEmbauche: formatDateForInput(chauffeur?.dateEmbauche),
    soldAnnuelConge: chauffeur?.soldAnnuelConge || 0,
    actif: chauffeur?.actif !== undefined ? chauffeur.actif : true,
  });

  // Update form data when chauffeur prop changes
  useEffect(() => {
    setFormData({
      nom: chauffeur?.nom || '',
      prenom: chauffeur?.prenom || '',
      email: chauffeur?.email || '',
      telephone: chauffeur?.telephone || '',
      permis: chauffeur?.permis || '',
      dateObtentionPermis: formatDateForInput(chauffeur?.dateObtentionPermis),
      typeContrat: chauffeur?.typeContrat || 'cdi',
      salaire: chauffeur?.salaire || 0,
      dateEmbauche: formatDateForInput(chauffeur?.dateEmbauche),
      soldAnnuelConge: chauffeur?.soldAnnuelConge || 0,
      actif: chauffeur?.actif !== undefined ? chauffeur.actif : true,
    });
  }, [chauffeur]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave: any = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        permis: formData.permis,
        typeContrat: formData.typeContrat,
        salaire: parseFloat(formData.salaire.toString()),
        soldAnnuelConge: formData.soldAnnuelConge > 0 ? parseInt(formData.soldAnnuelConge.toString()) : undefined,
        actif: formData.actif,
      };
      
      // Only add dates if they are provided and valid
      if (formData.dateObtentionPermis) {
        const dateObj = new Date(formData.dateObtentionPermis);
        if (!isNaN(dateObj.getTime())) {
          dataToSave.dateObtentionPermis = dateObj;
        }
      }
      
      if (formData.dateEmbauche) {
        const dateObj = new Date(formData.dateEmbauche);
        if (!isNaN(dateObj.getTime())) {
          dataToSave.dateEmbauche = dateObj;
        }
      }
      
      if (chauffeur) {
        await updateDoc(doc(db, 'chauffeurs', chauffeur.id), dataToSave);
      } else {
        await addDoc(collection(db, 'chauffeurs'), {
          ...dataToSave,
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
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" data-form-type="driver">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
                autoComplete="off"
                data-form-field="nom"
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
                autoComplete="off"
                data-form-field="prenom"
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
                autoComplete="email"
                data-form-field="email"
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
                autoComplete="tel"
                data-form-field="telephone"
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
                autoComplete="off"
                data-form-field="date-obtention-permis"
                data-lpignore="true"
                data-1p-ignore="true"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;embauche</label>
              <input
                type="date"
                value={formData.dateEmbauche}
                onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
                required
                autoComplete="off"
                data-form-field="date-embauche"
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Solde annuel de congé (jours)</label>
              <input
                type="number"
                min="0"
                max="365"
                value={formData.soldAnnuelConge}
                onChange={(e) => setFormData({ ...formData, soldAnnuelConge: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: 25"
              />
              <p className="text-xs text-gray-500 mt-1">Nombre de jours de congé par an</p>
            </div>
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

function AbsenceForm({ absence, chauffeurs, absences, onClose, onSuccess }: { absence: Absence | null; chauffeurs: Chauffeur[]; absences: Absence[]; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    chauffeurId: absence?.chauffeurId || '',
    type: (absence?.type || 'conge') as 'conge' | 'maladie' | 'accident' | 'autre',
    dateDebut: formatDateForInput(absence?.dateDebut),
    dateFin: formatDateForInput(absence?.dateFin),
    description: absence?.description || '',
  });

  // Update form data when absence prop changes
  useEffect(() => {
    setFormData({
      chauffeurId: absence?.chauffeurId || '',
      type: (absence?.type || 'conge') as 'conge' | 'maladie' | 'accident' | 'autre',
      dateDebut: formatDateForInput(absence?.dateDebut),
      dateFin: formatDateForInput(absence?.dateFin),
      description: absence?.description || '',
    });
  }, [absence]);

  // Calculate vacation balance for selected driver
  const calculateCongeBalance = () => {
    if (!formData.chauffeurId || formData.type !== 'conge') return null;

    const chauffeur = chauffeurs.find(c => c.id === formData.chauffeurId);
    if (!chauffeur || !chauffeur.soldAnnuelConge) return null;

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    // Calculate used days (excluding current absence if editing)
    const usedDays = absences
      .filter(a => 
        a.chauffeurId === formData.chauffeurId && 
        a.type === 'conge' &&
        a.id !== absence?.id && // Exclude current absence if editing
        a.dateDebut >= yearStart &&
        a.dateDebut <= yearEnd
      )
      .reduce((total, a) => {
        const start = new Date(a.dateDebut);
        const end = new Date(a.dateFin);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return total + diffDays;
      }, 0);

    // Calculate days for this absence
    let thisAbsenceDays = 0;
    if (formData.dateDebut && formData.dateFin) {
      const start = new Date(formData.dateDebut);
      const end = new Date(formData.dateFin);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        thisAbsenceDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    const totalUsed = usedDays + thisAbsenceDays;
    const remaining = chauffeur.soldAnnuelConge - totalUsed;

    return {
      total: chauffeur.soldAnnuelConge,
      used: usedDays,
      thisAbsence: thisAbsenceDays,
      remaining,
      willExceed: remaining < 0
    };
  };

  const congeBalance = calculateCongeBalance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    if (!formData.dateDebut || !formData.dateFin) {
      alert('Veuillez remplir les dates de début et de fin');
      return;
    }

    const dateDebut = new Date(formData.dateDebut);
    const dateFin = new Date(formData.dateFin);

    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
      alert('Dates invalides');
      return;
    }

    if (dateFin < dateDebut) {
      alert('La date de fin doit être après la date de début');
      return;
    }

    // Warn if conge exceeds balance
    if (formData.type === 'conge' && formData.chauffeurId) {
      const balance = calculateCongeBalance();
      if (balance && balance.willExceed) {
        const confirmExceed = confirm(
          `Attention: Cette absence dépasse le solde disponible de ${Math.abs(balance.remaining)} jour(s).\n` +
          `Voulez-vous continuer quand même ?`
        );
        if (!confirmExceed) {
          return;
        }
      }
    }

    try {
      const dataToSave: any = {
        chauffeurId: formData.chauffeurId,
        type: formData.type,
        dateDebut: dateDebut,
        dateFin: dateFin,
      };

      // Only add description if it's not empty
      if (formData.description && formData.description.trim() !== '') {
        dataToSave.description = formData.description.trim();
      }

      if (absence) {
        await updateDoc(doc(db, 'absences', absence.id), dataToSave);
      } else {
        await addDoc(collection(db, 'absences'), {
          ...dataToSave,
          createdAt: new Date(),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving absence:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 my-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {absence ? "Modifier l'absence" : 'Nouvelle absence'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" data-form-type="absence">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chauffeur <span className="text-red-500">*</span>
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d&apos;absence <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="conge">Congé</option>
              <option value="maladie">Maladie</option>
              <option value="accident">Accident</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {/* Congé Balance Info - Only show for "conge" type */}
          {formData.type === 'conge' && congeBalance && (
            <div className={`p-4 rounded-lg border-2 ${
              congeBalance.willExceed 
                ? 'bg-red-50 border-red-200' 
                : congeBalance.remaining < 5 
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Solde de congé annuel
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Solde annuel:</span>
                  <span className="font-medium text-gray-900">{congeBalance.total} jours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Déjà utilisés:</span>
                  <span className="font-medium text-gray-700">{congeBalance.used} jours</span>
                </div>
                {formData.dateDebut && formData.dateFin && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cette absence:</span>
                    <span className="font-medium text-blue-600">+{congeBalance.thisAbsence} jours</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Solde restant:</span>
                    <span className={`font-bold text-lg ${
                      congeBalance.willExceed 
                        ? 'text-red-600' 
                        : congeBalance.remaining < 5 
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {congeBalance.remaining} jours
                    </span>
                  </div>
                </div>
                {congeBalance.willExceed && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 font-medium">
                    ⚠️ Attention: Cette absence dépasse le solde disponible de {Math.abs(congeBalance.remaining)} jour(s)!
                  </div>
                )}
                {!congeBalance.willExceed && congeBalance.remaining < 5 && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800 font-medium">
                    ⚠️ Attention: Il ne reste que {congeBalance.remaining} jour(s) de congé.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                required
                autoComplete="off"
                data-form-field="date-debut"
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                required
                min={formData.dateDebut}
                autoComplete="off"
                data-form-field="date-fin"
                data-lpignore="true"
                data-1p-ignore="true"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Description de l'absence (optionnel)"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              {absence ? 'Modifier' : 'Créer'}
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

