'use client';

import { useState } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/firebase.config';
import { Loader2, CheckCircle, XCircle, Database, Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const villesMaroc = [
  { nom: 'Khenifra', region: 'Béni Mellal-Khénifra' },
  { nom: 'El Jadida', region: 'Casablanca-Settat' },
  { nom: 'Casablanca', region: 'Casablanca-Settat' },
  { nom: 'Rabat', region: 'Rabat-Salé-Kénitra' },
  { nom: 'Fès', region: 'Fès-Meknès' },
  { nom: 'Meknès', region: 'Fès-Meknès' },
  { nom: 'Marrakech', region: 'Marrakech-Safi' },
];

const marquesCamions = ['Mercedes-Benz', 'Volvo', 'Scania'];
const modelesCamions = {
  'Mercedes-Benz': ['Actros', 'Atego'],
  'Volvo': ['FH', 'FM'],
  'Scania': ['R Series', 'P Series'],
};

const prenomsMaroc = ['Ahmed', 'Mohamed', 'Hassan', 'Youssef', 'Omar'];
const nomsMaroc = ['Alami', 'Benali', 'Idrissi', 'Bennani', 'Tazi'];

const clientsMaroc = [
  { nom: 'Transports ATLAS', type: 'entreprise' as const, ville: 'Casablanca', email: 'contact@transportsatlas.ma' },
  { nom: 'Logistique Maroc Express', type: 'entreprise' as const, ville: 'Rabat', email: 'info@lmexpress.ma' },
  { nom: 'Transport Oum Er-Rbia', type: 'entreprise' as const, ville: 'El Jadida', email: 'contact@toer.ma' },
  { nom: 'Karim Alami', type: 'particulier' as const, ville: 'Khenifra', email: 'karim.alami@gmail.com' },
];

function generateMatriculeMaroc(): string {
  const prefix = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  const num1 = Math.floor(Math.random() * 10);
  const num2 = Math.floor(Math.random() * 10);
  const num3 = Math.floor(Math.random() * 10);
  const num4 = Math.floor(Math.random() * 10);
  const suffix = Math.floor(Math.random() * 100);
  return `${prefix}${num1}${num2}${num3}${num4}-${suffix.toString().padStart(2, '0')}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhoneMaroc(): string {
  const prefixes = ['06', '07'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}${num}`;
}

function removeUndefinedFields(obj: any): any {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !(obj[key] instanceof Date) && !(obj[key] instanceof Timestamp)) {
        cleaned[key] = removeUndefinedFields(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }
  }
  return cleaned;
}

export default function ClearAndSeedPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [executing, setExecuting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [summary, setSummary] = useState<any>(null);

  // Vérifier que l'utilisateur est admin
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleClearAndSeed = async () => {
    if (!confirm('⚠️ ATTENTION : Cette action va supprimer TOUTES les données existantes et générer de nouvelles données de démonstration.\n\nÊtes-vous sûr de vouloir continuer ?')) {
      return;
    }

    setExecuting(true);
    setSuccess(false);
    setError(null);
    setProgress('');

    try {
      // 1. Supprimer toutes les données
      setProgress('🗑️ Suppression des données existantes...');
      const collections = [
        'camions', 'chauffeurs', 'clients', 'missions', 'assurances',
        'visitesTechniques', 'entretiens', 'depenses', 'recettes', 'factures',
        'stock', 'mouvementsStock', 'absences', 'kilometrages', 'pneus', 'reparations'
      ];

      for (const colName of collections) {
        try {
          const snapshot = await getDocs(collection(db, colName));
          const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
          setProgress(`🗑️ ${colName}: ${snapshot.docs.length} document(s) supprimé(s)`);
        } catch (err: any) {
          console.error(`Erreur suppression ${colName}:`, err);
        }
      }

      setProgress('✅ Toutes les données supprimées !\n🚀 Génération des nouvelles données...');

      // 2. Générer les données
      // Créer 3 camions
      setProgress('📦 Création des camions...');
      const camions: any[] = [];
      for (let i = 0; i < 3; i++) {
        const marque = marquesCamions[i];
        const modele = modelesCamions[marque as keyof typeof modelesCamions][i % 2];
        const dateAchat = randomDate(new Date(2022, 0, 1), new Date(2023, 11, 31));
        const kilometrageActuel = Math.floor(80000 + i * 50000);
        const couleurs = ['#0ea5e9', '#10b981', '#f59e0b'];
        
        const camionRef = await addDoc(collection(db, 'camions'), {
          matricule: generateMatriculeMaroc(),
          marque,
          modele,
          dateAchat: Timestamp.fromDate(dateAchat),
          etat: i === 2 ? 'en_maintenance' : 'actif',
          kilometrageActuel,
          couleur: couleurs[i],
          createdAt: Timestamp.fromDate(dateAchat),
        });
        camions.push({ id: camionRef.id });
      }

      // Créer des chauffeurs
      setProgress('👨‍✈️ Création des chauffeurs...');
      const chauffeurs: any[] = [];
      for (let i = 0; i < 5; i++) {
        const prenom = prenomsMaroc[i];
        const nom = nomsMaroc[i];
        const dateEmbauche = randomDate(new Date(2022, 0, 1), new Date(2024, 11, 31));
        const dateObtentionPermis = randomDate(new Date(2015, 0, 1), new Date(2020, 11, 31));
        const salaire = Math.floor(9000 + i * 1000);
        
        const chauffeurRef = await addDoc(collection(db, 'chauffeurs'), {
          prenom,
          nom,
          email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@example.ma`,
          telephone: generatePhoneMaroc(),
          permis: `PERMIS-${Math.floor(100000 + i * 100000)}`,
          dateObtentionPermis: Timestamp.fromDate(dateObtentionPermis),
          dateEmbauche: Timestamp.fromDate(dateEmbauche),
          typeContrat: i < 3 ? 'cdi' : 'cdd',
          salaire,
          actif: true,
          createdAt: Timestamp.fromDate(dateEmbauche),
        });
        chauffeurs.push({ id: chauffeurRef.id });
      }

      // Créer des clients
      setProgress('🏢 Création des clients...');
      const clients: any[] = [];
      for (const clientInfo of clientsMaroc) {
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const createdAt = randomDate(oneYearAgo, today);
        
        const clientData: any = {
          ...clientInfo,
          telephone: generatePhoneMaroc(),
          adresse: `Rue ${Math.floor(10 + Math.random() * 90)}, ${clientInfo.ville}`,
          ville: clientInfo.ville,
          codePostal: String(Math.floor(10000 + Math.random() * 90000)),
          pays: 'Maroc',
          solde: 0,
          createdAt: Timestamp.fromDate(createdAt),
          updatedAt: Timestamp.fromDate(createdAt),
        };
        
        if (clientInfo.type === 'entreprise') {
          clientData.numeroTVA = `TVA${Math.floor(100000000 + Math.random() * 900000000)}`;
          clientData.siret = `RC${Math.floor(100000 + Math.random() * 900000)}`;
        }
        
        const cleanedData = removeUndefinedFields(clientData);
        const clientRef = await addDoc(collection(db, 'clients'), cleanedData);
        clients.push({ id: clientRef.id });
      }

      // Créer des missions
      setProgress('🗺️ Création des missions...');
      const trajetsSpeciaux = [
        { depart: 'Khenifra', destination: 'El Jadida' },
        { depart: 'El Jadida', destination: 'Khenifra' },
        { depart: 'Khenifra', destination: 'Casablanca' },
        { depart: 'Casablanca', destination: 'El Jadida' },
        { depart: 'El Jadida', destination: 'Rabat' },
        { depart: 'Rabat', destination: 'Khenifra' },
      ];
      
      const missions: any[] = [];
      for (let i = 0; i < 12; i++) {
        const trajet = i < trajetsSpeciaux.length ? trajetsSpeciaux[i] : trajetsSpeciaux[i % trajetsSpeciaux.length];
        const camion = camions[i % camions.length];
        const chauffeur = chauffeurs[i % chauffeurs.length];
        
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateDebut = randomDate(thirtyDaysAgo, today);
        const dateFin = new Date(dateDebut);
        dateFin.setDate(dateFin.getDate() + Math.floor(1 + Math.random() * 2));
        
        const distance = Math.floor(200 + Math.random() * 300);
        const carburant = Math.floor(distance * 0.35);
        const prixCarburant = carburant * 12.5;
        const peage = Math.floor(80 + Math.random() * 150);
        const repas = Math.floor(120 + Math.random() * 150);
        const autre = Math.floor(50 + Math.random() * 100);
        
        const statut = i < 2 ? 'en_cours' : i < 10 ? 'termine' : 'planifie';
        
        const missionData: any = {
          depart: trajet.depart,
          destination: trajet.destination,
          dateDebut: Timestamp.fromDate(dateDebut),
          camionId: camion.id,
          chauffeurId: chauffeur.id,
          statut,
          coutEstime: {
            carburant: prixCarburant,
            peage,
            repas,
            autre,
          },
          createdAt: Timestamp.fromDate(dateDebut),
        };
        
        if (statut !== 'planifie') {
          missionData.dateFin = Timestamp.fromDate(dateFin);
        }
        
        if (statut === 'termine') {
          missionData.recette = Math.floor(6000 + Math.random() * 6000); // Augmenté à 6000-12000
        }
        
        const cleanedData = removeUndefinedFields(missionData);
        const missionRef = await addDoc(collection(db, 'missions'), cleanedData);
        missions.push({ id: missionRef.id, ...cleanedData });
      }

      // Créer des assurances
      setProgress('🛡️ Création des assurances...');
      for (const camion of camions) {
        const today = new Date();
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const dateDebut = randomDate(sixMonthsAgo, today);
        const dateFin = new Date(dateDebut);
        dateFin.setFullYear(dateFin.getFullYear() + 1);
        
        await addDoc(collection(db, 'assurances'), {
          camionId: camion.id,
          numero: `ASS-${Math.floor(100000 + Math.random() * 900000)}`,
          compagnie: ['Wafa Assurance', 'AXA Assurance Maroc', 'RMA Watanya'][Math.floor(Math.random() * 3)],
          dateDebut: Timestamp.fromDate(dateDebut),
          dateFin: Timestamp.fromDate(dateFin),
          montant: Math.floor(18000 + Math.random() * 7000),
          createdAt: Timestamp.fromDate(dateDebut),
        });
      }

      // Créer des visites techniques
      setProgress('📋 Création des visites techniques...');
      for (const camion of camions) {
        const today = new Date();
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const date = randomDate(threeMonthsAgo, today);
        const prochaineDate = new Date(date);
        prochaineDate.setMonth(prochaineDate.getMonth() + 6);
        
        await addDoc(collection(db, 'visitesTechniques'), {
          camionId: camion.id,
          date: Timestamp.fromDate(date),
          prochaineDate: Timestamp.fromDate(prochaineDate),
          resultat: 'valide',
          createdAt: Timestamp.fromDate(date),
        });
      }

      // Créer des entretiens
      setProgress('🔧 Création des entretiens...');
      for (const camion of camions) {
        for (let i = 0; i < 2; i++) {
          const today = new Date();
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const date = randomDate(thirtyDaysAgo, today);
          const type = i === 0 ? 'vidange' : 'reparation';
          
          await addDoc(collection(db, 'entretiens'), {
            camionId: camion.id,
            type,
            date: Timestamp.fromDate(date),
            description: type === 'vidange' ? 'Vidange moteur et remplacement filtres' : 'Réparation système de freinage',
            cout: type === 'reparation' ? Math.floor(3500 + Math.random() * 2000) : Math.floor(600 + Math.random() * 400),
            createdAt: Timestamp.fromDate(date),
          });
        }
      }

      // Créer des dépenses
      setProgress('💰 Création des dépenses...');
      for (let i = 0; i < 15; i++) {
        const type = ['carburant', 'entretien', 'salaire'][i % 3];
        const camion = camions[i % camions.length];
        
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const date = randomDate(thirtyDaysAgo, today);
        
        let montant = 0;
        let description = '';
        
        if (type === 'carburant') {
          montant = Math.floor(800 + Math.random() * 1000); // Réduit à 800-1800
          description = `Carburant - Station ${['Shell', 'Total', 'Afriquia'][Math.floor(Math.random() * 3)]}`;
        } else if (type === 'entretien') {
          montant = Math.floor(800 + Math.random() * 1200); // Réduit à 800-2000
          description = `Entretien - Garage Central`;
        } else {
          montant = Math.floor(6000 + Math.random() * 1500); // Réduit à 6000-7500
          description = `Salaire chauffeur`;
        }
        
        const depenseData: any = {
          type,
          date: Timestamp.fromDate(date),
          montant,
          description,
          createdAt: Timestamp.fromDate(date),
        };
        
        if (type !== 'salaire') {
          depenseData.camionId = camion.id;
        }
        
        const cleanedData = removeUndefinedFields(depenseData);
        await addDoc(collection(db, 'depenses'), cleanedData);
      }

      // Créer des recettes pour les missions terminées
      setProgress('💵 Création des recettes...');
      const missionsTerminees = missions.filter((m: any) => m.statut === 'termine' && m.recette);
      
      // Récupérer les clients depuis Firestore pour avoir leurs noms
      const clientsSnap = await getDocs(collection(db, 'clients'));
      const clientsData = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let recettesCount = 0;
      for (const mission of missionsTerminees) {
        const client = clientsData[Math.floor(Math.random() * clientsData.length)];
        
        const recetteData: any = {
          type: 'mission',
          date: mission.dateDebut,
          montant: mission.recette,
          description: `Mission ${mission.depart} → ${mission.destination}`,
          client: client.nom || 'Client',
          missionId: mission.id,
          createdAt: mission.dateDebut,
        };
        
        const cleanedData = removeUndefinedFields(recetteData);
        await addDoc(collection(db, 'recettes'), cleanedData);
        recettesCount++;
      }

      setSuccess(true);
      setSummary({
        camions: 3,
        chauffeurs: 5,
        clients: clientsMaroc.length,
        missions: 12,
        depenses: 15,
        recettes: recettesCount,
      });
      setProgress('✅ Toutes les données ont été générées avec succès !');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Erreur lors de l\'opération');
      setProgress('');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3 sm:space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="text-primary-600" />
          Administration - Réinitialisation
        </h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
          Supprimer toutes les données et générer des données de démonstration
        </p>
      </div>

      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-red-900 mb-2">⚠️ ATTENTION</h2>
            <p className="text-sm sm:text-base text-red-800 mb-2">
              Cette action va <strong>supprimer TOUTES les données existantes</strong> et générer de nouvelles données de démonstration.
            </p>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>Tous les camions, chauffeurs, clients seront supprimés</li>
              <li>Toutes les missions, dépenses, recettes seront supprimées</li>
              <li>Cette action est <strong>irréversible</strong></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Données qui seront créées :</h2>
          <ul className="space-y-2 text-sm sm:text-base text-gray-700">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>3 camions</strong> avec matricules marocains</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>5 chauffeurs</strong> marocains</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>4 clients</strong> (entreprises et particuliers)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>12 missions</strong> entre villes marocaines (dates dans les 30 derniers jours)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>Assurances, visites techniques, entretiens</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>15 dépenses</strong> (carburant, entretien, salaires)</span>
            </li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm sm:text-base text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm sm:text-base font-semibold text-green-800">
                {progress || 'Données générées avec succès ! Redirection...'}
              </p>
            </div>
            {summary && (
              <div className="text-sm sm:text-base text-green-700 space-y-1">
                <p>✓ {summary.camions} camions</p>
                <p>✓ {summary.chauffeurs} chauffeurs</p>
                <p>✓ {summary.clients} clients</p>
                <p>✓ {summary.missions} missions</p>
                <p>✓ {summary.depenses} dépenses</p>
                {summary.recettes && <p>✓ {summary.recettes} recettes</p>}
              </div>
            )}
          </div>
        )}

        {progress && !success && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-sm sm:text-base text-blue-800 whitespace-pre-line">{progress}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleClearAndSeed}
          disabled={executing}
          className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {executing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Exécution en cours...</span>
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5" />
              <span>Supprimer et régénérer les données</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

