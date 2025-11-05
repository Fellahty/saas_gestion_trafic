/**
 * Script pour supprimer toutes les données et générer des données de démonstration
 * Usage: node scripts/clear-and-seed.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, addDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA03A1KRYQ5gqYmB2ywCXytKRoCUcTFXv0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "trucksaas.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "trucksaas",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "trucksaas.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "816010012119",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:816010012119:web:e824b909c2d346783c1792",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
  { nom: 'Transports ATLAS', type: 'entreprise', ville: 'Casablanca', email: 'contact@transportsatlas.ma' },
  { nom: 'Logistique Maroc Express', type: 'entreprise', ville: 'Rabat', email: 'info@lmexpress.ma' },
  { nom: 'Transport Oum Er-Rbia', type: 'entreprise', ville: 'El Jadida', email: 'contact@toer.ma' },
  { nom: 'Karim Alami', type: 'particulier', ville: 'Khenifra', email: 'karim.alami@gmail.com' },
];

function generateMatriculeMaroc() {
  const prefix = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  const num1 = Math.floor(Math.random() * 10);
  const num2 = Math.floor(Math.random() * 10);
  const num3 = Math.floor(Math.random() * 10);
  const num4 = Math.floor(Math.random() * 10);
  const suffix = Math.floor(Math.random() * 100);
  return `${prefix}${num1}${num2}${num3}${num4}-${suffix.toString().padStart(2, '0')}`;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhoneMaroc() {
  const prefixes = ['06', '07'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}${num}`;
}

// Fonction pour supprimer les champs undefined
function removeUndefinedFields(obj) {
  const cleaned = {};
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

// Supprimer toutes les données
async function clearAllData() {
  console.log('🗑️  Suppression des données existantes...\n');
  
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
      console.log(`  ✅ ${colName}: ${snapshot.docs.length} document(s) supprimé(s)`);
    } catch (error) {
      console.log(`  ⚠️  ${colName}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Toutes les données ont été supprimées !\n');
}

// Générer les données de démonstration
async function generateDemoData() {
  console.log('🚀 Génération des données de démonstration...\n');

  try {
    // 1. Créer 3 camions
    console.log('📦 Création des camions...');
    const camions = [];
    
    for (let i = 0; i < 3; i++) {
      const marque = marquesCamions[i];
      const modele = modelesCamions[marque][i % 2];
      const dateAchat = randomDate(new Date(2022, 0, 1), new Date(2023, 11, 31));
      const kilometrageActuel = Math.floor(80000 + i * 50000);
      const couleurs = ['#0ea5e9', '#10b981', '#f59e0b'];
      
      const camionData = {
        matricule: generateMatriculeMaroc(),
        marque,
        modele,
        dateAchat: Timestamp.fromDate(dateAchat),
        etat: i === 2 ? 'en_maintenance' : 'actif',
        kilometrageActuel,
        couleur: couleurs[i],
        createdAt: Timestamp.fromDate(dateAchat),
      };

      const camionRef = await addDoc(collection(db, 'camions'), camionData);
      camions.push({ id: camionRef.id });
      console.log(`  ✅ Camion créé: ${camionData.matricule} - ${marque} ${modele}`);
    }

    // 2. Créer des chauffeurs
    console.log('\n👨‍✈️ Création des chauffeurs...');
    const chauffeurs = [];
    
    for (let i = 0; i < 5; i++) {
      const prenom = prenomsMaroc[i];
      const nom = nomsMaroc[i];
      const dateEmbauche = randomDate(new Date(2022, 0, 1), new Date(2024, 11, 31));
      const dateObtentionPermis = randomDate(new Date(2015, 0, 1), new Date(2020, 11, 31));
      const salaire = Math.floor(9000 + i * 1000);
      
      const chauffeurData = {
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
      };

      const chauffeurRef = await addDoc(collection(db, 'chauffeurs'), chauffeurData);
      chauffeurs.push({ id: chauffeurRef.id });
      console.log(`  ✅ Chauffeur créé: ${prenom} ${nom}`);
    }

    // 3. Créer des clients
    console.log('\n🏢 Création des clients...');
    const clients = [];
    
    for (const clientInfo of clientsMaroc) {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const createdAt = randomDate(oneYearAgo, today);
      
      const clientData = {
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
      console.log(`  ✅ Client créé: ${clientInfo.nom}`);
    }

    // 4. Créer des missions
    console.log('\n🗺️ Création des missions...');
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
      
      // Générer des dates dans les 30 derniers jours
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
      
      const missionData = {
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
        missionData.recette = Math.floor(3500 + Math.random() * 4000);
      }
      
      const cleanedData = removeUndefinedFields(missionData);
      await addDoc(collection(db, 'missions'), cleanedData);
      console.log(`  ✅ Mission créée: ${trajet.depart} → ${trajet.destination}`);
    }

    // 5. Créer des assurances
    console.log('\n🛡️ Création des assurances...');
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
      console.log(`  ✅ Assurance créée pour ${camion.id}`);
    }

    // 6. Créer des visites techniques
    console.log('\n📋 Création des visites techniques...');
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
      console.log(`  ✅ Visite technique créée pour ${camion.id}`);
    }

    // 7. Créer des entretiens
    console.log('\n🔧 Création des entretiens...');
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
      console.log(`  ✅ Entretiens créés pour ${camion.id}`);
    }

    // 8. Créer des dépenses
    console.log('\n💰 Création des dépenses...');
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
        montant = Math.floor(800 + Math.random() * 1500);
        description = `Carburant - Station ${['Shell', 'Total', 'Afriquia'][Math.floor(Math.random() * 3)]}`;
      } else if (type === 'entretien') {
        montant = Math.floor(1500 + Math.random() * 2500);
        description = `Entretien - Garage Central`;
      } else {
        montant = Math.floor(9000 + Math.random() * 3000);
        description = `Salaire chauffeur`;
      }
      
      const depenseData = {
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
    console.log('  ✅ 15 dépenses créées');

    console.log('\n✅ Données de démonstration générées avec succès !\n');
    console.log('📊 Résumé :');
    console.log(`   - 3 camions`);
    console.log(`   - 5 chauffeurs`);
    console.log(`   - ${clients.length} clients`);
    console.log(`   - 12 missions (Khenifra ↔ El Jadida)`);
    console.log(`   - Assurances, visites, entretiens`);
    console.log(`   - 15 dépenses`);
    console.log('\n🎯 Les données sont maintenant disponibles dans votre base Firebase !');

  } catch (error) {
    console.error('❌ Erreur lors de la génération des données:', error);
    throw error;
  }
}

// Fonction principale
async function main() {
  try {
    await clearAllData();
    await generateDemoData();
    console.log('\n✅ Terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter
main();

