'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Assurance, VisiteTechnique, Entretien, Stock, Facture, Camion, ConfigAlertes } from '@/lib/types';
import { AlertTriangle, Bell, Calendar, DollarSign, Truck, Package, FileText, Settings } from 'lucide-react';
import { formatDate, cleanFirestoreData, cleanFirestoreReadData } from '@/lib/utils';
import { differenceInDays, isBefore, addDays } from 'date-fns';

interface Alerte {
  id: string;
  type: 'assurance' | 'visite' | 'entretien' | 'stock' | 'facture' | 'maintenance';
  niveau: 'critique' | 'important' | 'info';
  titre: string;
  description: string;
  date: Date;
  action?: string;
}

export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'alertes' | 'configuration'>('alertes');
  const [config, setConfig] = useState<ConfigAlertes>({
    id: 'default',
    joursAlerteAssurance: 30,
    joursAlerteVisite: 30,
    joursCritiqueAssurance: 7,
    joursCritiqueVisite: 7,
    joursCritiqueFacture: 30,
    alerteAssurance: true,
    alerteVisite: true,
    alerteEntretien: true,
    alerteStock: true,
    alerteFacture: true,
    alerteMaintenance: true,
    seuilStockCritique: 0,
    seuilStockImportant: 10,
    updatedAt: new Date(),
  });

  useEffect(() => {
    const initialize = async () => {
      await loadConfig();
      // Attendre un peu pour que la config soit mise à jour
      setTimeout(() => {
        loadAlertes();
      }, 100);
    };
    initialize();
  }, []);

  const loadConfig = async () => {
    try {
      const configDoc = await getDoc(doc(db, 'configAlertes', 'default'));
      if (configDoc.exists()) {
        // Nettoyer les données reçues de Firestore pour éviter les erreurs JSON
        const rawData = configDoc.data();
        const cleanedData = cleanFirestoreReadData(rawData as any);
        
        setConfig({
          id: 'default',
          joursAlerteAssurance: Number(cleanedData.joursAlerteAssurance) || 30,
          joursAlerteVisite: Number(cleanedData.joursAlerteVisite) || 30,
          joursCritiqueAssurance: Number(cleanedData.joursCritiqueAssurance) || 7,
          joursCritiqueVisite: Number(cleanedData.joursCritiqueVisite) || 7,
          joursCritiqueFacture: Number(cleanedData.joursCritiqueFacture) || 30,
          alerteAssurance: cleanedData.alerteAssurance !== undefined ? Boolean(cleanedData.alerteAssurance) : true,
          alerteVisite: cleanedData.alerteVisite !== undefined ? Boolean(cleanedData.alerteVisite) : true,
          alerteEntretien: cleanedData.alerteEntretien !== undefined ? Boolean(cleanedData.alerteEntretien) : true,
          alerteStock: cleanedData.alerteStock !== undefined ? Boolean(cleanedData.alerteStock) : true,
          alerteFacture: cleanedData.alerteFacture !== undefined ? Boolean(cleanedData.alerteFacture) : true,
          alerteMaintenance: cleanedData.alerteMaintenance !== undefined ? Boolean(cleanedData.alerteMaintenance) : true,
          seuilStockCritique: Number(cleanedData.seuilStockCritique) || 0,
          seuilStockImportant: Number(cleanedData.seuilStockImportant) || 10,
          updatedAt: cleanedData.updatedAt?.toDate ? cleanedData.updatedAt.toDate() : (cleanedData.updatedAt instanceof Date ? cleanedData.updatedAt : new Date()),
        });
      } else {
        // Utiliser les valeurs par défaut si le document n'existe pas
        // La config par défaut est déjà définie dans useState
      }
    } catch (error) {
      console.error('Error loading config:', error);
      // En cas d'erreur (permissions ou JSON invalide), utiliser les valeurs par défaut
      // La config par défaut est déjà définie dans useState
    }
  };

  const saveConfig = async () => {
    try {
      // Nettoyer les données avant de les envoyer à Firebase pour éviter les erreurs JSON.parse
      const cleanedConfig = cleanFirestoreData({
        ...config,
        updatedAt: new Date(),
      });
      
      await setDoc(doc(db, 'configAlertes', 'default'), cleanedConfig);
      alert('Configuration sauvegardée avec succès !');
      loadAlertes(); // Recharger les alertes avec la nouvelle config
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const loadAlertes = async () => {
    try {
      const [assurancesSnap, visitesSnap, entretiensSnap, stockSnap, facturesSnap, camionsSnap] = await Promise.all([
        getDocs(collection(db, 'assurances')),
        getDocs(collection(db, 'visitesTechniques')),
        getDocs(collection(db, 'entretiens')),
        getDocs(collection(db, 'stock')),
        getDocs(collection(db, 'factures')),
        getDocs(collection(db, 'camions')),
      ]);

      const assurances = assurancesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assurance));
      const visites = visitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisiteTechnique));
      const entretiens = entretiensSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entretien));
      const stock = stockSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stock));
      const factures = facturesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Facture));
      const camions = camionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Camion));

      const allAlertes: Alerte[] = [];

      // Alertes d'assurance
      if (config.alerteAssurance) {
        assurances.forEach(assurance => {
          const dateFin = assurance.dateFin instanceof Timestamp 
            ? assurance.dateFin.toDate() 
            : new Date(assurance.dateFin);
          const joursRestants = differenceInDays(dateFin, new Date());
          
          if (joursRestants <= config.joursAlerteAssurance && joursRestants >= 0) {
            allAlertes.push({
              id: `assurance-${assurance.id}`,
              type: 'assurance',
              niveau: joursRestants <= config.joursCritiqueAssurance ? 'critique' : 'important',
              titre: `Assurance expire bientôt`,
              description: `L'assurance ${assurance.numero} expire dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}`,
              date: dateFin,
              action: '/dashboard/camions?tab=assurance',
            });
          } else if (joursRestants < 0) {
            allAlertes.push({
              id: `assurance-exp-${assurance.id}`,
              type: 'assurance',
              niveau: 'critique',
              titre: `Assurance expirée`,
              description: `L'assurance ${assurance.numero} a expiré il y a ${Math.abs(joursRestants)} jour${Math.abs(joursRestants) > 1 ? 's' : ''}`,
              date: dateFin,
              action: '/dashboard/camions?tab=assurance',
            });
          }
        });
      }

      // Alertes de visite technique
      if (config.alerteVisite) {
        visites.forEach(visite => {
          const prochaineDate = visite.prochaineDate instanceof Timestamp 
            ? visite.prochaineDate.toDate() 
            : new Date(visite.prochaineDate);
          const joursRestants = differenceInDays(prochaineDate, new Date());
          
          if (joursRestants <= config.joursAlerteVisite && joursRestants >= 0) {
            allAlertes.push({
              id: `visite-${visite.id}`,
              type: 'visite',
              niveau: joursRestants <= config.joursCritiqueVisite ? 'critique' : 'important',
              titre: `Visite technique à programmer`,
              description: `Visite technique prévue dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}`,
              date: prochaineDate,
              action: '/dashboard/camions?tab=visite',
            });
          }
        });
      }

      // Alertes de maintenance
      if (config.alerteMaintenance) {
        camions.forEach(camion => {
          if (camion.etat === 'en_maintenance') {
            allAlertes.push({
              id: `maintenance-${camion.id}`,
              type: 'maintenance',
              niveau: 'important',
              titre: `Camion en maintenance`,
              description: `Le camion ${camion.matricule} est actuellement en maintenance`,
              date: new Date(),
              action: '/dashboard/camions',
            });
          }
        });
      }

      // Alertes de stock bas
      if (config.alerteStock) {
        stock.forEach(article => {
          if (article.quantite <= article.seuilAlerte) {
            const niveau = article.quantite <= config.seuilStockCritique 
              ? 'critique' 
              : article.quantite <= config.seuilStockImportant 
              ? 'important' 
              : 'info';
            allAlertes.push({
              id: `stock-${article.id}`,
              type: 'stock',
              niveau,
              titre: `Stock bas: ${article.nom}`,
              description: `Il ne reste que ${article.quantite} ${article.nom} en stock (seuil: ${article.seuilAlerte})`,
              date: new Date(),
              action: '/dashboard/stock',
            });
          }
        });
      }

      // Alertes de factures en retard
      if (config.alerteFacture) {
        factures.forEach(facture => {
          if (facture.statut === 'en_retard' || (facture.dateEcheance && facture.montantRestant > 0)) {
            const dateEcheance = facture.dateEcheance instanceof Timestamp 
              ? facture.dateEcheance.toDate() 
              : facture.dateEcheance 
              ? new Date(facture.dateEcheance) 
              : null;
            
            if (dateEcheance && isBefore(dateEcheance, new Date())) {
              const joursEnRetard = differenceInDays(new Date(), dateEcheance);
              allAlertes.push({
                id: `facture-${facture.id}`,
                type: 'facture',
                niveau: joursEnRetard > config.joursCritiqueFacture ? 'critique' : 'important',
                titre: `Facture en retard`,
                description: `La facture ${facture.numero} est en retard de ${joursEnRetard} jour${joursEnRetard > 1 ? 's' : ''} (${facture.montantRestant.toLocaleString('fr-FR')} MAD restants)`,
                date: dateEcheance,
                action: '/dashboard/factures',
              });
            }
          }
        });
      }

      // Trier par priorité et date
      allAlertes.sort((a, b) => {
        const priority = { critique: 0, important: 1, info: 2 };
        if (priority[a.niveau] !== priority[b.niveau]) {
          return priority[a.niveau] - priority[b.niveau];
        }
        return a.date.getTime() - b.date.getTime();
      });

      setAlertes(allAlertes);
    } catch (error) {
      console.error('Error loading alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'assurance': return <FileText className="w-5 h-5" />;
      case 'visite': return <Calendar className="w-5 h-5" />;
      case 'entretien': return <Truck className="w-5 h-5" />;
      case 'stock': return <Package className="w-5 h-5" />;
      case 'facture': return <DollarSign className="w-5 h-5" />;
      case 'maintenance': return <AlertTriangle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getColor = (niveau: string) => {
    switch (niveau) {
      case 'critique': return 'bg-red-50 border-red-200 text-red-800';
      case 'important': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const alertesCritiques = alertes.filter(a => a.niveau === 'critique');
  const alertesImportantes = alertes.filter(a => a.niveau === 'important');
  const alertesInfo = alertes.filter(a => a.niveau === 'info');

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3 sm:space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="text-primary-600" />
          Alertes et Notifications
        </h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
          Restez informé des événements importants de votre flotte
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-2 sm:space-x-4 min-w-max" role="tablist">
          <button
            onClick={() => setActiveTab('alertes')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'alertes'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            role="tab"
            aria-selected={activeTab === 'alertes'}
          >
            Alertes
          </button>
          <button
            onClick={() => setActiveTab('configuration')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === 'configuration'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            role="tab"
            aria-selected={activeTab === 'configuration'}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Configuration</span>
            <span className="sm:hidden">Config</span>
          </button>
        </nav>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'configuration' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 md:p-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
            <span className="text-base sm:text-lg md:text-xl">Configuration des Alertes</span>
          </h2>

          <div className="space-y-4 sm:space-y-6">
            {/* Jours d'alerte */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Jours d&apos;alerte</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Assurance (jours avant expiration)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.joursAlerteAssurance}
                    onChange={(e) => setConfig({ ...config, joursAlerteAssurance: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Visite technique (jours avant)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.joursAlerteVisite}
                    onChange={(e) => setConfig({ ...config, joursAlerteVisite: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Jours critiques */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Seuils critiques</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Assurance critique (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.joursCritiqueAssurance}
                    onChange={(e) => setConfig({ ...config, joursCritiqueAssurance: parseInt(e.target.value) || 7 })}
                    className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Visite critique (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.joursCritiqueVisite}
                    onChange={(e) => setConfig({ ...config, joursCritiqueVisite: parseInt(e.target.value) || 7 })}
                    className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Facture critique (jours en retard)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.joursCritiqueFacture}
                    onChange={(e) => setConfig({ ...config, joursCritiqueFacture: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Seuils stock */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Seuils de stock</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Stock critique (quantité)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.seuilStockCritique}
                    onChange={(e) => setConfig({ ...config, seuilStockCritique: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Stock important (quantité)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.seuilStockImportant}
                    onChange={(e) => setConfig({ ...config, seuilStockImportant: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Activer/désactiver alertes */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Types d&apos;alertes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
                <label className="flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={config.alerteAssurance}
                    onChange={(e) => setConfig({ ...config, alerteAssurance: e.target.checked })}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Assurance</span>
                </label>
                <label className="flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={config.alerteVisite}
                    onChange={(e) => setConfig({ ...config, alerteVisite: e.target.checked })}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Visite technique</span>
                </label>
                <label className="flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={config.alerteEntretien}
                    onChange={(e) => setConfig({ ...config, alerteEntretien: e.target.checked })}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Entretien</span>
                </label>
                <label className="flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={config.alerteStock}
                    onChange={(e) => setConfig({ ...config, alerteStock: e.target.checked })}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Stock</span>
                </label>
                <label className="flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={config.alerteFacture}
                    onChange={(e) => setConfig({ ...config, alerteFacture: e.target.checked })}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Factures</span>
                </label>
                <label className="flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={config.alerteMaintenance}
                    onChange={(e) => setConfig({ ...config, alerteMaintenance: e.target.checked })}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Maintenance</span>
                </label>
              </div>
            </div>

            {/* Bouton sauvegarder */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
              <button
                onClick={saveConfig}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 touch-manipulation"
              >
                Sauvegarder la configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alertes Tab */}
      {activeTab === 'alertes' && (
        <>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Critiques</p>
              <p className="text-2xl font-bold text-red-800">{alertesCritiques.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Importantes</p>
              <p className="text-2xl font-bold text-orange-800">{alertesImportantes.length}</p>
            </div>
            <Bell className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Informations</p>
              <p className="text-2xl font-bold text-blue-800">{alertesInfo.length}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Liste des alertes */}
      {alertes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Aucune alerte</p>
          <p className="text-sm text-gray-500 mt-2">Tout est sous contrôle !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertes.map((alerte) => (
            <div
              key={alerte.id}
              className={`border rounded-lg p-4 transition-all hover:shadow-md ${getColor(alerte.niveau)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(alerte.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm sm:text-base">{alerte.titre}</h3>
                      <p className="text-sm mt-1 opacity-90">{alerte.description}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {formatDate(alerte.date)}
                      </p>
                    </div>
                    {alerte.action && (
                      <a
                        href={alerte.action}
                        className="flex-shrink-0 text-xs font-medium underline hover:no-underline"
                      >
                        Voir →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
