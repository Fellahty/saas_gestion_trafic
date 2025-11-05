/**
 * Script de génération de données de démonstration
 * Génère des données réalistes pour une flotte marocaine
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase.config';
import { Camion, Chauffeur, Client, Mission, Assurance, VisiteTechnique, Entretien, Depense, Recette, Facture, LigneFacture } from '../lib/types';

// Données de base pour générer des exemples réalistes
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
  { nom: 'Transports ATLAS', type: 'entreprise' as const, ville: 'Casablanca', email: 'contact@transportsatlas.ma' },
  { nom: 'Logistique Maroc Express', type: 'entreprise' as const, ville: 'Rabat', email: 'info@lmexpress.ma' },
  { nom: 'Transport Oum Er-Rbia', type: 'entreprise' as const, ville: 'El Jadida', email: 'contact@toer.ma' },
  { nom: 'Karim Alami', type: 'particulier' as const, ville: 'Khenifra', email: 'karim.alami@gmail.com' },
  { nom: 'Bennani Distribution', type: 'entreprise' as const, ville: 'Fès', email: 'commercial@bennani.ma' },
  { nom: 'Youssef Tazi', type: 'particulier' as const, ville: 'Marrakech', email: 'youssef.tazi@gmail.com' },
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

// Générer un matricule marocain réaliste
function generateMatriculeMaroc(): string {
  const prefix = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'][Math.floor(Math.random() * 26)];
  const num1 = Math.floor(Math.random() * 10);
  const num2 = Math.floor(Math.random() * 10);
  const num3 = Math.floor(Math.random() * 10);
  const num4 = Math.floor(Math.random() * 10);
  const suffix = Math.floor(Math.random() * 100);
  return `${prefix}${num1}${num2}${num3}${num4}-${suffix.toString().padStart(2, '0')}`;
}

// Générer une date aléatoire dans une plage
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Générer un numéro de téléphone marocain
function generatePhoneMaroc(): string {
  const prefixes = ['06', '07'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}${num}`;
}

// Fonction principale pour générer les données
export async function seedDemoData() {
  console.log('🚀 Génération des données de démonstration...');

  try {
    // 1. Créer 3 camions
    console.log('📦 Création des camions...');
    const camions: Camion[] = [];
    
    for (let i = 0; i < 3; i++) {
      const marque = marquesCamions[Math.floor(Math.random() * marquesCamions.length)];
      const modele = modelesCamions[marque as keyof typeof modelesCamions][Math.floor(Math.random() * modelesCamions[marque as keyof typeof modelesCamions].length)];
      const dateAchat = randomDate(new Date(2020, 0, 1), new Date(2023, 11, 31));
      const kilometrageActuel = Math.floor(50000 + Math.random() * 200000);
      const couleurs = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#14b8a6'];
      
      const camionData: Omit<Camion, 'id'> = {
        matricule: generateMatriculeMaroc(),
        marque,
        modele,
        dateAchat,
        etat: ['actif', 'actif', 'en_maintenance'][i] as 'actif' | 'en_maintenance' | 'hors_service',
        kilometrageActuel,
        couleur: couleurs[i],
        createdAt: dateAchat,
      };

      const camionRef = await addDoc(collection(db, 'camions'), {
        ...camionData,
        dateAchat: Timestamp.fromDate(camionData.dateAchat),
        createdAt: Timestamp.fromDate(camionData.createdAt),
      });
      
      camions.push({ id: camionRef.id, ...camionData });
      console.log(`  ✅ Camion créé: ${camionData.matricule} - ${marque} ${modele}`);
    }

    // 2. Créer des chauffeurs
    console.log('👨‍✈️ Création des chauffeurs...');
    const chauffeurs: Chauffeur[] = [];
    
    for (let i = 0; i < 5; i++) {
      const prenom = prenomsMaroc[Math.floor(Math.random() * prenomsMaroc.length)];
      const nom = nomsMaroc[Math.floor(Math.random() * nomsMaroc.length)];
      const dateEmbauche = randomDate(new Date(2021, 0, 1), new Date(2024, 11, 31));
      const dateObtentionPermis = randomDate(new Date(2015, 0, 1), new Date(2020, 11, 31));
      const salaire = Math.floor(8000 + Math.random() * 5000);
      
      const chauffeurData: Omit<Chauffeur, 'id'> = {
        prenom,
        nom,
        email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@example.ma`,
        telephone: generatePhoneMaroc(),
        permis: `PERMIS-${Math.floor(100000 + Math.random() * 900000)}`,
        dateObtentionPermis,
        dateEmbauche,
        typeContrat: ['cdi', 'cdi', 'cdd'][Math.floor(Math.random() * 3)] as 'cdi' | 'cdd' | 'interim',
        salaire,
        actif: true,
        createdAt: dateEmbauche,
      };

      const chauffeurRef = await addDoc(collection(db, 'chauffeurs'), {
        ...chauffeurData,
        dateObtentionPermis: Timestamp.fromDate(chauffeurData.dateObtentionPermis),
        dateEmbauche: Timestamp.fromDate(chauffeurData.dateEmbauche),
        createdAt: Timestamp.fromDate(chauffeurData.createdAt),
      });
      
      chauffeurs.push({ id: chauffeurRef.id, ...chauffeurData });
      console.log(`  ✅ Chauffeur créé: ${prenom} ${nom}`);
    }

    // 3. Créer des clients
    console.log('🏢 Création des clients...');
    const clients: Client[] = [];
    
    for (const clientData of clientsMaroc) {
      const client: Omit<Client, 'id'> = {
        ...clientData,
        email: clientData.email,
        telephone: generatePhoneMaroc(),
        adresse: `Rue ${Math.floor(10 + Math.random() * 90)}, ${clientData.ville}`,
        ville: clientData.ville,
        codePostal: String(Math.floor(10000 + Math.random() * 90000)),
        pays: 'Maroc',
        numeroTVA: clientData.type === 'entreprise' ? `TVA${Math.floor(100000000 + Math.random() * 900000000)}` : undefined,
        siret: clientData.type === 'entreprise' ? `RC${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        solde: 0,
        createdAt: randomDate(new Date(2022, 0, 1), new Date()),
        updatedAt: new Date(),
      };

      const clientRef = await addDoc(collection(db, 'clients'), {
        ...client,
        createdAt: Timestamp.fromDate(client.createdAt),
        updatedAt: Timestamp.fromDate(client.updatedAt),
      });
      
      clients.push({ id: clientRef.id, ...client });
      console.log(`  ✅ Client créé: ${clientData.nom}`);
    }

    // 4. Créer des assurances
    console.log('🛡️ Création des assurances...');
    for (const camion of camions) {
      const dateDebut = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));
      const dateFin = new Date(dateDebut);
      dateFin.setFullYear(dateFin.getFullYear() + 1);
      
      const assuranceData: Omit<Assurance, 'id'> = {
        camionId: camion.id,
        numero: `ASS-${Math.floor(100000 + Math.random() * 900000)}`,
        compagnie: compagniesAssurance[Math.floor(Math.random() * compagniesAssurance.length)],
        dateDebut,
        dateFin,
        montant: Math.floor(15000 + Math.random() * 10000),
        createdAt: dateDebut,
      };

      await addDoc(collection(db, 'assurances'), {
        ...assuranceData,
        dateDebut: Timestamp.fromDate(assuranceData.dateDebut),
        dateFin: Timestamp.fromDate(assuranceData.dateFin),
        createdAt: Timestamp.fromDate(assuranceData.createdAt),
      });
      console.log(`  ✅ Assurance créée pour ${camion.matricule}`);
    }

    // 5. Créer des visites techniques
    console.log('📋 Création des visites techniques...');
    for (const camion of camions) {
      const date = randomDate(new Date(2024, 0, 1), new Date());
      const prochaineDate = new Date(date);
      prochaineDate.setMonth(prochaineDate.getMonth() + 6);
      
      const visiteData: Omit<VisiteTechnique, 'id'> = {
        camionId: camion.id,
        date,
        prochaineDate,
        resultat: ['valide', 'valide', 'non_valide'][Math.floor(Math.random() * 3)] as 'valide' | 'non_valide',
        createdAt: date,
      };

      await addDoc(collection(db, 'visitesTechniques'), {
        ...visiteData,
        date: Timestamp.fromDate(visiteData.date),
        prochaineDate: Timestamp.fromDate(visiteData.prochaineDate),
        createdAt: Timestamp.fromDate(visiteData.createdAt),
      });
      console.log(`  ✅ Visite technique créée pour ${camion.matricule}`);
    }

    // 6. Créer des entretiens
    console.log('🔧 Création des entretiens...');
    for (const camion of camions) {
      for (let i = 0; i < 3; i++) {
        const date = randomDate(new Date(2024, 0, 1), new Date());
        const type = ['vidange', 'reparation', 'autre'][Math.floor(Math.random() * 3)] as 'vidange' | 'reparation' | 'autre';
        const descriptions = {
          vidange: 'Vidange moteur et remplacement filtres',
          reparation: 'Réparation système de freinage',
          autre: 'Révision générale',
        };
        
        const entretienData: Omit<Entretien, 'id'> = {
          camionId: camion.id,
          type,
          date,
          description: descriptions[type],
          cout: type === 'reparation' ? Math.floor(3000 + Math.random() * 5000) : Math.floor(500 + Math.random() * 1000),
          createdAt: date,
        };

        await addDoc(collection(db, 'entretiens'), {
          ...entretienData,
          date: Timestamp.fromDate(entretienData.date),
          createdAt: Timestamp.fromDate(entretienData.createdAt),
        });
      }
      console.log(`  ✅ Entretiens créés pour ${camion.matricule}`);
    }

    // 7. Créer des missions/trajets
    console.log('🗺️ Création des missions...');
    const missions: Mission[] = [];
    
    for (let i = 0; i < 15; i++) {
      const villeDepart = villesMaroc[Math.floor(Math.random() * villesMaroc.length)];
      let villeDestination = villesMaroc[Math.floor(Math.random() * villesMaroc.length)];
      while (villeDestination.nom === villeDepart.nom) {
        villeDestination = villesMaroc[Math.floor(Math.random() * villesMaroc.length)];
      }
      
      const camion = camions[Math.floor(Math.random() * camions.length)];
      const chauffeur = chauffeurs[Math.floor(Math.random() * chauffeurs.length)];
      const dateDebut = randomDate(new Date(2024, 0, 1), new Date());
      const dateFin = new Date(dateDebut);
      dateFin.setDate(dateFin.getDate() + Math.floor(1 + Math.random() * 3));
      
      // Calculer distance approximative (exemple)
      const distance = Math.floor(150 + Math.random() * 400); // km
      const carburant = Math.floor(distance * 0.35); // litres à ~0.35L/km
      const prixCarburant = carburant * 12.5; // ~12.5 MAD/L
      const peage = Math.floor(50 + Math.random() * 200);
      const repas = Math.floor(100 + Math.random() * 200);
      const autre = Math.floor(50 + Math.random() * 150);
      
      const statut = i < 5 ? 'en_cours' : i < 12 ? 'termine' : 'planifie';
      const recette = statut === 'termine' ? Math.floor(3000 + Math.random() * 5000) : undefined;
      
      const missionData: Omit<Mission, 'id'> = {
        depart: villeDepart.nom,
        destination: villeDestination.nom,
        dateDebut,
        dateFin: statut !== 'planifie' ? dateFin : undefined,
        camionId: camion.id,
        chauffeurId: chauffeur.id,
        statut: statut as 'planifie' | 'en_cours' | 'termine' | 'annule',
        coutEstime: {
          carburant: prixCarburant,
          peage,
          repas,
          autre,
        },
        recette,
        createdAt: dateDebut,
      };

      const missionRef = await addDoc(collection(db, 'missions'), {
        ...missionData,
        dateDebut: Timestamp.fromDate(missionData.dateDebut),
        dateFin: missionData.dateFin ? Timestamp.fromDate(missionData.dateFin) : undefined,
        createdAt: Timestamp.fromDate(missionData.createdAt),
      });
      
      missions.push({ id: missionRef.id, ...missionData });
      console.log(`  ✅ Mission créée: ${villeDepart.nom} → ${villeDestination.nom}`);
    }

    // 8. Créer des dépenses
    console.log('💰 Création des dépenses...');
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
          description = `Salaire chauffeur - ${chauffeurs[Math.floor(Math.random() * chauffeurs.length)].prenom} ${chauffeurs[Math.floor(Math.random() * chauffeurs.length)].nom}`;
          break;
        case 'achat':
          montant = Math.floor(200 + Math.random() * 1000);
          description = `Achat pièces détachées`;
          break;
        default:
          montant = Math.floor(100 + Math.random() * 500);
          description = `Autre dépense`;
      }
      
      const depenseData: Omit<Depense, 'id'> = {
        type,
        date,
        montant,
        description,
        camionId: type === 'carburant' || type === 'entretien' ? camion.id : undefined,
        createdAt: date,
      };

      await addDoc(collection(db, 'depenses'), {
        ...depenseData,
        date: Timestamp.fromDate(depenseData.date),
        createdAt: Timestamp.fromDate(depenseData.createdAt),
      });
    }
    console.log('  ✅ Dépenses créées');

    // 9. Créer des recettes
    console.log('💵 Création des recettes...');
    for (const mission of missions.filter(m => m.recette)) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const date = mission.dateDebut;
      
      const recetteData: Omit<Recette, 'id'> = {
        type: 'mission',
        date,
        montant: mission.recette!,
        description: `Mission ${mission.depart} → ${mission.destination}`,
        client: client.nom,
        missionId: mission.id,
        createdAt: date,
      };

      await addDoc(collection(db, 'recettes'), {
        ...recetteData,
        date: Timestamp.fromDate(recetteData.date),
        createdAt: Timestamp.fromDate(recetteData.createdAt),
      });
    }
    console.log('  ✅ Recettes créées');

    // 10. Créer des factures
    console.log('📄 Création des factures...');
    for (let i = 0; i < 8; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const mission = missions.filter(m => m.recette)[Math.floor(Math.random() * missions.filter(m => m.recette).length)];
      const dateEmission = randomDate(new Date(2024, 0, 1), new Date());
      const dateEcheance = new Date(dateEmission);
      dateEcheance.setDate(dateEcheance.getDate() + 30);
      
      const numero = `FACT-2025-${String(i + 1).padStart(3, '0')}`;
      const prixUnitaire = Math.floor(2000 + Math.random() * 3000);
      const quantite = 1;
      const tva = 20; // TVA 20% au Maroc
      const totalHT = prixUnitaire * quantite;
      const totalTVA = totalHT * (tva / 100);
      const totalTTC = totalHT + totalTVA;
      const montantPaye = Math.random() > 0.3 ? totalTTC : Math.floor(totalTTC * (0.5 + Math.random() * 0.5));
      const montantRestant = totalTTC - montantPaye;
      
      const lignes: LigneFacture[] = [
        {
          description: `Transport ${mission?.depart || 'Départ'} → ${mission?.destination || 'Destination'}`,
          quantite,
          prixUnitaire,
          tva,
          total: totalHT,
        },
      ];
      
      const statut = montantRestant === 0 ? 'payee' : montantPaye > 0 ? 'partiellement_payee' : 'envoyee';
      
      const factureData: Omit<Facture, 'id'> = {
        numero,
        clientId: client.id,
        dateEmission,
        dateEcheance,
        statut: statut as 'brouillon' | 'envoyee' | 'payee' | 'partiellement_payee' | 'en_retard' | 'annulee',
        type: 'facture',
        lignes,
        totalHT,
        totalTVA,
        totalTTC,
        montantPaye,
        montantRestant,
        conditionsPaiement: '30 jours',
        missionId: mission?.id,
        createdAt: dateEmission,
        updatedAt: dateEmission,
      };

      await addDoc(collection(db, 'factures'), {
        ...factureData,
        dateEmission: Timestamp.fromDate(factureData.dateEmission),
        dateEcheance: Timestamp.fromDate(factureData.dateEcheance),
        createdAt: Timestamp.fromDate(factureData.createdAt),
        updatedAt: Timestamp.fromDate(factureData.updatedAt),
      });
      console.log(`  ✅ Facture créée: ${numero}`);
    }

    console.log('');
    console.log('✅ Données de démonstration générées avec succès !');
    console.log('');
    console.log('📊 Résumé :');
    console.log(`   - ${camions.length} camions`);
    console.log(`   - ${chauffeurs.length} chauffeurs`);
    console.log(`   - ${clients.length} clients`);
    console.log(`   - ${missions.length} missions`);
    console.log(`   - 20 dépenses`);
    console.log(`   - ${missions.filter(m => m.recette).length} recettes`);
    console.log(`   - 8 factures`);
    console.log('');
    console.log('🎯 Les données sont maintenant disponibles dans votre base Firebase !');

  } catch (error) {
    console.error('❌ Erreur lors de la génération des données:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('✅ Terminé !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

