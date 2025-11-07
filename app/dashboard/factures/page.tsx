'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Facture, Client, LigneFacture, Reglement, Mission, Recette } from '@/lib/types';
import { Plus, Edit, Trash2, Download, FileText, Search, Filter, X, CheckCircle2, Clock, AlertCircle, Zap, Loader2, Eye } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateFacturePDF, previewFacturePDF } from '@/lib/pdf-generator';
import FactureForm from './FactureForm';

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [reglements, setReglements] = useState<Reglement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [generating, setGenerating] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [recettes, setRecettes] = useState<Recette[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [facturesSnap, clientsSnap, reglementsSnap, missionsSnap, recettesSnap] = await Promise.all([
        getDocs(query(collection(db, 'factures'), orderBy('dateEmission', 'desc'))),
        getDocs(collection(db, 'clients')),
        getDocs(collection(db, 'reglements')),
        getDocs(collection(db, 'missions')),
        getDocs(collection(db, 'recettes')),
      ]);

      setFactures(facturesSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        dateEmission: doc.data().dateEmission?.toDate() || new Date(),
        dateEcheance: doc.data().dateEcheance?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Facture)));

      setClients(clientsSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Client)));

      setReglements(reglementsSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as Reglement)));

      setMissions(missionsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dateDebut: data.dateDebut?.toDate() || new Date(),
          dateFin: data.dateFin?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Mission;
      }));

      setRecettes(recettesSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Recette;
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Générer le prochain numéro de facture
  const generateNumeroFacture = (): string => {
    const year = new Date().getFullYear();
    const existingFactures = factures.filter(f => f.numero.startsWith(`FACT-${year}-`));
    const nextNumber = existingFactures.length + 1;
    return `FACT-${year}-${String(nextNumber).padStart(4, '0')}`;
  };

  // Générer des factures automatiquement à partir des missions terminées
  const handleGenerateFacturesFromMissions = async () => {
    if (!confirm('Générer des factures pour toutes les missions terminées sans facture ?')) {
      return;
    }

    setGenerating(true);
    try {
      // Récupérer les missions terminées qui n'ont pas encore de facture
      const missionsTerminees = missions.filter(m => {
        // Vérifier que la mission est terminée
        if (m.statut !== 'termine') return false;
        
        // Vérifier qu'elle a une recette
        if (!m.recette || m.recette <= 0) return false;
        
        // Vérifier qu'elle n'a pas déjà de facture
        const factureExistante = factures.find(f => f.missionId === m.id);
        if (factureExistante) {
          console.log(`Mission ${m.id} (${m.depart} → ${m.destination}) a déjà une facture: ${factureExistante.numero}`);
          return false;
        }
        
        return true;
      });

      if (missionsTerminees.length === 0) {
        alert('Aucune mission terminée sans facture trouvée. Toutes les missions terminées ont déjà une facture.');
        setGenerating(false);
        return;
      }

      // Afficher un message avec le nombre de factures à créer
      const message = `Générer ${missionsTerminees.length} facture(s) pour les missions suivantes ?\n\n` +
        missionsTerminees.map(m => `- ${m.depart} → ${m.destination} (${formatCurrency(m.recette || 0)})`).join('\n');
      
      if (!confirm(message)) {
        setGenerating(false);
        return;
      }

      let facturesCreees = 0;
      const year = new Date().getFullYear();
      let factureNumber = factures.length + 1;

      for (const mission of missionsTerminees) {
        // Trouver le client via les recettes (si la recette a un clientId)
        let client: Client | undefined;
        
        // Chercher la recette associée à cette mission
        const recetteMission = recettes.find(r => r.missionId === mission.id);
        
        if (recetteMission && recetteMission.clientId) {
          // Trouver le client par ID dans la recette
          client = clients.find(c => c.id === recetteMission.clientId);
        }

        // Si pas trouvé, utiliser le premier client disponible
        if (!client && clients.length > 0) {
          client = clients[0];
        }

        if (!client) {
          console.warn(`Aucun client trouvé pour la mission ${mission.id}`);
          continue;
        }

        // Calculer les montants depuis la recette de la mission
        const montantRecette = mission.recette || 0;
        const tva = 20; // TVA de 20% au Maroc
        const totalHT = montantRecette / (1 + tva / 100);
        const totalTVA = montantRecette - totalHT;
        const totalTTC = montantRecette;

        // Créer la ligne de facture
        const lignes: LigneFacture[] = [{
          description: `Transport ${mission.depart} → ${mission.destination}`,
          quantite: 1,
          prixUnitaire: totalHT,
          tva: tva,
          remise: 0,
          total: totalHT,
        }];

        // Calculer la date d'échéance (30 jours après la date de fin de mission)
        const dateEmission = mission.dateFin || mission.dateDebut;
        const dateEcheance = new Date(dateEmission);
        dateEcheance.setDate(dateEcheance.getDate() + 30);

        // Créer la facture
        const factureData = {
          numero: `FACT-${year}-${String(factureNumber++).padStart(4, '0')}`,
          clientId: client.id,
          dateEmission: Timestamp.fromDate(dateEmission),
          dateEcheance: Timestamp.fromDate(dateEcheance),
          statut: 'envoyee' as const,
          type: 'facture' as const,
          lignes,
          totalHT,
          totalTVA,
          totalTTC,
          montantPaye: 0,
          montantRestant: totalTTC,
          notes: `Facture générée automatiquement depuis la mission ${mission.depart} → ${mission.destination}`,
          conditionsPaiement: '30 jours',
          missionId: mission.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await addDoc(collection(db, 'factures'), factureData);
        facturesCreees++;
      }

      alert(`${facturesCreees} facture(s) générée(s) avec succès !`);
      await loadData();
    } catch (error) {
      console.error('Error generating factures:', error);
      alert('Erreur lors de la génération des factures');
    } finally {
      setGenerating(false);
    }
  };

  // Factures filtrées et recherchées
  const filteredFactures = useMemo(() => {
    let filtered = factures;

    // Recherche
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clients.find(c => c.id === f.clientId)?.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (filterStatut !== 'all') {
      filtered = filtered.filter(f => f.statut === filterStatut);
    }

    // Filtre par client
    if (filterClient !== 'all') {
      filtered = filtered.filter(f => f.clientId === filterClient);
    }

    return filtered;
  }, [factures, searchTerm, filterStatut, filterClient, clients]);

  // Statistiques
  const stats = useMemo(() => {
    const totalHT = factures.reduce((sum, f) => sum + f.totalHT, 0);
    const totalTTC = factures.reduce((sum, f) => sum + f.totalTTC, 0);
    const totalPaye = factures.reduce((sum, f) => sum + f.montantPaye, 0);
    const totalRestant = factures.reduce((sum, f) => sum + f.montantRestant, 0);
    const enRetard = factures.filter(f => {
      if (!f.dateEcheance) return false;
      return f.dateEcheance < new Date() && f.statut !== 'payee' && f.statut !== 'annulee';
    }).length;

    return {
      totalHT,
      totalTTC,
      totalPaye,
      totalRestant,
      enRetard,
      totalFactures: factures.length,
      facturesPayees: factures.filter(f => f.statut === 'payee').length,
      facturesImpayees: factures.filter(f => f.statut === 'envoyee' || f.statut === 'en_retard').length,
    };
  }, [factures]);

  const handleDeleteFacture = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      try {
        await deleteDoc(doc(db, 'factures', id));
        setFactures(factures.filter(f => f.id !== id));
      } catch (error) {
        console.error('Error deleting facture:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleGeneratePDF = async (facture: Facture) => {
    try {
      const client = clients.find(c => c.id === facture.clientId);
      if (!client) {
        alert('Client introuvable');
        return;
      }
      await generateFacturePDF(facture, client);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const handlePreviewPDF = async (facture: Facture) => {
    try {
      const client = clients.find(c => c.id === facture.clientId);
      if (!client) {
        alert('Client introuvable');
        return;
      }
      await previewFacturePDF(facture, client);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      alert('Erreur lors de l\'aperçu du PDF');
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-primary-600" />
            Factures
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Créez et gérez vos factures</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerateFacturesFromMissions}
            disabled={generating}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Génération...</span>
              </>
            ) : (
              <>
                <Zap size={18} />
                <span>Générer depuis missions</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              setSelectedFacture(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus size={18} />
            <span>Nouvelle facture</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600">Total HT</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalHT)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600">Total TTC</p>
          <p className="text-xl sm:text-2xl font-bold text-primary-600 mt-1">{formatCurrency(stats.totalTTC)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600">Payé</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.totalPaye)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600">En attente</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">{formatCurrency(stats.totalRestant)}</p>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par numéro, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="envoyee">Envoyée</option>
            <option value="payee">Payée</option>
            <option value="partiellement_payee">Partiellement payée</option>
            <option value="en_retard">En retard</option>
            <option value="annulee">Annulée</option>
          </select>
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tous les clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des factures */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Client</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant TTC</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFactures.map((facture) => {
                  const client = clients.find(c => c.id === facture.clientId);
                  const isRetard = facture.dateEcheance && facture.dateEcheance < new Date() && facture.statut !== 'payee' && facture.statut !== 'annulee';
                  
                  return (
                    <tr key={facture.id} className={`hover:bg-gray-50 ${isRetard ? 'bg-red-50' : ''}`}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        <div className="sm:hidden">
                          <div>{facture.numero}</div>
                          <div className="text-xs text-gray-500 mt-1">{client?.nom || 'N/A'}</div>
                          <div className="text-xs text-gray-500 mt-1">{format(facture.dateEmission, 'dd/MM/yyyy', { locale: fr })}</div>
                        </div>
                        <span className="hidden sm:inline">{facture.numero}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                        {client?.nom || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                        {format(facture.dateEmission, 'dd/MM/yyyy', { locale: fr })}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        {formatCurrency(facture.totalTTC)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {(() => {
                          const statusConfig = {
                            brouillon: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Brouillon', icon: FileText },
                            envoyee: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Envoyée', icon: Clock },
                            payee: { bg: 'bg-green-100', text: 'text-green-800', label: 'Payée', icon: CheckCircle2 },
                            partiellement_payee: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partiel', icon: Clock },
                            en_retard: { bg: 'bg-red-100', text: 'text-red-800', label: 'En retard', icon: AlertCircle },
                            annulee: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Annulée', icon: X },
                          };
                          const config = statusConfig[facture.statut as keyof typeof statusConfig] || statusConfig.brouillon;
                          const Icon = config.icon;
                          
                          return (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${config.bg} ${config.text}`}>
                              <Icon size={12} />
                              {config.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
                          <button
                            onClick={() => handlePreviewPDF(facture)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors border border-indigo-200 hover:border-indigo-300"
                            title="Aperçu"
                          >
                            <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                            <span className="text-xs font-medium">Aperçu</span>
                          </button>
                          <button
                            onClick={() => handleGeneratePDF(facture)}
                            className="text-primary-600 hover:text-primary-900 p-1.5 hover:bg-primary-50 rounded-md transition-colors"
                            title="Télécharger PDF"
                          >
                            <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFacture(facture);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-md transition-colors"
                            title="Modifier"
                          >
                            <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                          <button
                            onClick={() => handleDeleteFacture(facture.id)}
                            className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                            title="Supprimer"
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
            {filteredFactures.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchTerm || filterStatut !== 'all' || filterClient !== 'all' 
                  ? 'Aucune facture ne correspond aux critères' 
                  : 'Aucune facture trouvée. Cliquez sur "Nouvelle facture" pour en créer une.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <FactureForm
          facture={selectedFacture}
          clients={clients}
          onClose={() => {
            setShowForm(false);
            setSelectedFacture(null);
          }}
          onSuccess={async () => {
            setShowForm(false);
            setSelectedFacture(null);
            await loadData();
          }}
          generateNumero={generateNumeroFacture}
        />
      )}
    </div>
  );
}
