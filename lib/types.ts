export type UserRole = 'admin' | 'comptable' | 'magasinier' | 'chauffeur';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface Camion {
  id: string;
  matricule: string;
  marque: string;
  modele: string;
  dateAchat: Date;
  etat: 'actif' | 'en_maintenance' | 'hors_service';
  kilometrageActuel: number; // Kilométrage actuel du camion
  imageUrl?: string; // URL de l'image du camion
  couleur?: string; // Couleur du camion (hex code)
  createdAt: Date;
}

export interface Assurance {
  id: string;
  camionId: string;
  numero: string;
  compagnie: string;
  dateDebut: Date;
  dateFin: Date;
  montant: number;
  createdAt: Date;
}

export interface VisiteTechnique {
  id: string;
  camionId: string;
  date: Date;
  prochaineDate: Date;
  resultat: 'valide' | 'non_valide';
  createdAt: Date;
}

export interface Entretien {
  id: string;
  camionId: string;
  type: 'vidange' | 'reparation' | 'autre';
  date: Date;
  description: string;
  cout: number;
  createdAt: Date;
}

// Suivi kilométrique détaillé
export interface Kilometrage {
  id: string;
  camionId: string;
  date: Date;
  kilometrage: number; // Kilométrage à cette date
  chauffeurId?: string; // Chauffeur qui a effectué le trajet
  missionId?: string; // Mission associée (si applicable)
  notes?: string; // Notes supplémentaires
  createdAt: Date;
}

// Gestion des pneus par camion
export interface Pneu {
  id: string;
  camionId: string;
  position: 'avant_droit' | 'avant_gauche' | 'arriere_droit' | 'arriere_gauche' | 'roue_secours';
  marque?: string;
  modele?: string;
  numeroSerie?: string;
  dateInstallation: Date;
  dateFabrication?: Date;
  kilometrageInstallation: number; // Kilométrage au moment de l'installation
  kilometrageActuel?: number; // Kilométrage actuel (mise à jour)
  etat: 'bon' | 'usure' | 'a_remplacer' | 'remplace';
  profondeur?: number; // Profondeur de la bande de roulement en mm
  prix?: number; // Prix d'achat
  fournisseur?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Historique complet des réparations
export interface Reparation {
  id: string;
  camionId: string;
  date: Date;
  type: 'preventive' | 'corrective' | 'revision' | 'diagnostic' | 'autre';
  kilometrage: number; // Kilométrage au moment de la réparation
  description: string;
  piecesUtilisees: PieceUtilisee[]; // Liste des pièces utilisées
  mainOeuvre: number; // Coût de la main d'œuvre
  coutTotal: number; // Coût total (pièces + main d'œuvre)
  garage?: string; // Nom du garage
  fournisseurId?: string; // Référence au fournisseur
  factureNumero?: string; // Numéro de facture
  garantie?: {
    duree: number; // Durée en mois
    dateFin: Date;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pièce utilisée dans une réparation
export interface PieceUtilisee {
  nom: string;
  reference?: string;
  quantite: number;
  prixUnitaire: number;
  total: number; // quantite * prixUnitaire
  stockId?: string; // Référence à l'article du stock (si applicable)
}

export interface Chauffeur {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  permis: string;
  dateObtentionPermis?: Date;
  typeContrat: 'cdi' | 'cdd' | 'interim';
  salaire: number;
  dateEmbauche?: Date;
  soldAnnuelConge?: number; // Nombre de jours de congé annuel
  actif: boolean;
  createdAt: Date;
}

export interface Absence {
  id: string;
  chauffeurId: string;
  type: 'conge' | 'maladie' | 'accident' | 'autre';
  dateDebut: Date;
  dateFin: Date;
  description?: string;
  createdAt: Date;
}

export interface Mission {
  id: string;
  depart: string;
  destination: string;
  dateDebut: Date;
  dateFin?: Date;
  camionId: string;
  chauffeurId: string;
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule';
  coutEstime: {
    carburant: number;
    peage: number;
    repas: number;
    autre: number;
  };
  recette?: number;
  createdAt: Date;
}

export interface Depense {
  id: string;
  type: string;
  date: Date;
  montant: number;
  description: string;
  camionId?: string;
  chauffeurId?: string;
  fournisseurId?: string;
  createdAt: Date;
}

export interface Recette {
  id: string;
  date: Date;
  montant: number;
  description: string;
  clientId?: string;
  missionId?: string;
  factureId?: string;
  createdAt: Date;
}

export interface Stock {
  id: string;
  nom: string;
  type: string;
  quantite: number;
  seuilAlerte: number;
  prixUnitaire: number;
  createdAt: Date;
}

export interface MouvementStock {
  id: string;
  stockId: string;
  type: 'entree' | 'sortie';
  quantite: number;
  date: Date;
  raison: string;
  createdAt: Date;
}

// ==================== COMPTABILITÉ ====================

// Client
export interface Client {
  id: string;
  nom: string;
  type: 'particulier' | 'entreprise';
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  numeroTVA?: string;
  siret?: string;
  notes?: string;
  solde: number; // Solde total (factures - règlements)
  createdAt: Date;
  updatedAt: Date;
}

// Fournisseur
export interface Fournisseur {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  numeroTVA?: string;
  siret?: string;
  notes?: string;
  solde: number; // Solde total (factures fournisseur - règlements)
  createdAt: Date;
  updatedAt: Date;
}

// Ligne de facture
export interface LigneFacture {
  description: string;
  quantite: number;
  prixUnitaire: number;
  tva?: number; // Taux TVA en pourcentage (ex: 20 pour 20%)
  remise?: number; // Remise en pourcentage
  total: number; // Total HT après remise
}

// Facture Client
export interface Facture {
  id: string;
  numero: string; // Numéro unique de facture (ex: FACT-2025-001)
  clientId: string;
  dateEmission: Date;
  dateEcheance?: Date;
  statut: 'brouillon' | 'envoyee' | 'payee' | 'partiellement_payee' | 'en_retard' | 'annulee';
  type: 'facture' | 'avoir' | 'proforma';
  lignes: LigneFacture[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  montantPaye: number;
  montantRestant: number;
  notes?: string;
  conditionsPaiement?: string; // Ex: "30 jours", "À réception", etc.
  missionId?: string; // Si liée à une mission
  createdAt: Date;
  updatedAt: Date;
}

// Facture Fournisseur
export interface FactureFournisseur {
  id: string;
  numero: string; // Numéro de facture fournisseur
  fournisseurId: string;
  dateReception: Date;
  dateEcheance?: Date;
  statut: 'brouillon' | 'a_payer' | 'payee' | 'partiellement_payee' | 'en_retard' | 'annulee';
  lignes: LigneFacture[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  montantPaye: number;
  montantRestant: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Règlement (Paiement)
export interface Reglement {
  id: string;
  type: 'recette' | 'depense'; // Recette = paiement client, Dépense = paiement fournisseur
  factureId?: string; // ID de la facture liée
  factureFournisseurId?: string;
  clientId?: string;
  fournisseurId?: string;
  montant: number;
  date: Date;
  modePaiement: 'especes' | 'cheque' | 'virement' | 'carte' | 'autre';
  reference?: string; // Numéro de chèque, référence virement, etc.
  banque?: string;
  notes?: string;
  createdAt: Date;
}

// Compte comptable
export interface CompteComptable {
  id: string;
  numero: string; // Numéro de compte (ex: "411000" pour Clients)
  libelle: string; // Libellé du compte
  type: 'actif' | 'passif' | 'charges' | 'produits';
  solde: number;
  createdAt: Date;
  updatedAt: Date;
}

// Écriture comptable
export interface EcritureComptable {
  id: string;
  date: Date;
  libelle: string;
  compteDebit: string; // ID du compte débiteur
  compteCredit: string; // ID du compte créditeur
  montant: number;
  factureId?: string;
  reglementId?: string;
  pieceJointe?: string; // URL ou référence
  createdAt: Date;
}

// Note de crédit (avoir)
export interface NoteCredit {
  id: string;
  numero: string;
  factureId: string; // Facture d'origine
  clientId: string;
  dateEmission: Date;
  raison: string; // Raison de l'avoir
  montant: number;
  statut: 'brouillon' | 'envoyee' | 'appliquee';
  createdAt: Date;
}

// Configuration des alertes
export interface ConfigAlertes {
  id: string;
  // Jours d'avance pour alertes d'expiration
  joursAlerteAssurance: number; // Par défaut: 30
  joursAlerteVisite: number; // Par défaut: 30
  joursCritiqueAssurance: number; // Par défaut: 7
  joursCritiqueVisite: number; // Par défaut: 7
  joursCritiqueFacture: number; // Par défaut: 30
  
  // Activer/désactiver types d'alertes
  alerteAssurance: boolean;
  alerteVisite: boolean;
  alerteEntretien: boolean;
  alerteStock: boolean;
  alerteFacture: boolean;
  alerteMaintenance: boolean;
  
  // Seuils personnalisés
  seuilStockCritique: number; // Par défaut: 0
  seuilStockImportant: number; // Par défaut: 10
  
  updatedAt: Date;
}

