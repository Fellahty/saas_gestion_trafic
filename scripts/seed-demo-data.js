/**
 * Script de génération de données de démonstration (version Node.js)
 * Pour exécuter: node scripts/seed-demo-data.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

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
  { nom: 'Tanger', region: 'Tanger-Tétouan-Al Hoceïma' },
  { nom: 'Agadir', region: 'Souss-Massa' },
  { nom: 'Oujda', region: 'Oriental' },
];

const marquesCamions = ['Mercedes-Benz', 'Volvo', 'Scania', 'MAN', 'Iveco', 'Renault'];
const modelesCamions = {
  'Mercedes-Benz': ['Actros', 'Atego', 'Axor'],
  'Volvo': ['FH', 'FM', 'FMX'],
  'Scania': ['R Series', 'P Series', 'G Series'],
  'MAN': ['TGX', 'TGS', 'TGL'],
  'Iveco': ['Stralis', 'Tector', 'Hi-Way'],
  'Renault': ['T Range', 'C Range', 'K Range'],
};

const prenomsMaroc = ['Ahmed', 'Mohamed', 'Hassan', 'Youssef', 'Omar', 'Ali', 'Karim', 'Mehdi', 'Said', 'Rachid'];
const nomsMaroc = ['Alami', 'Benali', 'Idrissi', 'Bennani', 'Tazi', 'Fassi', 'Berrada', 'Lahlou', 'Sbihi', 'Amrani'];

const clientsMaroc = [
  { nom: 'Transports ATLAS', type: 'entreprise', ville: 'Casablanca', email: 'contact@transportsatlas.ma' },
  { nom: 'Logistique Maroc Express', type: 'entreprise', ville: 'Rabat', email: 'info@lmexpress.ma' },
  { nom: 'Transport Oum Er-Rbia', type: 'entreprise', ville: 'El Jadida', email: 'contact@toer.ma' },
  { nom: 'Karim Alami', type: 'particulier', ville: 'Khenifra', email: 'karim.alami@gmail.com' },
  { nom: 'Bennani Distribution', type: 'entreprise', ville: 'Fès', email: 'commercial@bennani.ma' },
  { nom: 'Youssef Tazi', type: 'particulier', ville: 'Marrakech', email: 'youssef.tazi@gmail.com' },
];

const fournisseursGarages = [
  'Garage Auto Express - Casablanca',
  'Service Technique Volvo - Rabat',
  'Garage Central - El Jadida',
  'Maintenance Pro - Khenifra',
  'Atelier Mécanique Atlas - Fès',
];

const compagniesAssurance = [
  'Wafa Assurance',
  'AXA Assurance Maroc',
  'RMA Watanya',
  'Allianz Maroc',
  'Atlanta Assurance',
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

async function seedDemoData() {
  console.log('🚀 Génération des données de démonstration...\n');

  try {
    // 1. Créer 3 camions
    console.log('📦 Création des camions...');
    const camions = [];
    
    for (let i = 0; i < 3; i++) {
      const marque = marquesCamions[Math.floor(Math.random() * marquesCamions.length)];
      const modele = modelesCamions[marque][Math.floor(Math.random() * modelesCamions[marque].length)];
      const dateAchat = randomDate(new Date(2020, 0, 1), new Date(2023, 11, 31));
      const kilometrageActuel = Math.floor(50000 + Math.random() * 200000);
      const couleurs = ['#0ea5e9', '#10b981', '#f59e0b'];
      const etats = ['actif', 'actif', 'en_maintenance'];
      
      const camionData = {
        matricule: generateMatriculeMaroc(),
        marque,
        modele,
        dateAchat: Timestamp.fromDate(dateAchat),
        etat: etats[i],
        kilometrageActuel,
        couleur: couleurs[i],
        createdAt: Timestamp.fromDate(dateAchat),
      };

      const camionRef = await addDoc(collection(db, 'camions'), camionData);
      camions.push({ id: camionRef.id, ...camionData, dateAchat, createdAt: dateAchat });
      console.log(`  ✅ Camion créé: ${camionData.matricule} - ${marque} ${modele}`);
    }

    // 2. Créer des chauffeurs
    console.log('\n👨‍✈️ Création des chauffeurs...');
    const chauffeurs = [];
    
    for (let i = 0; i < 5; i++) {
      const prenom = prenomsMaroc[Math.floor(Math.random() * prenomsMaroc.length)];
      const nom = nomsMaroc[Math.floor(Math.random() * nomsMaroc.length)];
      const dateEmbauche = randomDate(new Date(2021, 0, 1), new Date(2024, 11, 31));
      const dateObtentionPermis = randomDate(new Date(2015, 0, 1), new Date(2020, 11, 31));
      const salaire = Math.floor(8000 + Math.random() * 5000);
      
      const chauffeurData = {
        prenom,
        nom,
        email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@example.ma`,
        telephone: generatePhoneMaroc(),
        permis: `PERMIS-${Math.floor(100000 + Math.random() * 900000)}`,
        dateObtentionPermis: Timestamp.fromDate(dateObtentionPermis),
        dateEmbauche: Timestamp.fromDate(dateEmbauche),
        typeContrat: ['cdi', 'cdi', 'cdd'][Math.floor(Math.random() * 3)],
        salaire,
        actif: true,
        createdAt: Timestamp.fromDate(dateEmbauche),
      };

      const chauffeurRef = await addDoc(collection(db, 'chauffeurs'), chauffeurData);
      chauffeurs.push({ id: chauffeurRef.id, ...chauffeurData, dateEmbauche, dateObtentionPermis });
      console.log(`  ✅ Chauffeur créé: ${prenom} ${nom}`);
    }

    // 3. Créer des clients
    console.log('\n🏢 Création des clients...');
    const clients = [];
    
    for (const clientInfo of clientsMaroc) {
      const createdAt = randomDate(new Date(2022, 0, 1), new Date());
      const client = {
        ...clientInfo,
        telephone: generatePhoneMaroc(),
        adresse: `Rue ${Math.floor(10 + Math.random() * 90)}, ${clientInfo.ville}`,
        ville: clientInfo.ville,
        codePostal: String(Math.floor(10000 + Math.random() * 90000)),
        pays: 'Maroc',
        numeroTVA: clientInfo.type === 'entreprise' ? `TVA${Math.floor(100000000 + Math.random() * 900000000)}` : undefined,
        siret: clientInfo.type === 'entreprise' ? `RC${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        solde: 0,
        createdAt: Timestamp.fromDate(createdAt),
        updatedAt: Timestamp.fromDate(createdAt),
      };

      const clientRef = await addDoc(collection(db, 'clients'), client);
      clients.push({ id: clientRef.id, ...client, createdAt });
      console.log(`  ✅ Client créé: ${clientInfo.nom}`);
    }

    // 4. Créer des assurances
    console.log('\n🛡️ Création des assurances...');
    for (const camion of camions) {
      const dateDebut = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));
      const dateFin = new Date(dateDebut);
      dateFin.setFullYear(dateFin.getFullYear() + 1);
      
      const assuranceData = {
        camionId: camion.id,
        numero: `ASS-${Math.floor(100000 + Math.random() * 900000)}`,
        compagnie: compagniesAssurance[Math.floor(Math.random() * compagniesAssurance.length)],
        dateDebut: Timestamp.fromDate(dateDebut),
        dateFin: Timestamp.fromDate(dateFin),
        montant: Math.floor(15000 + Math.random() * 10000),
        createdAt: Timestamp.fromDate(dateDebut),
      };

      await addDoc(collection(db, 'assurances'), assuranceData);
      console.log(`  ✅ Assurance créée pour ${camion.matricule}`);
    }

    // 5. Créer des visites techniques
    console.log('\n📋 Création des visites techniques...');
    for (const camion of camions) {
      const date = randomDate(new Date(2024, 0, 1), new Date());
      const prochaineDate = new Date(date);
      prochaineDate.setMonth(prochaineDate.getMonth() + 6);
      
      const visiteData = {
        camionId: camion.id,
        date: Timestamp.fromDate(date),
        prochaineDate: Timestamp.fromDate(prochaineDate),
        resultat: ['valide', 'valide', 'non_valide'][Math.floor(Math.random() * 3)],
        createdAt: Timestamp.fromDate(date),
      };

      await addDoc(collection(db, 'visitesTechniques'), visiteData);
      console.log(`  ✅ Visite technique créée pour ${camion.matricule}`);
    }

    // 6. Créer des entretiens
    console.log('\n🔧 Création des entretiens...');
    for (const camion of camions) {
      for (let i = 0; i < 3; i++) {
        const date = randomDate(new Date(2024, 0, 1), new Date());
        const type = ['vidange', 'reparation', 'autre'][Math.floor(Math.random() * 3)];
        const descriptions = {
          vidange: 'Vidange moteur et remplacement filtres',
          reparation: 'Réparation système de freinage',
          autre: 'Révision générale',
        };
        
        const entretienData = {
          camionId: camion.id,
          type,
          date: Timestamp.fromDate(date),
          description: descriptions[type],
          cout: type === 'reparation' ? Math.floor(3000 + Math.random() * 5000) : Math.floor(500 + Math.random() * 1000),
          createdAt: Timestamp.fromDate(date),
        };

        await addDoc(collection(db, 'entretiens'), entretienData);
      }
      console.log(`  ✅ Entretiens créés pour ${camions.find(c => c.id === camion.id)?.matricule}`);
    }

    // 7. Créer des missions/trajets
    console.log('\n🗺️ Création des missions...');
    const missions = [];
    
    // Missions spécifiques Khenifra - El Jadida
    const trajetsSpeciaux = [
      { depart: 'Khenifra', destination: 'El Jadida' },
      { depart: 'El Jadida', destination: 'Khenifra' },
      { depart: 'Khenifra', destination: 'Casablanca' },
      { depart: 'Casablanca', destination: 'El Jadida' },
      { depart: 'El Jadida', destination: 'Rabat' },
    ];
    
    for (let i = 0; i < 15; i++) {
      let villeDepart, villeDestination;
      if (i < trajetsSpeciaux.length) {
        villeDepart = villesMaroc.find(v => v.nom === trajetsSpeciaux[i].depart);
        villeDestination = villesMaroc.find(v => v.nom === trajetsSpeciaux[i].destination);
      } else {
        villeDepart = villesMaroc[Math.floor(Math.random() * villesMaroc.length)];
        villeDestination = villesMaroc[Math.floor(Math.random() * villesMaroc.length)];
        while (villeDestination.nom === villeDepart.nom) {
          villeDestination = villesMaroc[Math.floor(Math.random() * villesMaroc.length)];
        }
      }
      
      const camion = camions[Math.floor(Math.random() * camions.length)];
      const chauffeur = chauffeurs[Math.floor(Math.random() * chauffeurs.length)];
      const dateDebut = randomDate(new Date(2024, 10, 1), new Date());
      const dateFin = new Date(dateDebut);
      dateFin.setDate(dateFin.getDate() + Math.floor(1 + Math.random() * 3));
      
      const distance = Math.floor(150 + Math.random() * 400);
      const carburant = Math.floor(distance * 0.35);
      const prixCarburant = carburant * 12.5;
      const peage = Math.floor(50 + Math.random() * 200);
      const repas = Math.floor(100 + Math.random() * 200);
      const autre = Math.floor(50 + Math.random() * 150);
      
      const statut = i < 3 ? 'en_cours' : i < 10 ? 'termine' : 'planifie';
      const recette = statut === 'termine' ? Math.floor(3000 + Math.random() * 5000) : undefined;
      
      const missionData = {
        depart: villeDepart.nom,
        destination: villeDestination.nom,
        dateDebut: Timestamp.fromDate(dateDebut),
        dateFin: statut !== 'planifie' ? Timestamp.fromDate(dateFin) : undefined,
        camionId: camion.id,
        chauffeurId: chauffeur.id,
        statut,
        coutEstime: {
          carburant: prixCarburant,
          peage,
          repas,
          autre,
        },
        recette,
        createdAt: Timestamp.fromDate(dateDebut),
      };

      const missionRef = await addDoc(collection(db, 'missions'), missionData);
      missions.push({ id: missionRef.id, ...missionData, dateDebut, dateFin: statut !== 'planifie' ? dateFin : undefined });
      console.log(`  ✅ Mission créée: ${villeDepart.nom} → ${villeDestination.nom}`);
    }

    // 8. Créer des dépenses
    console.log('\n💰 Création des dépenses...');
    const typesDepenses = ['carburant', 'entretien', 'salaire', 'achat', 'autre'];
    
    for (let i = 0; i < 20; i++) {
      const type = typesDepenses[Math.floor(Math.random() * typesDepenses.length)];
      const camion = camions[Math.floor(Math.random() * camions.length)];
      const date = randomDate(new Date(2024, 0, 1), new Date());
      
      let montant = 0;
      let description = '';
      
      switch (type) {
        case 'carburant':
          montant = Math.floor(500 + Math.random() * 2000);
          description = `Carburant - Station ${['Shell', 'Total', 'Afriquia'][Math.floor(Math.random() * 3)]}`;
          break;
        case 'entretien':
          montant = Math.floor(1000 + Math.random() * 3000);
          description = `Entretien - ${fournisseursGarages[Math.floor(Math.random() * fournisseursGarages.length)]}`;
          break;
        case 'salaire':
          montant = Math.floor(8000 + Math.random() * 5000);
          const chauffeur = chauffeurs[Math.floor(Math.random() * chauffeurs.length)];
          description = `Salaire chauffeur - ${chauffeur.prenom} ${chauffeur.nom}`;
          break;
        case 'achat':
          montant = Math.floor(200 + Math.random() * 1000);
          description = `Achat pièces détachées`;
          break;
        default:
          montant = Math.floor(100 + Math.random() * 500);
          description = `Autre dépense`;
      }
      
      const depenseData = {
        type,
        date: Timestamp.fromDate(date),
        montant,
        description,
        camionId: type === 'carburant' || type === 'entretien' ? camion.id : undefined,
        createdAt: Timestamp.fromDate(date),
      };

      await addDoc(collection(db, 'depenses'), depenseData);
    }
    console.log('  ✅ 20 dépenses créées');

    // 9. Créer des recettes
    console.log('\n💵 Création des recettes...');
    const missionsAvecRecette = missions.filter(m => m.recette);
    for (const mission of missionsAvecRecette) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      
      const recetteData = {
        type: 'mission',
        date: mission.dateDebut,
        montant: mission.recette,
        description: `Mission ${mission.depart} → ${mission.destination}`,
        client: client.nom,
        missionId: mission.id,
        createdAt: mission.dateDebut,
      };

      await addDoc(collection(db, 'recettes'), recetteData);
    }
    console.log(`  ✅ ${missionsAvecRecette.length} recettes créées`);

    // 10. Créer des factures
    console.log('\n📄 Création des factures...');
    for (let i = 0; i < 8; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const mission = missionsAvecRecette[Math.floor(Math.random() * missionsAvecRecette.length)];
      const dateEmission = randomDate(new Date(2024, 10, 1), new Date());
      const dateEcheance = new Date(dateEmission);
      dateEcheance.setDate(dateEcheance.getDate() + 30);
      
      const numero = `FACT-2025-${String(i + 1).padStart(3, '0')}`;
      const prixUnitaire = Math.floor(2000 + Math.random() * 3000);
      const quantite = 1;
      const tva = 20;
      const totalHT = prixUnitaire * quantite;
      const totalTVA = totalHT * (tva / 100);
      const totalTTC = totalHT + totalTVA;
      const montantPaye = Math.random() > 0.3 ? totalTTC : Math.floor(totalTTC * (0.5 + Math.random() * 0.5));
      const montantRestant = totalTTC - montantPaye;
      
      const lignes = [
        {
          description: `Transport ${mission?.depart || 'Départ'} → ${mission?.destination || 'Destination'}`,
          quantite,
          prixUnitaire,
          tva,
          total: totalHT,
        },
      ];
      
      const statut = montantRestant === 0 ? 'payee' : montantPaye > 0 ? 'partiellement_payee' : 'envoyee';
      
      const factureData = {
        numero,
        clientId: client.id,
        dateEmission: Timestamp.fromDate(dateEmission),
        dateEcheance: Timestamp.fromDate(dateEcheance),
        statut,
        type: 'facture',
        lignes,
        totalHT,
        totalTVA,
        totalTTC,
        montantPaye,
        montantRestant,
        conditionsPaiement: '30 jours',
        missionId: mission?.id,
        createdAt: Timestamp.fromDate(dateEmission),
        updatedAt: Timestamp.fromDate(dateEmission),
      };

      await addDoc(collection(db, 'factures'), factureData);
      console.log(`  ✅ Facture créée: ${numero} - ${client.nom}`);
    }

    console.log('\n✅ Données de démonstration générées avec succès !\n');
    console.log('📊 Résumé :');
    console.log(`   - 3 camions`);
    console.log(`   - 5 chauffeurs`);
    console.log(`   - ${clients.length} clients`);
    console.log(`   - ${missions.length} missions (dont trajets Khenifra ↔ El Jadida)`);
    console.log(`   - 20 dépenses`);
    console.log(`   - ${missionsAvecRecette.length} recettes`);
    console.log(`   - 8 factures`);
    console.log('\n🎯 Les données sont maintenant disponibles dans votre base Firebase !');

  } catch (error) {
    console.error('❌ Erreur lors de la génération des données:', error);
    throw error;
  }
}

// Exécuter
seedDemoData()
  .then(() => {
    console.log('\n✅ Terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });

