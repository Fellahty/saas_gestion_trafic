'use client';

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase.config';
import { Loader2, CheckCircle, XCircle, Database } from 'lucide-react';

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

// Fonction utilitaire pour supprimer les champs undefined d'un objet
function removeUndefinedFields(obj: any): any {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !(obj[key] instanceof Date) && !(obj[key] instanceof Timestamp)) {
        // Récursif pour les objets imbriqués
        cleaned[key] = removeUndefinedFields(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }
  }
  return cleaned;
}

export default function SeedDemoPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const handleSeed = async () => {
    if (!confirm('Êtes-vous sûr de vouloir générer des données de démonstration ?\n\nCette action va ajouter des données à votre base Firebase.')) {
      return;
    }

    setLoading(true);
    setSuccess(false);
    setError(null);
    setSummary(null);

    try {
      console.log('🚀 Génération des données de démonstration...');

      // 1. Créer 3 camions
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

      // 2. Créer des chauffeurs
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

      // 3. Créer des clients
      const clients: any[] = [];
      for (const clientInfo of clientsMaroc) {
        const createdAt = randomDate(new Date(2023, 0, 1), new Date());
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
        
        // Ajouter les champs conditionnels seulement s'ils ne sont pas undefined
        if (clientInfo.type === 'entreprise') {
          clientData.numeroTVA = `TVA${Math.floor(100000000 + Math.random() * 900000000)}`;
          clientData.siret = `RC${Math.floor(100000 + Math.random() * 900000)}`;
        }
        
        // Nettoyer l'objet avant l'insertion
        const cleanedData = removeUndefinedFields(clientData);
        const clientRef = await addDoc(collection(db, 'clients'), cleanedData);
        clients.push({ id: clientRef.id });
      }

      // 4. Créer des missions Khenifra - El Jadida
      const trajetsSpeciaux = [
        { depart: 'Khenifra', destination: 'El Jadida' },
        { depart: 'El Jadida', destination: 'Khenifra' },
        { depart: 'Khenifra', destination: 'Casablanca' },
        { depart: 'Casablanca', destination: 'El Jadida' },
        { depart: 'El Jadida', destination: 'Rabat' },
        { depart: 'Rabat', destination: 'Khenifra' },
      ];
      
      for (let i = 0; i < 12; i++) {
        const trajet = i < trajetsSpeciaux.length ? trajetsSpeciaux[i] : trajetsSpeciaux[i % trajetsSpeciaux.length];
        const camion = camions[i % camions.length];
        const chauffeur = chauffeurs[i % chauffeurs.length];
        // Générer des dates dans le passé récent (30 derniers jours)
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
        
        // Plus de missions terminées récemment pour avoir des données intéressantes
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
        
        // Ajouter dateFin seulement si la mission n'est pas planifiée
        if (statut !== 'planifie') {
          missionData.dateFin = Timestamp.fromDate(dateFin);
        }
        
        // Ajouter recette seulement si la mission est terminée
        if (statut === 'termine') {
          missionData.recette = Math.floor(3500 + Math.random() * 4000);
        }
        
        // Nettoyer l'objet avant l'insertion
        const cleanedData = removeUndefinedFields(missionData);
        await addDoc(collection(db, 'missions'), cleanedData);
      }

      // 5. Créer des assurances
      for (const camion of camions) {
        // Date début dans les 6 derniers mois
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

      // 6. Créer des visites techniques
      for (const camion of camions) {
        // Date dans les 3 derniers mois
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

      // 7. Créer des entretiens
      for (const camion of camions) {
        for (let i = 0; i < 2; i++) {
          // Date dans les 30 derniers jours
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

      // 8. Créer des dépenses
      for (let i = 0; i < 15; i++) {
        const type = ['carburant', 'entretien', 'salaire'][i % 3];
        const camion = camions[i % camions.length];
        // Générer des dates dans les 30 derniers jours
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const date = randomDate(thirtyDaysAgo, today);
        
        let montant = 0;
        let description = '';
        
        if (type === 'carburant') {
          montant = Math.floor(800 + Math.random() * 1500);
          description = `Carburant - Station ${['Shell', 'Total', 'Afriquia'][Math.floor(Math.random() * 3)]}`;
        } else if (type === 'entretien') {
          montant = Math.floor(1500 + Math.random() * 2500);
          description = `Entretien - Garage Central`;
        } else {
          montant = Math.floor(9000 + Math.random() * 3000);
          description = `Salaire chauffeur`;
        }
        
        const depenseData: any = {
          type,
          date: Timestamp.fromDate(date),
          montant,
          description,
          createdAt: Timestamp.fromDate(date),
        };
        
        // Ajouter camionId seulement si ce n'est pas un salaire
        if (type !== 'salaire') {
          depenseData.camionId = camion.id;
        }
        
        // Nettoyer l'objet avant l'insertion
        const cleanedData = removeUndefinedFields(depenseData);
        await addDoc(collection(db, 'depenses'), cleanedData);
      }

      setSuccess(true);
      setSummary({
        camions: 3,
        chauffeurs: 5,
        clients: clientsMaroc.length,
        missions: 12,
        depenses: 15,
      });
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-3 sm:space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="text-primary-600" />
          Données de démonstration
        </h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
          Générez des données réalistes pour présenter la plateforme
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Données qui seront créées :</h2>
          <ul className="space-y-2 text-sm sm:text-base text-gray-700">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>3 camions</strong> avec matricules marocains (Mercedes-Benz, Volvo, Scania)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>5 chauffeurs</strong> marocains avec contrats et permis</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>4 clients</strong> (entreprises et particuliers marocains)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>12 missions</strong> entre villes marocaines (Khenifra ↔ El Jadida, Casablanca, Rabat, etc.)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>Assurances, visites techniques, entretiens</strong> pour chaque camion</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>15 dépenses</strong> (carburant, entretien, salaires)</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm sm:text-base text-blue-800">
            <strong>Note :</strong> Ces données sont générées avec des informations réalistes pour le Maroc :
            villes marocaines, matricules marocains, noms marocains, prix en MAD, etc.
          </p>
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
                Données générées avec succès !
              </p>
            </div>
            {summary && (
              <div className="text-sm sm:text-base text-green-700 space-y-1">
                <p>✓ {summary.camions} camions</p>
                <p>✓ {summary.chauffeurs} chauffeurs</p>
                <p>✓ {summary.clients} clients</p>
                <p>✓ {summary.missions} missions</p>
                <p>✓ {summary.depenses} dépenses</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Génération en cours...</span>
            </>
          ) : (
            <>
              <Database className="w-5 h-5" />
              <span>Générer les données de démonstration</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

