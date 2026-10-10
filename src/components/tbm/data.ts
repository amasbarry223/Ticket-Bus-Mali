/* ============================================================
 *  TBM — Ticket Bus Mali · Back-office
 *  Données de démonstration (frontend only, aucun backend)
 *  Règle RG11 : montants en francs CFA, sans décimales.
 * ============================================================ */

/* ------------------------- Formats ------------------------- */

export function formatFcfa(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(n)} FCFA`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

/* ------------------------- Rôles ---------------------------- */

export type StaffRole = "admin" | "support";

export interface StaffUser {
  name: string;
  email: string;
  role: StaffRole;
}

export const ROLE_LABEL: Record<StaffRole, string> = {
  admin: "Administrateur TBM",
  support: "Support TBM",
};

export const DEMO_ACCOUNTS: Record<
  StaffRole,
  { email: string; password: string; name: string }
> = {
  admin: {
    email: "admin@tbm.ml",
    password: "tbm2026",
    name: "Daouda FOMBA",
  },
  support: {
    email: "support@tbm.ml",
    password: "tbm2026",
    name: "Mody BARRY",
  },
};

/* ------------------------ Compagnies (A01) ------------------ */

export type CompanyStatus = "active" | "suspendue" | "attente";

/** Paramètres de vente propres à chaque compagnie. */
export interface CompanySalesParams {
  venteEnLigne: boolean;
  venteGuichet: boolean;
  reservationJours: number; // délai max de réservation à l'avance
  annulationGratuite: number; // heures avant départ sans frais
}

export interface Company {
  id: string;
  nom: string;
  contact: string; // e-mail
  telephone: string;
  adresse: string;
  ville: string;
  commission: number; // %
  ticketsMois: number;
  statut: CompanyStatus;
  params: CompanySalesParams;
}

/** Initiales pour l'avatar-logo d'une compagnie (ex. "Bamako Express" → BE). */
export function companyInitials(nom: string): string {
  return (
    nom
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "CP"
  );
}

/** Palette de logos (tons chauds, cohérents avec la charte coral). */
export const COMPANY_LOGO_COLORS: Record<string, string> = {
  "CPG-001": "bg-coral-50 text-coral-600 ring-coral-200",
  "CPG-002": "bg-emerald-50 text-emerald-600 ring-emerald-200",
  "CPG-003": "bg-amber-50 text-amber-600 ring-amber-200",
  "CPG-004": "bg-violet-100 text-violet-600 ring-violet-200",
  "CPG-005": "bg-neutral-100 text-neutral-600 ring-neutral-200",
};

export function companyLogoColor(id: string): string {
  return (
    COMPANY_LOGO_COLORS[id] ??
    "bg-coral-50 text-coral-600 ring-coral-200"
  );
}

export const DEFAULT_SALES_PARAMS: CompanySalesParams = {
  venteEnLigne: true,
  venteGuichet: true,
  reservationJours: 30,
  annulationGratuite: 24,
};

export const initialCompanies: Company[] = [
  {
    id: "CPG-001",
    nom: "Bamako Express",
    contact: "contact@bamakoexpress.ml",
    telephone: "+223 76 12 34 56",
    adresse: "Rue 224, Hamdallaye ACI 2000",
    ville: "Bamako",
    commission: 10,
    ticketsMois: 1284,
    statut: "active",
    params: { venteEnLigne: true, venteGuichet: true, reservationJours: 30, annulationGratuite: 24 },
  },
  {
    id: "CPG-002",
    nom: "Djoliba Transport",
    contact: "ventes@djoliba.ml",
    telephone: "+223 66 45 78 90",
    adresse: "Avenue de l'OUA, Badalabougou",
    ville: "Bamako",
    commission: 8,
    ticketsMois: 967,
    statut: "active",
    params: { venteEnLigne: true, venteGuichet: true, reservationJours: 21, annulationGratuite: 24 },
  },
  {
    id: "CPG-003",
    nom: "Sahel Bus",
    contact: "sahelbus@gmail.com",
    telephone: "+223 79 20 11 44",
    adresse: "Quai de Sébougou",
    ville: "Ségou",
    commission: 12,
    ticketsMois: 645,
    statut: "active",
    params: { venteEnLigne: true, venteGuichet: false, reservationJours: 14, annulationGratuite: 12 },
  },
  {
    id: "CPG-004",
    nom: "Sikasso Voyage",
    contact: "info@sikassovoyage.ml",
    telephone: "+223 74 88 32 10",
    adresse: "Gare de Wayerma, sortie nord",
    ville: "Sikasso",
    commission: 10,
    ticketsMois: 516,
    statut: "attente",
    params: { venteEnLigne: false, venteGuichet: true, reservationJours: 7, annulationGratuite: 24 },
  },
  {
    id: "CPG-005",
    nom: "Kayes Lines",
    contact: "klines@gmail.com",
    telephone: "+223 70 55 41 23",
    adresse: "Gare de Kayes N'Di",
    ville: "Kayes",
    commission: 11,
    ticketsMois: 0,
    statut: "suspendue",
    params: { venteEnLigne: true, venteGuichet: true, reservationJours: 30, annulationGratuite: 24 },
  },
];

/* ------- Flotte, lignes, départs & historique compagnies ----- */

export type BusStatus = "en_service" | "au_depot" | "maintenance";

export interface Bus {
  id: string;
  compagnie: string; // Company id
  immatriculation: string;
  modele: string;
  places: number;
  chauffeur: string;
  statut: BusStatus;
}

export const BUS_STATUS_META: Record<BusStatus, { label: string; className: string }> = {
  en_service: { label: "En service", className: "bg-emerald-50 text-emerald-600" },
  au_depot: { label: "Au dépôt", className: "bg-neutral-100 text-neutral-500" },
  maintenance: { label: "Maintenance", className: "bg-amber-50 text-amber-600" },
};

export interface Line {
  id: string;
  compagnie: string;
  depart: string;
  arrivee: string;
  duree: string;
  distanceKm: number;
  arrets: string[]; // arrêts intermédiaires
  prix: number; // FCFA
  frequence: string;
}

export type DepartureStatus =
  | "programme"
  | "embarquement"
  | "retarde"
  | "annule"
  | "termine";

export interface Departure {
  id: string;
  compagnie: string;
  jour: string; // "Aujourd'hui", "Demain"…
  heure: string;
  trajet: string; // "Bamako → Ségou"
  bus: string; // immatriculation
  prix: number; // FCFA
  placesTotal: number;
  placesDispo: number;
  plateforme?: string;
  retardMinutes?: number; // si statut = "retarde"
  statut: DepartureStatus;
}

export const DEPARTURE_STATUS_META: Record<
  DepartureStatus,
  { label: string; className: string }
> = {
  programme: { label: "Programmé", className: "bg-neutral-100 text-neutral-500" },
  embarquement: { label: "Embarquement", className: "bg-coral-50 text-coral-600" },
  retarde: { label: "Retardé", className: "bg-amber-50 text-amber-600" },
  annule: { label: "Annulé", className: "bg-rose-50 text-rose-600" },
  termine: { label: "Terminé", className: "bg-emerald-50 text-emerald-600" },
};

export type DepartureModificationType =
  | "retard"
  | "annulation"
  | "changement_bus"
  | "plateforme"
  | "info";

export interface DepartureModification {
  id: string;
  departId: string;
  date: string;
  type: DepartureModificationType;
  detail: string;
  auteur: string;
}

export const DEPARTURE_MODIFICATION_META: Record<
  DepartureModificationType,
  { label: string; className: string }
> = {
  retard: { label: "Retard", className: "bg-amber-50 text-amber-600" },
  annulation: { label: "Annulation", className: "bg-rose-50 text-rose-600" },
  changement_bus: { label: "Changement de bus", className: "bg-violet-100 text-violet-600" },
  plateforme: { label: "Plateforme", className: "bg-sky-50 text-sky-600" },
  info: { label: "Information", className: "bg-neutral-100 text-neutral-500" },
};

export const departureModifications: DepartureModification[] = [
  {
    id: "MOD-14",
    departId: "DEP-04",
    date: "Aujourd'hui 14:40",
    type: "retard",
    detail: "Départ décalé de 45 min — attente de correspondance depuis Fana.",
    auteur: "Bamako Express — dispatch",
  },
  {
    id: "MOD-13",
    departId: "DEP-04",
    date: "Aujourd'hui 12:10",
    type: "plateforme",
    detail: "Départ déplacé de la plateforme B à la plateforme C (gare de Sogoniko).",
    auteur: "Bamako Express — gare",
  },
  {
    id: "MOD-12",
    departId: "DEP-09",
    date: "Aujourd'hui 11:20",
    type: "annulation",
    detail: "Annulé — pluies torrentielles sur la RN6, tickets reportés sans frais.",
    auteur: "Sahel Bus — dispatch",
  },
  {
    id: "MOD-11",
    departId: "DEP-10",
    date: "Aujourd'hui 10:05",
    type: "changement_bus",
    detail: "Bus remplacé — SGO 2233 G (41 places) affecté au départ de demain 07:00.",
    auteur: "Sahel Bus — dépôt",
  },
  {
    id: "MOD-10",
    departId: "DEP-03",
    date: "Hier 16:45",
    type: "info",
    detail: "Bus Yutong remis en service après contrôle technique — départ confirmé.",
    auteur: "Bamako Express — atelier",
  },
  {
    id: "MOD-09",
    departId: "DEP-08",
    date: "Hier 09:30",
    type: "annulation",
    detail: "Compagnie suspendue — tous les départs sont annulés jusqu'à régularisation.",
    auteur: "TBM — administration",
  },
];

export type CompanyEventType = "activite" | "incident";

export interface CompanyEvent {
  id: string;
  compagnie: string;
  date: string;
  type: CompanyEventType;
  titre: string;
  detail: string;
}

export const companyBuses: Bus[] = [
  { id: "BUS-01", compagnie: "CPG-001", immatriculation: "BKO 1204 A", modele: "Mercedes Sprinter", places: 20, chauffeur: "Moussa Keïta", statut: "en_service" },
  { id: "BUS-02", compagnie: "CPG-001", immatriculation: "BKO 2210 B", modele: "Toyota Coaster", places: 26, chauffeur: "Salif Diarra", statut: "en_service" },
  { id: "BUS-03", compagnie: "CPG-001", immatriculation: "BKO 3317 C", modele: "Yutong ZK6119", places: 41, chauffeur: "—", statut: "maintenance" },
  { id: "BUS-04", compagnie: "CPG-002", immatriculation: "BKO 4421 D", modele: "Toyota Hiace", places: 18, chauffeur: "Adama Touré", statut: "en_service" },
  { id: "BUS-05", compagnie: "CPG-002", immatriculation: "BKO 5512 E", modele: "Mercedes Sprinter", places: 20, chauffeur: "—", statut: "au_depot" },
  { id: "BUS-06", compagnie: "CPG-003", immatriculation: "SGO 1102 F", modele: "Toyota Coaster", places: 26, chauffeur: "Bakary Koné", statut: "en_service" },
  { id: "BUS-07", compagnie: "CPG-003", immatriculation: "SGO 2233 G", modele: "Yutong ZK6119", places: 41, chauffeur: "—", statut: "au_depot" },
  { id: "BUS-08", compagnie: "CPG-004", immatriculation: "SKO 1010 H", modele: "Toyota Hiace", places: 18, chauffeur: "Jean Diarra", statut: "en_service" },
  { id: "BUS-09", compagnie: "CPG-005", immatriculation: "KYS 2040 J", modele: "Mercedes Sprinter", places: 20, chauffeur: "—", statut: "maintenance" },
];

export const companyLines: Line[] = [
  { id: "LIG-01", compagnie: "CPG-001", depart: "Bamako", arrivee: "Ségou", duree: "3 h", distanceKm: 235, arrets: ["Kati", "Ouélessébougou"], prix: 5000, frequence: "Quotidien" },
  { id: "LIG-02", compagnie: "CPG-001", depart: "Bamako", arrivee: "Sikasso", duree: "5 h 30", distanceKm: 475, arrets: ["Bougouni", "Kolondiéba"], prix: 9000, frequence: "Quotidien" },
  { id: "LIG-03", compagnie: "CPG-001", depart: "Bamako", arrivee: "Kayes", duree: "9 h", distanceKm: 580, arrets: ["Kita", "Bafoulabé"], prix: 15000, frequence: "Quotidien" },
  { id: "LIG-04", compagnie: "CPG-002", depart: "Bamako", arrivee: "Mopti", duree: "7 h", distanceKm: 640, arrets: ["Ségou", "Bla", "San"], prix: 11000, frequence: "Lun · Mer · Ven" },
  { id: "LIG-05", compagnie: "CPG-002", depart: "Bamako", arrivee: "Ségou", duree: "3 h", distanceKm: 235, arrets: ["Kati", "Ouélessébougou"], prix: 5000, frequence: "Quotidien" },
  { id: "LIG-06", compagnie: "CPG-003", depart: "Ségou", arrivee: "Bamako", duree: "3 h", distanceKm: 235, arrets: ["Ouélessébougou", "Kati"], prix: 5000, frequence: "Quotidien" },
  { id: "LIG-07", compagnie: "CPG-003", depart: "Ségou", arrivee: "Mopti", duree: "4 h 30", distanceKm: 405, arrets: ["Bla", "San"], prix: 8500, frequence: "Mar · Jeu · Sam" },
  { id: "LIG-08", compagnie: "CPG-004", depart: "Sikasso", arrivee: "Bamako", duree: "5 h 30", distanceKm: 475, arrets: ["Kolondiéba", "Bougouni"], prix: 9000, frequence: "Quotidien" },
  { id: "LIG-09", compagnie: "CPG-004", depart: "Sikasso", arrivee: "Koutiala", duree: "2 h 30", distanceKm: 135, arrets: ["Zangasso"], prix: 4500, frequence: "Quotidien" },
  { id: "LIG-10", compagnie: "CPG-005", depart: "Kayes", arrivee: "Bamako", duree: "10 h", distanceKm: 580, arrets: ["Bafoulabé", "Kita"], prix: 16000, frequence: "Quotidien" },
];

export const companyDepartures: Departure[] = [
  { id: "DEP-01", compagnie: "CPG-001", jour: "Aujourd'hui", heure: "07:30", trajet: "Bamako → Ségou", bus: "BKO 1204 A", prix: 5000, placesTotal: 20, placesDispo: 5, plateforme: "A", statut: "embarquement" },
  { id: "DEP-02", compagnie: "CPG-001", jour: "Aujourd'hui", heure: "13:00", trajet: "Bamako → Sikasso", bus: "BKO 2210 B", prix: 9000, placesTotal: 26, placesDispo: 12, plateforme: "C", statut: "programme" },
  { id: "DEP-03", compagnie: "CPG-001", jour: "Demain", heure: "06:30", trajet: "Bamako → Kayes", bus: "BKO 3317 C", prix: 15000, placesTotal: 41, placesDispo: 41, plateforme: "D", statut: "programme" },
  { id: "DEP-04", compagnie: "CPG-001", jour: "Aujourd'hui", heure: "16:00", trajet: "Bamako → Ségou", bus: "BKO 1204 A", prix: 5000, placesTotal: 20, placesDispo: 8, plateforme: "A", retardMinutes: 45, statut: "retarde" },
  { id: "DEP-05", compagnie: "CPG-002", jour: "Aujourd'hui", heure: "06:00", trajet: "Bamako → Mopti", bus: "BKO 4421 D", prix: 11000, placesTotal: 18, placesDispo: 3, plateforme: "B", statut: "programme" },
  { id: "DEP-06", compagnie: "CPG-002", jour: "Aujourd'hui", heure: "08:30", trajet: "Bamako → Ségou", bus: "BKO 5512 E", prix: 5000, placesTotal: 20, placesDispo: 4, plateforme: "B", statut: "termine" },
  { id: "DEP-07", compagnie: "CPG-002", jour: "Demain", heure: "07:00", trajet: "Bamako → Ségou", bus: "BKO 5512 E", prix: 5000, placesTotal: 20, placesDispo: 20, plateforme: "B", statut: "programme" },
  { id: "DEP-08", compagnie: "CPG-003", jour: "Aujourd'hui", heure: "07:00", trajet: "Ségou → Bamako", bus: "SGO 1102 F", prix: 5000, placesTotal: 26, placesDispo: 8, statut: "embarquement" },
  { id: "DEP-09", compagnie: "CPG-003", jour: "Aujourd'hui", heure: "14:00", trajet: "Ségou → Mopti", bus: "SGO 2233 G", prix: 8500, placesTotal: 41, placesDispo: 41, statut: "annule" },
  { id: "DEP-10", compagnie: "CPG-003", jour: "Demain", heure: "07:00", trajet: "Ségou → Bamako", bus: "SGO 2233 G", prix: 5000, placesTotal: 41, placesDispo: 10, statut: "programme" },
  { id: "DEP-11", compagnie: "CPG-004", jour: "Demain", heure: "05:30", trajet: "Sikasso → Bamako", bus: "SKO 1010 H", prix: 9000, placesTotal: 18, placesDispo: 11, statut: "programme" },
  { id: "DEP-12", compagnie: "CPG-004", jour: "Demain", heure: "08:00", trajet: "Sikasso → Koutiala", bus: "SKO 1010 H", prix: 4500, placesTotal: 18, placesDispo: 14, statut: "programme" },
  { id: "DEP-13", compagnie: "CPG-005", jour: "Aujourd'hui", heure: "06:00", trajet: "Kayes → Bamako", bus: "KYS 2040 J", prix: 16000, placesTotal: 20, placesDispo: 20, statut: "annule" },
];

export const companyEvents: CompanyEvent[] = [
  { id: "EVT-31", compagnie: "CPG-001", date: "06/10 07:45", type: "activite", titre: "Vente en ligne rétablie", detail: "Réception des paiements Orange Money confirmée après l'incident de la veille." },
  { id: "EVT-30", compagnie: "CPG-001", date: "05/10 15:20", type: "activite", titre: "Nouveau bus livré — BKO 3317 C", detail: "Yutong 41 places ajouté à la flotte ; mise en service après contrôle technique." },
  { id: "EVT-29", compagnie: "CPG-001", date: "02/10 09:10", type: "incident", titre: "Retard de 45 min — Bamako → Ségou", detail: "Panne de climatisation sur BKO 1204 A, voyageurs transférés sur le départ suivant." },
  { id: "EVT-28", compagnie: "CPG-001", date: "28/09 11:00", type: "activite", titre: "Commission ajustée à 10 %", detail: "Passage de 9 % à 10 % suite à l'accord commercial du 28/09." },
  { id: "EVT-27", compagnie: "CPG-002", date: "05/10 08:30", type: "activite", titre: "Paiement Orange Money activé", detail: "Second opérateur mobile ajouté aux paramètres de vente." },
  { id: "EVT-26", compagnie: "CPG-002", date: "01/10 17:40", type: "incident", titre: "Retard de 1 h — Bamako → Mopti", detail: "Embouteillage exceptionnel au pont Fahd, départ décalé de 60 minutes." },
  { id: "EVT-25", compagnie: "CPG-003", date: "03/10 10:15", type: "activite", titre: "Guichet de Sébougou rouvert", detail: "Point de vente physique de nouveau opérationnel après travaux." },
  { id: "EVT-24", compagnie: "CPG-003", date: "30/09 16:50", type: "incident", titre: "Départ 16:30 annulé — Ségou → Mopti", detail: "Pluies torrentielles sur la RN6, 12 tickets reportés sans frais." },
  { id: "EVT-23", compagnie: "CPG-004", date: "02/10 14:00", type: "activite", titre: "Dossier de validation complété", detail: "RCCM, agrément de transport et coordonnées bancaires transmis." },
  { id: "EVT-22", compagnie: "CPG-005", date: "04/10 09:15", type: "incident", titre: "Suspension de la compagnie", detail: "Documents de reversal manquants — ventes en ligne et guichet bloquées." },
  { id: "EVT-21", compagnie: "CPG-005", date: "25/09 11:30", type: "activite", titre: "Audit administratif planifié", detail: "Contrôle sur site programmé au dépôt de Kayes N'Di." },
];

export const COMPANY_STATUS_META: Record<
  CompanyStatus,
  { label: string; className: string }
> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-600" },
  suspendue: { label: "Suspendue", className: "bg-rose-50 text-rose-600" },
  attente: { label: "En attente", className: "bg-amber-50 text-amber-600" },
};



/* ----------------------- Transactions (A02) ----------------- */

export type PaymentStatus =
  | "reussi"
  | "en_attente"
  | "echoue"
  | "expire"
  | "rembourse";

export type Operator = "Orange Money" | "Moov Money";

/** Étapes de la chaîne critique : un billet n'est émis qu'après confirmation serveur. */
export type PaymentEventKind =
  | "initiation"
  | "requete_operateur"
  | "debit"
  | "confirmation"
  | "emission"
  | "echec"
  | "expiration"
  | "remboursement"
  | "anomalie";

export interface PaymentEvent {
  id: string;
  date: string;
  type: PaymentEventKind;
  detail: string;
  source: string; // « Opérateur », « Serveur TBM », « Compagnie », « Back-office »…
}

export type AnomalieStatus = "detectee" | "resolue";

export interface Transaction {
  id: string; // référence plateforme TXN-xxxxx
  refOperateur: string; // retour fiable de l'opérateur (reçu client)
  refReservation: string | null; // RES-xxxx — null si jamais finalisée (anomalie)
  date: string; // « Aujourd'hui 06:15 »
  jour: string; // « Aujourd'hui » · « Hier » · « 04/10 » (clé de rapprochement)
  compagnie: string;
  telephone: string; // numéro débité
  operateur: Operator; // moyen de paiement : Orange Money / Moov Money
  montant: number; // FCFA (TTC, frais de service inclus)
  statut: PaymentStatus;
  billetsEmis: number; // billets émis APRÈS confirmation serveur
  releve: boolean; // figure au relevé de l'opérateur du jour
  timeline: PaymentEvent[];
  anomalie?: {
    statut: AnomalieStatus;
    detail: string;
    resolution?: string;
    resoluPar?: string;
  };
}

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  reussi: { label: "Réussi", className: "bg-emerald-50 text-emerald-600" },
  en_attente: { label: "En attente", className: "bg-amber-50 text-amber-600" },
  echoue: { label: "Échoué", className: "bg-rose-50 text-rose-600" },
  expire: { label: "Expiré", className: "bg-neutral-100 text-neutral-500" },
  rembourse: { label: "Remboursé", className: "bg-violet-100 text-violet-600" },
};

export const PAYMENT_EVENT_META: Record<
  PaymentEventKind,
  { label: string; className: string }
> = {
  initiation: { label: "Demande initiée", className: "bg-neutral-100 text-neutral-500" },
  requete_operateur: { label: "Requête opérateur", className: "bg-amber-50 text-amber-600" },
  debit: { label: "Débit client", className: "bg-sky-50 text-sky-600" },
  confirmation: { label: "Confirmation serveur", className: "bg-emerald-50 text-emerald-600" },
  emission: { label: "Émission des billets", className: "bg-coral-50 text-coral-600" },
  echec: { label: "Échec", className: "bg-rose-50 text-rose-600" },
  expiration: { label: "Expiration", className: "bg-neutral-100 text-neutral-500" },
  remboursement: { label: "Remboursement", className: "bg-violet-100 text-violet-600" },
  anomalie: { label: "Anomalie", className: "bg-rose-100 text-rose-700" },
};

export const OPERATORS: Operator[] = ["Orange Money", "Moov Money"];

/** Écarts détectés entre la plateforme et le relevé d'un opérateur. */
export type ReconciliationEcartType =
  | "sans_billet" // débité sans ticket reçu
  | "absent_plateforme" // dans le relevé, absent de la plateforme
  | "absent_releve" // sur la plateforme, absent du relevé
  | "montant"; // montants différents

export interface ReconciliationEcart {
  ref: string;
  type: ReconciliationEcartType;
  detail: string;
}

export const RECONCILIATION_ECART_META: Record<
  ReconciliationEcartType,
  { label: string; className: string }
> = {
  sans_billet: { label: "Débité sans billet", className: "bg-rose-50 text-rose-600" },
  absent_plateforme: { label: "Absent plateforme", className: "bg-amber-50 text-amber-600" },
  absent_releve: { label: "Absent du relevé", className: "bg-amber-50 text-amber-600" },
  montant: { label: "Montant divergent", className: "bg-amber-50 text-amber-600" },
};

/** Relevé quotidien fourni par l'opérateur (côté opérateur du rapprochement). */
export interface OperatorStatement {
  jour: string; // « Hier » · « 04/10 »…
  operateur: Operator;
  nbReleve: number;
  montantReleve: number;
  ecarts: ReconciliationEcart[];
  recu: string; // heure de réception du relevé
}

/**
 * Relevés opérateurs (démo) — le côté plateforme est recalculé en direct
 * depuis les transactions (statuts réussi / remboursé).
 */
export const operatorStatements: OperatorStatement[] = [
  {
    jour: "Aujourd'hui",
    operateur: "Orange Money",
    nbReleve: 2,
    montantReleve: 28000,
    ecarts: [],
    recu: "Aujourd'hui 06:00 (provisoire)",
  },
  {
    jour: "Hier",
    operateur: "Orange Money",
    nbReleve: 3,
    montantReleve: 41000,
    ecarts: [],
    recu: "Aujourd'hui 05:30",
  },
  {
    jour: "Hier",
    operateur: "Moov Money",
    nbReleve: 2,
    montantReleve: 21750,
    ecarts: [
      {
        ref: "MM-2505-117988",
        type: "sans_billet",
        detail:
          "Débit de 12 500 FCFA confirmé par l'opérateur mais aucun billet émis (TXN-10244) — demande de remboursement RMB-030 ouverte.",
      },
    ],
    recu: "Aujourd'hui 05:30",
  },
  {
    jour: "04/10",
    operateur: "Orange Money",
    nbReleve: 1,
    montantReleve: 17500,
    ecarts: [],
    recu: "05/10 05:30",
  },
  {
    jour: "04/10",
    operateur: "Moov Money",
    nbReleve: 0,
    montantReleve: 0,
    ecarts: [],
    recu: "05/10 05:30",
  },
  {
    jour: "03/10",
    operateur: "Orange Money",
    nbReleve: 0,
    montantReleve: 0,
    ecarts: [],
    recu: "04/10 05:30",
  },
  {
    jour: "02/10",
    operateur: "Orange Money",
    nbReleve: 1,
    montantReleve: 7500,
    ecarts: [],
    recu: "03/10 05:30",
  },
];

export const transactions: Transaction[] = [
  {
    id: "TXN-10252",
    refOperateur: "OM-2506-448120",
    refReservation: "RES-2041",
    date: "Aujourd'hui 06:15",
    jour: "Aujourd'hui",
    compagnie: "Bamako Express",
    telephone: "+223 76 42 18 05",
    operateur: "Orange Money",
    montant: 10500,
    statut: "reussi",
    billetsEmis: 2,
    releve: true,
    timeline: [
      { id: "PEV-901", date: "Aujourd'hui 06:15", type: "emission", detail: "2 billets émis et envoyés par SMS après confirmation serveur.", source: "Serveur TBM" },
      { id: "PEV-900", date: "Aujourd'hui 06:15", type: "confirmation", detail: "Retour fiable de l'opérateur reçu — débit de 10 500 FCFA confirmé (OM-2506-448120).", source: "Opérateur" },
      { id: "PEV-899", date: "Aujourd'hui 06:14", type: "debit", detail: "Le client valide le paiement sur son téléphone (USSD Orange Money).", source: "Opérateur" },
      { id: "PEV-898", date: "Aujourd'hui 06:14", type: "requete_operateur", detail: "Requête de paiement transmise à Orange Money — 10 500 FCFA.", source: "Serveur TBM" },
      { id: "PEV-897", date: "Aujourd'hui 06:15", type: "initiation", detail: "Réservation RES-2041 créée — 2 places bloquées pendant 10 min (RG1).", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10251",
    refOperateur: "MM-2506-118047",
    refReservation: "RES-2043",
    date: "Aujourd'hui 09:58",
    jour: "Aujourd'hui",
    compagnie: "Bamako Express",
    telephone: "+223 91 26 03 47",
    operateur: "Moov Money",
    montant: 9000,
    statut: "en_attente",
    billetsEmis: 0,
    releve: false,
    timeline: [
      { id: "PEV-905", date: "Aujourd'hui 09:59", type: "requete_operateur", detail: "Requête de paiement transmise à Moov Money — en attente de confirmation USSD du client.", source: "Serveur TBM" },
      { id: "PEV-904", date: "Aujourd'hui 09:58", type: "initiation", detail: "Réservation RES-2043 créée — 1 place bloquée pendant 10 min (RG1). Aucun billet émis.", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10250",
    refOperateur: "MM-2506-118061",
    refReservation: "RES-2051",
    date: "Aujourd'hui 10:22",
    jour: "Aujourd'hui",
    compagnie: "Sikasso Voyage",
    telephone: "+223 89 04 47 31",
    operateur: "Moov Money",
    montant: 9000,
    statut: "en_attente",
    billetsEmis: 0,
    releve: false,
    timeline: [
      { id: "PEV-907", date: "Aujourd'hui 10:23", type: "requete_operateur", detail: "Requête de paiement transmise à Moov Money — en attente de confirmation USSD du client.", source: "Serveur TBM" },
      { id: "PEV-906", date: "Aujourd'hui 10:22", type: "initiation", detail: "Réservation RES-2051 créée — 2 places bloquées pendant 10 min (RG1). Aucun billet émis.", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10249",
    refOperateur: "OM-2506-448077",
    refReservation: "RES-2055",
    date: "Aujourd'hui 10:31",
    jour: "Aujourd'hui",
    compagnie: "Bamako Express",
    telephone: "+223 95 40 28 17",
    operateur: "Orange Money",
    montant: 15000,
    statut: "expire",
    billetsEmis: 0,
    releve: false,
    timeline: [
      { id: "PEV-911", date: "Aujourd'hui 10:41", type: "expiration", detail: "Délai de 10 min dépassé (RG1) — 3 places libérées, aucun débit constaté.", source: "Serveur TBM" },
      { id: "PEV-910", date: "Aujourd'hui 10:31", type: "requete_operateur", detail: "Requête de paiement transmise à Orange Money — jamais finalisée par le client.", source: "Serveur TBM" },
      { id: "PEV-909", date: "Aujourd'hui 10:31", type: "initiation", detail: "Réservation RES-2055 créée — 3 places bloquées pendant 10 min (RG1).", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10248",
    refOperateur: "OM-2506-448045",
    refReservation: "RES-2044",
    date: "Aujourd'hui 11:20",
    jour: "Aujourd'hui",
    compagnie: "Sahel Bus",
    telephone: "+223 78 30 44 92",
    operateur: "Orange Money",
    montant: 17500,
    statut: "rembourse",
    billetsEmis: 2,
    releve: true,
    timeline: [
      { id: "PEV-915", date: "Aujourd'hui 11:20", type: "remboursement", detail: "Remboursement automatique de 17 500 FCFA ordonné vers OM-2506-448045 (départ annulé).", source: "Serveur TBM" },
      { id: "PEV-914", date: "Aujourd'hui 11:20", type: "anomalie", detail: "Départ Bamako → Mopti annulé par la compagnie — 2 billets annulés.", source: "Compagnie" },
      { id: "PEV-913", date: "04/10 19:22", type: "emission", detail: "2 billets émis après confirmation serveur (voir TXN-10242, débit initial).", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10247",
    refOperateur: "MM-2505-117951",
    refReservation: "RES-2049",
    date: "Hier 08:12",
    jour: "Hier",
    compagnie: "Kayes Lines",
    telephone: "+223 92 55 10 76",
    operateur: "Moov Money",
    montant: 9250,
    statut: "reussi",
    billetsEmis: 1,
    releve: true,
    timeline: [
      { id: "PEV-921", date: "Hier 08:12", type: "emission", detail: "1 billet émis et envoyé par SMS après confirmation serveur.", source: "Serveur TBM" },
      { id: "PEV-920", date: "Hier 08:12", type: "confirmation", detail: "Retour fiable de l'opérateur reçu — débit de 9 250 FCFA confirmé (MM-2505-117951).", source: "Opérateur" },
      { id: "PEV-919", date: "Hier 08:11", type: "requete_operateur", detail: "Requête de paiement transmise à Moov Money.", source: "Serveur TBM" },
      { id: "PEV-918", date: "Hier 08:12", type: "initiation", detail: "Réservation RES-2049 créée — 1 place bloquée (RG1).", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10246",
    refOperateur: "OM-2505-447602",
    refReservation: "RES-2045",
    date: "Hier 15:41",
    jour: "Hier",
    compagnie: "Bamako Express",
    telephone: "+223 76 88 51 14",
    operateur: "Orange Money",
    montant: 22500,
    statut: "reussi",
    billetsEmis: 2,
    releve: true,
    timeline: [
      { id: "PEV-925", date: "Hier 15:41", type: "emission", detail: "2 billets émis et envoyés par SMS après confirmation serveur.", source: "Serveur TBM" },
      { id: "PEV-924", date: "Hier 15:41", type: "confirmation", detail: "Retour fiable de l'opérateur reçu — débit de 22 500 FCFA confirmé (OM-2505-447602).", source: "Opérateur" },
      { id: "PEV-923", date: "Hier 15:40", type: "requete_operateur", detail: "Requête de paiement transmise à Orange Money.", source: "Serveur TBM" },
      { id: "PEV-922", date: "Hier 15:41", type: "initiation", detail: "Réservation RES-2045 créée — 2 places bloquées (RG1).", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10245",
    refOperateur: "OM-2505-447633",
    refReservation: "RES-2042",
    date: "Hier 18:02",
    jour: "Hier",
    compagnie: "Bamako Express",
    telephone: "+223 66 05 77 21",
    operateur: "Orange Money",
    montant: 13250,
    statut: "reussi",
    billetsEmis: 3,
    releve: true,
    timeline: [
      { id: "PEV-929", date: "Hier 18:02", type: "emission", detail: "3 billets émis et envoyés par SMS après confirmation serveur.", source: "Serveur TBM" },
      { id: "PEV-928", date: "Hier 18:02", type: "confirmation", detail: "Retour fiable de l'opérateur reçu — débit de 13 250 FCFA confirmé (OM-2505-447633).", source: "Opérateur" },
      { id: "PEV-927", date: "Hier 18:01", type: "requete_operateur", detail: "Requête de paiement transmise à Orange Money.", source: "Serveur TBM" },
      { id: "PEV-926", date: "Hier 18:02", type: "initiation", detail: "Réservation RES-2042 créée — 3 places bloquées (RG1).", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10244",
    refOperateur: "MM-2505-117988",
    refReservation: null,
    date: "Hier 18:22",
    jour: "Hier",
    compagnie: "Sikasso Voyage",
    telephone: "+223 76 22 41 09",
    operateur: "Moov Money",
    montant: 12500,
    statut: "reussi",
    billetsEmis: 0,
    releve: true,
    anomalie: {
      statut: "detectee",
      detail:
        "Débit confirmé par Moov Money après expiration des places (RG1) — aucun billet émis. Détecté par le rapprochement du relevé du 05/10.",
    },
    timeline: [
      { id: "PEV-935", date: "Aujourd'hui 05:30", type: "anomalie", detail: "Anomalie détectée au rapprochement : débit présent au relevé Moov Money, aucune émission côté TBM.", source: "Serveur TBM" },
      { id: "PEV-934", date: "Hier 18:24", type: "confirmation", detail: "Retour opérateur reçu APRÈS libération des places — le débit de 12 500 FCFA est pourtant confirmé (MM-2505-117988).", source: "Opérateur" },
      { id: "PEV-933", date: "Hier 18:23", type: "expiration", detail: "Places libérées après 10 min (RG1) — le retour de l'opérateur n'était pas encore arrivé.", source: "Serveur TBM" },
      { id: "PEV-932", date: "Hier 18:22", type: "requete_operateur", detail: "Requête de paiement transmise à Moov Money.", source: "Serveur TBM" },
      { id: "PEV-931", date: "Hier 18:22", type: "initiation", detail: "Demande de paiement initiée depuis le site TBM (2 places, Bamako → Sikasso).", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10243",
    refOperateur: "OM-2505-447318",
    refReservation: "RES-2052",
    date: "Hier 20:15",
    jour: "Hier",
    compagnie: "Sahel Bus",
    telephone: "+223 77 23 84 66",
    operateur: "Orange Money",
    montant: 5250,
    statut: "reussi",
    billetsEmis: 1,
    releve: true,
    timeline: [
      { id: "PEV-939", date: "Hier 20:15", type: "emission", detail: "1 billet émis et envoyé par SMS après confirmation serveur.", source: "Serveur TBM" },
      { id: "PEV-938", date: "Hier 20:15", type: "confirmation", detail: "Retour fiable de l'opérateur reçu — débit de 5 250 FCFA confirmé (OM-2505-447318).", source: "Opérateur" },
      { id: "PEV-937", date: "Hier 20:14", type: "requete_operateur", detail: "Requête de paiement transmise à Orange Money.", source: "Serveur TBM" },
      { id: "PEV-936", date: "Hier 20:15", type: "initiation", detail: "Réservation RES-2052 créée — 1 place bloquée (RG1).", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10242",
    refOperateur: "MM-2504-117604",
    refReservation: null,
    date: "04/10 12:47",
    jour: "04/10",
    compagnie: "Sahel Bus",
    telephone: "+223 70 55 12 30",
    operateur: "Moov Money",
    montant: 9000,
    statut: "echoue",
    billetsEmis: 0,
    releve: false,
    timeline: [
      { id: "PEV-943", date: "04/10 12:47", type: "echec", detail: "Débit refusé par l'opérateur — solde insuffisant. Aucun montant prélevé, aucun billet émis.", source: "Opérateur" },
      { id: "PEV-942", date: "04/10 12:46", type: "requete_operateur", detail: "Requête de paiement transmise à Moov Money.", source: "Serveur TBM" },
      { id: "PEV-941", date: "04/10 12:46", type: "initiation", detail: "Demande de paiement initiée depuis le site TBM.", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10241",
    refOperateur: "OM-2504-447214",
    refReservation: "RES-2044",
    date: "04/10 19:22",
    jour: "04/10",
    compagnie: "Sahel Bus",
    telephone: "+223 78 30 44 92",
    operateur: "Orange Money",
    montant: 17500,
    statut: "reussi",
    billetsEmis: 2,
    releve: true,
    timeline: [
      { id: "PEV-947", date: "Aujourd'hui 11:20", type: "remboursement", detail: "Paiement remboursé intégralement suite à l'annulation du départ (voir TXN-10248).", source: "Serveur TBM" },
      { id: "PEV-946", date: "04/10 19:22", type: "emission", detail: "2 billets émis et envoyés par SMS après confirmation serveur.", source: "Serveur TBM" },
      { id: "PEV-945", date: "04/10 19:22", type: "confirmation", detail: "Retour fiable de l'opérateur reçu — débit de 17 500 FCFA confirmé (OM-2504-447214).", source: "Opérateur" },
      { id: "PEV-944", date: "04/10 19:21", type: "requete_operateur", detail: "Requête de paiement transmise à Orange Money.", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10240",
    refOperateur: "OM-2503-446908",
    refReservation: null,
    date: "03/10 09:14",
    jour: "03/10",
    compagnie: "Bamako Express",
    telephone: "+223 65 08 77 12",
    operateur: "Orange Money",
    montant: 22500,
    statut: "expire",
    billetsEmis: 0,
    releve: false,
    timeline: [
      { id: "PEV-951", date: "03/10 09:24", type: "expiration", detail: "Délai de 10 min dépassé (RG1) — places libérées, aucun débit constaté au relevé.", source: "Serveur TBM" },
      { id: "PEV-950", date: "03/10 09:14", type: "requete_operateur", detail: "Requête de paiement transmise à Orange Money — jamais finalisée.", source: "Serveur TBM" },
      { id: "PEV-949", date: "03/10 09:14", type: "initiation", detail: "Demande de paiement initiée depuis le site TBM (2 places, Bamako → Ségou).", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10239",
    refOperateur: "MM-2502-117355",
    refReservation: null,
    date: "02/10 14:03",
    jour: "02/10",
    compagnie: "Djoliba Transport",
    telephone: "+223 91 44 20 85",
    operateur: "Moov Money",
    montant: 5250,
    statut: "echoue",
    billetsEmis: 0,
    releve: false,
    timeline: [
      { id: "PEV-955", date: "02/10 14:03", type: "echec", detail: "Débit refusé par l'opérateur — authentification USSD abandonnée par le client.", source: "Opérateur" },
      { id: "PEV-954", date: "02/10 14:02", type: "requete_operateur", detail: "Requête de paiement transmise à Moov Money.", source: "Serveur TBM" },
      { id: "PEV-953", date: "02/10 14:02", type: "initiation", detail: "Demande de paiement initiée depuis le site TBM.", source: "Serveur TBM" },
    ],
  },
  {
    id: "TXN-10238",
    refOperateur: "OM-2502-446231",
    refReservation: null,
    date: "02/10 09:12",
    jour: "02/10",
    compagnie: "Djoliba Transport",
    telephone: "+223 66 12 90 04",
    operateur: "Orange Money",
    montant: 7500,
    statut: "rembourse",
    billetsEmis: 1,
    releve: true,
    timeline: [
      { id: "PEV-959", date: "04/10 11:20", type: "remboursement", detail: "Remboursement de 7 500 FCFA validé (RMB-029) — annulation voyageur plus de 24 h avant le départ (RG5).", source: "Back-office" },
      { id: "PEV-958", date: "02/10 09:12", type: "emission", detail: "1 billet émis après confirmation serveur, puis annulé à la demande du voyageur.", source: "Serveur TBM" },
      { id: "PEV-957", date: "02/10 09:12", type: "confirmation", detail: "Retour fiable de l'opérateur reçu — débit de 7 500 FCFA confirmé (OM-2502-446231).", source: "Opérateur" },
      { id: "PEV-956", date: "02/10 09:11", type: "requete_operateur", detail: "Requête de paiement transmise à Orange Money.", source: "Serveur TBM" },
    ],
  },
];

/* --------------- Remboursements & litiges (A03) ------------- */

/** Motif de la demande (spéc MVP : annulation, double paiement, départ annulé, incident). */
export type RefundReason =
  | "annulation"
  | "double_paiement"
  | "depart_annule"
  | "incident";

export const REFUND_REASON_META: Record<
  RefundReason,
  { label: string; className: string; description: string }
> = {
  annulation: {
    label: "Annulation voyageur",
    className: "bg-sky-50 text-sky-600",
    description:
      "Annulation à l'initiative du voyageur — paliers de remboursement RG5 appliqués.",
  },
  double_paiement: {
    label: "Double paiement",
    className: "bg-violet-100 text-violet-600",
    description:
      "Le compte a été débité plusieurs fois pour une même réservation.",
  },
  depart_annule: {
    label: "Départ annulé",
    className: "bg-amber-50 text-amber-600",
    description:
      "Départ annulé par la compagnie — remboursement intégral du voyageur.",
  },
  incident: {
    label: "Incident",
    className: "bg-rose-50 text-rose-600",
    description:
      "Incident signalé : débit sans billet reçu, panne, problème opérationnel…",
  },
};

/** Cycle de vie d'un dossier : en attente → validé → remboursé (ou refusé). */
export type RefundStatus = "en_attente" | "approuve" | "rembourse" | "refuse";

export const REFUND_STATUS_META: Record<
  RefundStatus,
  { label: string; className: string }
> = {
  en_attente: { label: "En attente", className: "bg-amber-50 text-amber-600" },
  approuve: { label: "Validé", className: "bg-sky-50 text-sky-600" },
  rembourse: { label: "Remboursé", className: "bg-emerald-50 text-emerald-600" },
  refuse: { label: "Refusé", className: "bg-rose-50 text-rose-600" },
};

/**
 * Droits spécifiques : un agent Support peut décider et exécuter un
 * remboursement jusqu'à ce seuil ; au-delà, la validation administrateur
 * est obligatoire. La levée des litiges est réservée à l'administration.
 */
export const REFUND_SUPPORT_LIMIT = 15000; // FCFA

/** Tranche de remboursement effectivement exécutée vers l'opérateur. */
export interface RefundVersement {
  id: string;
  date: string;
  montant: number;
  refOperateur: string; // référence du versement chez l'opérateur
  par: string; // agent back-office qui a enregistré le versement
}

/** Événement de traçabilité d'un dossier (chaque action est signée). */
export type RefundEventKind =
  | "demande"
  | "prise_en_charge"
  | "decision"
  | "versement"
  | "litige_ouvert"
  | "litige_resolu";

export const REFUND_EVENT_META: Record<
  RefundEventKind,
  { label: string; className: string }
> = {
  demande: { label: "Demande reçue", className: "bg-neutral-100 text-neutral-500" },
  prise_en_charge: { label: "Prise en charge", className: "bg-sky-50 text-sky-600" },
  decision: { label: "Décision", className: "bg-coral-50 text-coral-600" },
  versement: { label: "Versement opérateur", className: "bg-emerald-50 text-emerald-600" },
  litige_ouvert: { label: "Litige ouvert", className: "bg-rose-50 text-rose-600" },
  litige_resolu: { label: "Litige résolu", className: "bg-emerald-50 text-emerald-600" },
};

export interface RefundEvent {
  id: string;
  date: string;
  type: RefundEventKind;
  detail: string;
  par: string; // agent ou « Système — plateforme TBM »
  role: string; // rôle au moment de l'action
}

export interface Refund {
  id: string;
  transaction: string; // débit d'origine (TXN-xxxxx)
  refReservation: string | null;
  passager: string;
  telephone: string;
  compagnie: string;
  operateur: Operator;
  motif: RefundReason;
  motifDetail: string; // détail libre de la demande
  montantRemboursable: number; // montant total éligible (RG11, sans décimales)
  statut: RefundStatus;
  demande: string; // réception de la demande
  traitePar?: string; // agent en charge du dossier
  justification?: string; // obligatoire pour toute décision
  litige?: {
    ouvert: boolean;
    detail: string;
    ouvertLe: string;
    ouvertPar?: string;
    resolution?: string;
    resoluPar?: string;
  };
  versements: RefundVersement[]; // tranches déjà exécutées vers l'opérateur
  historique: RefundEvent[];
}

/** Montant déjà remboursé (somme des versements opérateur). */
export function refundMontantRembourse(r: Refund): number {
  return r.versements.reduce((s, v) => s + v.montant, 0);
}

/** Reste à rembourser sur le dossier. */
export function refundResteDu(r: Refund): number {
  return Math.max(0, r.montantRemboursable - refundMontantRembourse(r));
}

export const initialRefunds: Refund[] = [
  {
    id: "RMB-031",
    transaction: "TXN-10245",
    refReservation: "RES-2042",
    passager: "Ibrahim Maïga",
    telephone: "+223 66 05 77 21",
    compagnie: "Bamako Express",
    operateur: "Orange Money",
    motif: "annulation",
    motifDetail:
      "Empêchement familial — annulation de la réservation RES-2042 (3 billets) plus de 24 h avant le départ.",
    montantRemboursable: 13250,
    statut: "en_attente",
    demande: "Aujourd'hui 07:45",
    versements: [],
    historique: [
      {
        id: "RVE-401",
        date: "Aujourd'hui 07:45",
        type: "demande",
        detail: "Demande reçue depuis le formulaire en ligne — pièces jointes : copie de la réservation.",
        par: "Système — plateforme TBM",
        role: "Automatisation",
      },
    ],
  },
  {
    id: "RMB-030",
    transaction: "TXN-10244",
    refReservation: null,
    passager: "Moussa Traoré",
    telephone: "+223 76 22 41 09",
    compagnie: "Sikasso Voyage",
    operateur: "Moov Money",
    motif: "incident",
    motifDetail:
      "Argent débité (MM-2505-117988) mais aucun ticket reçu — anomalie confirmée par le rapprochement du relevé Moov Money.",
    montantRemboursable: 12500,
    statut: "en_attente",
    demande: "Aujourd'hui 06:05",
    versements: [],
    historique: [
      {
        id: "RVE-402",
        date: "Aujourd'hui 06:05",
        type: "demande",
        detail: "Demande ouverte automatiquement après détection de l'anomalie « débité sans billet » (TXN-10244).",
        par: "Système — plateforme TBM",
        role: "Automatisation",
      },
    ],
  },
  {
    id: "RMB-032",
    transaction: "TXN-10246",
    refReservation: "RES-2045",
    passager: "Oumar Cissé",
    telephone: "+223 76 88 51 14",
    compagnie: "Bamako Express",
    operateur: "Orange Money",
    motif: "double_paiement",
    motifDetail:
      "Le client signale deux débits de 22 500 FCFA le même jour pour une seule réservation (2 billets, Bamako → Ségou).",
    montantRemboursable: 22500,
    statut: "en_attente",
    demande: "05/10 19:32",
    litige: {
      ouvert: true,
      detail:
        "Bamako Express conteste : un seul débit figurerait au relevé du 05/10. Capture Orange Money du client contre déclaration de la compagnie — escalade administrative.",
      ouvertLe: "Hier 20:10",
      ouvertPar: "Mody BARRY",
    },
    versements: [],
    historique: [
      {
        id: "RVE-410",
        date: "05/10 19:32",
        type: "demande",
        detail: "Demande reçue par téléphone au support TBM — capture d'écran du double débit transmise par SMS.",
        par: "Système — plateforme TBM",
        role: "Automatisation",
      },
      {
        id: "RVE-411",
        date: "Hier 20:10",
        type: "litige_ouvert",
        detail:
          "Litige ouvert : la compagnie conteste le double débit — escalade à l'administration, dossier gelé jusqu'à résolution.",
        par: "Mody BARRY",
        role: "Support TBM",
      },
    ],
  },
  {
    id: "RMB-035",
    transaction: "TXN-10247",
    refReservation: "RES-2049",
    passager: "Yacouba Ouattara",
    telephone: "+223 92 55 10 76",
    compagnie: "Kayes Lines",
    operateur: "Moov Money",
    motif: "incident",
    motifDetail:
      "Hospitalisation le jour du départ (justificatif fourni) — le billet n'a pas été scanné, demande de remboursement exceptionnelle.",
    montantRemboursable: 9250,
    statut: "en_attente",
    demande: "Aujourd'hui 08:40",
    versements: [],
    historique: [
      {
        id: "RVE-403",
        date: "Aujourd'hui 08:40",
        type: "demande",
        detail: "Demande reçue au guichet de Kayes N'Di — certificat médical joint au dossier.",
        par: "Système — plateforme TBM",
        role: "Automatisation",
      },
    ],
  },
  {
    id: "RMB-034",
    transaction: "TXN-10241",
    refReservation: "RES-2044",
    passager: "Sékou Konaté",
    telephone: "+223 78 30 44 92",
    compagnie: "Sahel Bus",
    operateur: "Orange Money",
    motif: "depart_annule",
    motifDetail:
      "Départ Bamako → Mopti annulé par la compagnie (pluies torrentielles RN6) — remboursement validé, versement opérateur à confirmer.",
    montantRemboursable: 17500,
    statut: "approuve",
    demande: "Aujourd'hui 09:05",
    traitePar: "Daouda FOMBA",
    justification:
      "Départ annulé par la compagnie — remboursement intégral (montant > 15 000 FCFA, validation administrateur requise).",
    versements: [],
    historique: [
      {
        id: "RVE-404",
        date: "Aujourd'hui 09:05",
        type: "demande",
        detail: "Demande reçue depuis le formulaire en ligne — annulation du départ confirmée par le dispatch Sahel Bus.",
        par: "Système — plateforme TBM",
        role: "Automatisation",
      },
      {
        id: "RVE-405",
        date: "Aujourd'hui 09:22",
        type: "prise_en_charge",
        detail: "Dossier pris en charge après vérification de l'annulation du départ et du débit d'origine.",
        par: "Daouda FOMBA",
        role: "Administrateur TBM",
      },
      {
        id: "RVE-406",
        date: "Aujourd'hui 09:25",
        type: "decision",
        detail:
          "Remboursement validé — « Départ annulé par la compagnie — remboursement intégral (montant > 15 000 FCFA, validation administrateur requise). »",
        par: "Daouda FOMBA",
        role: "Administrateur TBM",
      },
    ],
  },
  {
    id: "RMB-028",
    transaction: "TXN-10235",
    refReservation: null,
    passager: "Ibrahim Keïta",
    telephone: "+223 70 45 91 22",
    compagnie: "Djoliba Transport",
    operateur: "Orange Money",
    motif: "double_paiement",
    motifDetail:
      "Deux débits de 15 000 FCFA constatés le 03/10 pour une même commande — le second débit est indû.",
    montantRemboursable: 15000,
    statut: "approuve",
    demande: "03/10 16:27",
    traitePar: "Mody BARRY",
    justification:
      "Double débit confirmé par le relevé Orange Money du 03/10 — remboursement du second versement (relevé OM-2503-446611).",
    versements: [
      {
        id: "RVS-118",
        date: "04/10 10:40",
        montant: 10000,
        refOperateur: "OM-RMB-87934",
        par: "Mody BARRY",
      },
    ],
    historique: [
      {
        id: "RVE-407",
        date: "03/10 16:27",
        type: "demande",
        detail: "Demande reçue depuis le formulaire en ligne — relevé Orange Money joint.",
        par: "Système — plateforme TBM",
        role: "Automatisation",
      },
      {
        id: "RVE-408",
        date: "03/10 17:02",
        type: "prise_en_charge",
        detail: "Dossier pris en charge — vérification des deux débits auprès de l'opérateur.",
        par: "Mody BARRY",
        role: "Support TBM",
      },
      {
        id: "RVE-409",
        date: "03/10 17:15",
        type: "decision",
        detail:
          "Remboursement validé — « Double débit confirmé par le relevé Orange Money du 03/10 — remboursement du second versement (relevé OM-2503-446611). »",
        par: "Mody BARRY",
        role: "Support TBM",
      },
      {
        id: "RVE-412",
        date: "04/10 10:40",
        type: "versement",
        detail:
          "1er versement de 10 000 FCFA exécuté vers le compte d'origine (réf. OM-RMB-87934) — reste 5 000 FCFA à verser.",
        par: "Mody BARRY",
        role: "Support TBM",
      },
    ],
  },
  {
    id: "RMB-029",
    transaction: "TXN-10238",
    refReservation: null,
    passager: "Fatoumata Diallo",
    telephone: "+223 66 12 90 04",
    compagnie: "Djoliba Transport",
    operateur: "Orange Money",
    motif: "annulation",
    motifDetail:
      "Annulation par le voyageur plus de 24 h avant le départ — palier 100 % (RG5).",
    montantRemboursable: 7500,
    statut: "rembourse",
    demande: "04/10 10:12",
    traitePar: "Mody BARRY",
    justification:
      "Délai > 24 h — remboursement intégral conforme à la politique (RG5).",
    versements: [
      {
        id: "RVS-121",
        date: "04/10 11:20",
        montant: 7500,
        refOperateur: "OM-RMB-88012",
        par: "Mody BARRY",
      },
    ],
    historique: [
      {
        id: "RVE-413",
        date: "04/10 10:12",
        type: "demande",
        detail: "Demande reçue depuis le formulaire en ligne.",
        par: "Système — plateforme TBM",
        role: "Automatisation",
      },
      {
        id: "RVE-414",
        date: "04/10 10:40",
        type: "prise_en_charge",
        detail: "Dossier pris en charge — délai d'annulation vérifié (34 h avant le départ).",
        par: "Mody BARRY",
        role: "Support TBM",
      },
      {
        id: "RVE-415",
        date: "04/10 11:15",
        type: "decision",
        detail:
          "Remboursement validé — « Délai > 24 h — remboursement intégral conforme à la politique (RG5). »",
        par: "Mody BARRY",
        role: "Support TBM",
      },
      {
        id: "RVE-416",
        date: "04/10 11:20",
        type: "versement",
        detail:
          "Versement intégral de 7 500 FCFA exécuté (réf. OM-RMB-88012) — dossier soldé.",
        par: "Mody BARRY",
        role: "Support TBM",
      },
    ],
  },
  {
    id: "RMB-026",
    transaction: "TXN-10236",
    refReservation: null,
    passager: "Aïcha Sissoko",
    telephone: "+223 74 20 61 38",
    compagnie: "Bamako Express",
    operateur: "Orange Money",
    motif: "depart_annule",
    motifDetail:
      "Départ Ségou → Mopti annulé la veille par la compagnie — ticket jamais utilisé.",
    montantRemboursable: 10500,
    statut: "rembourse",
    demande: "02/10 15:20",
    traitePar: "Daouda FOMBA",
    justification:
      "Annulation compagnie confirmée au dispatch — remboursement intégral au titre des départs annulés.",
    versements: [
      {
        id: "RVS-114",
        date: "03/10 09:05",
        montant: 10500,
        refOperateur: "OM-RMB-87870",
        par: "Daouda FOMBA",
      },
    ],
    historique: [
      {
        id: "RVE-417",
        date: "02/10 15:20",
        type: "demande",
        detail: "Demande reçue par téléphone au support TBM.",
        par: "Système — plateforme TBM",
        role: "Automatisation",
      },
      {
        id: "RVE-418",
        date: "02/10 16:05",
        type: "prise_en_charge",
        detail: "Dossier pris en charge — confirmation de l'annulation auprès du dispatch.",
        par: "Daouda FOMBA",
        role: "Administrateur TBM",
      },
      {
        id: "RVE-419",
        date: "02/10 16:12",
        type: "decision",
        detail:
          "Remboursement validé — « Annulation compagnie confirmée au dispatch — remboursement intégral au titre des départs annulés. »",
        par: "Daouda FOMBA",
        role: "Administrateur TBM",
      },
      {
        id: "RVE-420",
        date: "03/10 09:05",
        type: "versement",
        detail:
          "Versement intégral de 10 500 FCFA exécuté (réf. OM-RMB-87870) — dossier soldé.",
        par: "Daouda FOMBA",
        role: "Administrateur TBM",
      },
    ],
  },
  {
    id: "RMB-027",
    transaction: "TXN-10233",
    refReservation: null,
    passager: "Salif Diarra",
    telephone: "+223 76 33 08 79",
    compagnie: "Sahel Bus",
    operateur: "Moov Money",
    motif: "annulation",
    motifDetail:
      "Annulation demandée 3 h avant le départ — le client sollicite un geste commercial.",
    montantRemboursable: 5000,
    statut: "refuse",
    demande: "02/10 09:44",
    traitePar: "Mody BARRY",
    justification:
      "Moins de 6 h avant le départ : aucun remboursement (RG5). Un avoir de 50 % a été proposé au client.",
    versements: [],
    historique: [
      {
        id: "RVE-421",
        date: "02/10 09:44",
        type: "demande",
        detail: "Demande reçue depuis le formulaire en ligne.",
        par: "Système — plateforme TBM",
        role: "Automatisation",
      },
      {
        id: "RVE-422",
        date: "02/10 10:30",
        type: "prise_en_charge",
        detail: "Dossier pris en charge — délai d'annulation vérifié (3 h avant le départ).",
        par: "Mody BARRY",
        role: "Support TBM",
      },
      {
        id: "RVE-423",
        date: "02/10 10:41",
        type: "decision",
        detail:
          "Remboursement refusé — « Moins de 6 h avant le départ : aucun remboursement (RG5). Un avoir de 50 % a été proposé au client. »",
        par: "Mody BARRY",
        role: "Support TBM",
      },
    ],
  },
];

/* ------------ Commissions & reversements (A11) -------------- */

/**
 * Modèle d'encaissement retenu par TBM — il détermine qui collecte
 * l'argent des voyageurs et donc le sens du reversement :
 *  - « plateforme » : TBM encaisse (Orange/Moov), prélève sa commission
 *    et reverse le net aux compagnies ;
 *  - « compagnie » : la compagnie encaisse et règle la commission TBM.
 * Le module est conçu pour les deux modèles ; certaines opérations
 * restent finalisées manuellement au lancement (validation, exécution).
 */
export type EncaissementMode = "plateforme" | "compagnie";

export const ENCAISSEMENT_MODE_META: Record<
  EncaissementMode,
  { label: string; description: string }
> = {
  plateforme: {
    label: "TBM encaisse, puis reverse",
    description:
      "Les paiements voyageurs arrivent sur les comptes TBM (Orange Money / Moov Money). TBM prélève sa commission puis reverse le net à chaque compagnie.",
  },
  compagnie: {
    label: "La compagnie encaisse",
    description:
      "Les paiements arrivent directement chez la compagnie. La commission TBM est décomptée puis réglée périodiquement par la compagnie.",
  },
};

export const TBM_ENCAISSEMENT_MODE: EncaissementMode = "plateforme";

/** Cycle de vie d'un reversement : à calculer → à valider → en cours → payé. */
export type SettlementStatus = "a_calculer" | "a_valider" | "en_cours" | "paye";

export const SETTLEMENT_STATUS_META: Record<
  SettlementStatus,
  { label: string; className: string }
> = {
  a_calculer: { label: "À calculer", className: "bg-amber-50 text-amber-600" },
  a_valider: { label: "À valider", className: "bg-sky-50 text-sky-600" },
  en_cours: { label: "En cours", className: "bg-coral-50 text-coral-600" },
  paye: { label: "Payé", className: "bg-emerald-50 text-emerald-600" },
};

/** Moyen utilisé pour exécuter le reversement vers la compagnie. */
export type ReversementMoyen =
  | "virement_bancaire"
  | "orange_money"
  | "moov_money";

export const REVERSEMENT_MOYEN_META: Record<
  ReversementMoyen,
  { label: string; className: string }
> = {
  virement_bancaire: {
    label: "Virement bancaire",
    className: "bg-neutral-100 text-neutral-600",
  },
  orange_money: { label: "Orange Money", className: "bg-orange-50 text-orange-600" },
  moov_money: { label: "Moov Money", className: "bg-violet-100 text-violet-600" },
};

/** Justificatifs et relevés rattachés à chaque reversement. */
export type SettlementDocKind =
  | "releve_collecte"
  | "avis_commission"
  | "preuve_paiement";

export const SETTLEMENT_DOC_META: Record<
  SettlementDocKind,
  { label: string; description: string }
> = {
  releve_collecte: {
    label: "Relevé de collecte",
    description:
      "Détail des transactions confirmées de la période (rapprochement A02).",
  },
  avis_commission: {
    label: "Avis de commission",
    description:
      "Décompte détaillé : collecté brut − remboursements − commission = net à reverser.",
  },
  preuve_paiement: {
    label: "Preuve de reversement",
    description:
      "Avis de virement ou reçu opérateur avec la référence du paiement exécuté.",
  },
};

export interface SettlementDoc {
  id: string;
  kind: SettlementDocKind;
  nom: string; // nom de fichier téléchargeable
  taille: string;
  genereLe: string;
}

export type SettlementEventKind = "creation" | "calcul" | "validation" | "paiement";

export const SETTLEMENT_EVENT_META: Record<
  SettlementEventKind,
  { label: string; className: string }
> = {
  creation: { label: "Période clôturée", className: "bg-neutral-100 text-neutral-500" },
  calcul: { label: "Calcul", className: "bg-sky-50 text-sky-600" },
  validation: { label: "Validation", className: "bg-coral-50 text-coral-600" },
  paiement: { label: "Reversement exécuté", className: "bg-emerald-50 text-emerald-600" },
};

export interface SettlementEvent {
  id: string;
  date: string;
  type: SettlementEventKind;
  detail: string;
  par: string; // agent ou « Système — plateforme TBM »
  role: string;
}

export interface Settlement {
  id: string; // REV-2026-0xx
  compagnie: string; // nom (cohérent avec transactions / remboursements)
  periode: string; // libellé affiché
  periodeDebut: string;
  periodeFin: string;
  statut: SettlementStatus;
  brutCollecte: number; // transactions confirmées de la période (A02)
  remboursements: number; // remboursements exécutés sur la période (A03)
  commissionTaux: number; // % contractuel de la compagnie (A01)
  commissionMontant: number; // arrondi sur le collecté net (RG11)
  netAReverser: number;
  nbTransactions: number;
  nbBillets: number;
  nbRemboursements: number;
  estimation?: { brut: number; transactions: number; billets: number }; // provisoire, avant calcul
  moyen?: ReversementMoyen;
  refPaiement?: string;
  calculeLe?: string;
  calculePar?: string;
  valideLe?: string;
  validePar?: string;
  payeLe?: string;
  payePar?: string;
  docs: SettlementDoc[];
  historique: SettlementEvent[];
}

/** Collecté net de la période (après remboursements). */
export function settlementNetCollecte(s: Settlement): number {
  return Math.max(0, s.brutCollecte - s.remboursements);
}

/**
 * Montants consolidés au calcul (démo) — la consolidation réelle part
 * des transactions confirmées et des remboursements exécutés de la période.
 */
export const SETTLEMENT_PRECOMPUTED: Record<
  string,
  {
    brutCollecte: number;
    remboursements: number;
    nbTransactions: number;
    nbBillets: number;
    nbRemboursements: number;
  }
> = {
  "REV-2026-042": {
    brutCollecte: 305000,
    remboursements: 7500,
    nbTransactions: 41,
    nbBillets: 63,
    nbRemboursements: 1,
  },
  "REV-2026-043": {
    brutCollecte: 224500,
    remboursements: 0,
    nbTransactions: 26,
    nbBillets: 39,
    nbRemboursements: 0,
  },
};

export const initialSettlements: Settlement[] = [
  {
    id: "REV-2026-035",
    compagnie: "Sikasso Voyage",
    periode: "Semaine 39 · 15/09 → 21/09",
    periodeDebut: "15/09",
    periodeFin: "21/09",
    statut: "paye",
    brutCollecte: 132000,
    remboursements: 0,
    commissionTaux: 10,
    commissionMontant: 13200,
    netAReverser: 118800,
    nbTransactions: 18,
    nbBillets: 27,
    nbRemboursements: 0,
    moyen: "orange_money",
    refPaiement: "OM-REV-87504",
    calculeLe: "22/09 05:40",
    calculePar: "Système — plateforme TBM",
    valideLe: "22/09 09:15",
    validePar: "Daouda FOMBA",
    payeLe: "22/09 14:20",
    payePar: "Daouda FOMBA",
    docs: [
      { id: "SDC-104", kind: "releve_collecte", nom: "releve-collecte-REV-2026-035.pdf", taille: "31 Ko", genereLe: "22/09 05:40" },
      { id: "SDC-105", kind: "avis_commission", nom: "avis-commission-REV-2026-035.pdf", taille: "14 Ko", genereLe: "22/09 05:40" },
      { id: "SDC-106", kind: "preuve_paiement", nom: "preuve-reversement-REV-2026-035.pdf", taille: "9 Ko", genereLe: "22/09 14:20" },
    ],
    historique: [
      { id: "SVE-311", date: "22/09 14:20", type: "paiement", detail: "Reversement de 118 800 FCFA exécuté via Orange Money (réf. OM-REV-87504) — preuve rattachée au dossier.", par: "Daouda FOMBA", role: "Administrateur TBM" },
      { id: "SVE-310", date: "22/09 09:15", type: "validation", detail: "Reversement validé — net de 118 800 FCFA à reverser à Sikasso Voyage.", par: "Daouda FOMBA", role: "Administrateur TBM" },
      { id: "SVE-309", date: "22/09 05:40", type: "calcul", detail: "Calcul consolidé : collecté brut 132 000 − remboursements 0 − commission 10 % (13 200) = net à reverser 118 800 FCFA.", par: "Système — plateforme TBM", role: "Automatisation" },
      { id: "SVE-308", date: "21/09 23:55", type: "creation", detail: "Période clôturée — reversement ouvert automatiquement après clôture des rapprochements quotidiens (A02).", par: "Système — plateforme TBM", role: "Automatisation" },
    ],
  },
  {
    id: "REV-2026-036",
    compagnie: "Bamako Express",
    periode: "Semaine 40 · 22/09 → 28/09",
    periodeDebut: "22/09",
    periodeFin: "28/09",
    statut: "paye",
    brutCollecte: 648000,
    remboursements: 21000,
    commissionTaux: 10,
    commissionMontant: 62700,
    netAReverser: 564300,
    nbTransactions: 92,
    nbBillets: 141,
    nbRemboursements: 3,
    moyen: "virement_bancaire",
    refPaiement: "BCEAO-87102-TBM",
    calculeLe: "29/09 05:40",
    calculePar: "Système — plateforme TBM",
    valideLe: "29/09 09:05",
    validePar: "Daouda FOMBA",
    payeLe: "29/09 15:10",
    payePar: "Daouda FOMBA",
    docs: [
      { id: "SDC-107", kind: "releve_collecte", nom: "releve-collecte-REV-2026-036.pdf", taille: "46 Ko", genereLe: "29/09 05:40" },
      { id: "SDC-108", kind: "avis_commission", nom: "avis-commission-REV-2026-036.pdf", taille: "17 Ko", genereLe: "29/09 05:40" },
      { id: "SDC-109", kind: "preuve_paiement", nom: "preuve-reversement-REV-2026-036.pdf", taille: "11 Ko", genereLe: "29/09 15:10" },
    ],
    historique: [
      { id: "SVE-315", date: "29/09 15:10", type: "paiement", detail: "Reversement de 564 300 FCFA exécuté par virement bancaire (réf. BCEAO-87102-TBM) — preuve rattachée au dossier.", par: "Daouda FOMBA", role: "Administrateur TBM" },
      { id: "SVE-314", date: "29/09 09:05", type: "validation", detail: "Reversement validé — net de 564 300 FCFA à reverser à Bamako Express.", par: "Daouda FOMBA", role: "Administrateur TBM" },
      { id: "SVE-313", date: "29/09 05:40", type: "calcul", detail: "Calcul consolidé : collecté brut 648 000 − remboursements 21 000 − commission 10 % (62 700) = net à reverser 564 300 FCFA.", par: "Système — plateforme TBM", role: "Automatisation" },
      { id: "SVE-312", date: "28/09 23:55", type: "creation", detail: "Période clôturée — reversement ouvert automatiquement après clôture des rapprochements quotidiens (A02).", par: "Système — plateforme TBM", role: "Automatisation" },
    ],
  },
  {
    id: "REV-2026-037",
    compagnie: "Djoliba Transport",
    periode: "Semaine 40 · 22/09 → 28/09",
    periodeDebut: "22/09",
    periodeFin: "28/09",
    statut: "paye",
    brutCollecte: 297500,
    remboursements: 7500,
    commissionTaux: 8,
    commissionMontant: 23200,
    netAReverser: 266800,
    nbTransactions: 45,
    nbBillets: 67,
    nbRemboursements: 1,
    moyen: "virement_bancaire",
    refPaiement: "BCEAO-87214-TBM",
    calculeLe: "29/09 05:40",
    calculePar: "Système — plateforme TBM",
    valideLe: "29/09 09:30",
    validePar: "Daouda FOMBA",
    payeLe: "30/09 10:40",
    payePar: "Daouda FOMBA",
    docs: [
      { id: "SDC-110", kind: "releve_collecte", nom: "releve-collecte-REV-2026-037.pdf", taille: "33 Ko", genereLe: "29/09 05:40" },
      { id: "SDC-111", kind: "avis_commission", nom: "avis-commission-REV-2026-037.pdf", taille: "15 Ko", genereLe: "29/09 05:40" },
      { id: "SDC-112", kind: "preuve_paiement", nom: "preuve-reversement-REV-2026-037.pdf", taille: "10 Ko", genereLe: "30/09 10:40" },
    ],
    historique: [
      { id: "SVE-319", date: "30/09 10:40", type: "paiement", detail: "Reversement de 266 800 FCFA exécuté par virement bancaire (réf. BCEAO-87214-TBM) — preuve rattachée au dossier.", par: "Daouda FOMBA", role: "Administrateur TBM" },
      { id: "SVE-318", date: "29/09 09:30", type: "validation", detail: "Reversement validé — net de 266 800 FCFA à reverser à Djoliba Transport.", par: "Daouda FOMBA", role: "Administrateur TBM" },
      { id: "SVE-317", date: "29/09 05:40", type: "calcul", detail: "Calcul consolidé : collecté brut 297 500 − remboursements 7 500 − commission 8 % (23 200) = net à reverser 266 800 FCFA.", par: "Système — plateforme TBM", role: "Automatisation" },
      { id: "SVE-316", date: "28/09 23:55", type: "creation", detail: "Période clôturée — reversement ouvert automatiquement après clôture des rapprochements quotidiens (A02).", par: "Système — plateforme TBM", role: "Automatisation" },
    ],
  },
  {
    id: "REV-2026-038",
    compagnie: "Kayes Lines",
    periode: "Semaine 40 · 22/09 → 28/09",
    periodeDebut: "22/09",
    periodeFin: "28/09",
    statut: "paye",
    brutCollecte: 92000,
    remboursements: 0,
    commissionTaux: 11,
    commissionMontant: 10120,
    netAReverser: 81880,
    nbTransactions: 9,
    nbBillets: 14,
    nbRemboursements: 0,
    moyen: "orange_money",
    refPaiement: "OM-REV-87688",
    calculeLe: "29/09 05:40",
    calculePar: "Système — plateforme TBM",
    valideLe: "29/09 09:40",
    validePar: "Daouda FOMBA",
    payeLe: "30/09 11:25",
    payePar: "Daouda FOMBA",
    docs: [
      { id: "SDC-113", kind: "releve_collecte", nom: "releve-collecte-REV-2026-038.pdf", taille: "24 Ko", genereLe: "29/09 05:40" },
      { id: "SDC-114", kind: "avis_commission", nom: "avis-commission-REV-2026-038.pdf", taille: "13 Ko", genereLe: "29/09 05:40" },
      { id: "SDC-115", kind: "preuve_paiement", nom: "preuve-reversement-REV-2026-038.pdf", taille: "8 Ko", genereLe: "30/09 11:25" },
    ],
    historique: [
      { id: "SVE-323", date: "30/09 11:25", type: "paiement", detail: "Reversement de 81 880 FCFA exécuté via Orange Money (réf. OM-REV-87688) — preuve rattachée au dossier.", par: "Daouda FOMBA", role: "Administrateur TBM" },
      { id: "SVE-322", date: "29/09 09:40", type: "validation", detail: "Reversement validé — net de 81 880 FCFA à reverser à Kayes Lines.", par: "Daouda FOMBA", role: "Administrateur TBM" },
      { id: "SVE-321", date: "29/09 05:40", type: "calcul", detail: "Calcul consolidé : collecté brut 92 000 − remboursements 0 − commission 11 % (10 120) = net à reverser 81 880 FCFA.", par: "Système — plateforme TBM", role: "Automatisation" },
      { id: "SVE-320", date: "28/09 23:55", type: "creation", detail: "Période clôturée — reversement ouvert automatiquement après clôture des rapprochements quotidiens (A02).", par: "Système — plateforme TBM", role: "Automatisation" },
    ],
  },
  {
    id: "REV-2026-039",
    compagnie: "Sahel Bus",
    periode: "Semaine 40 · 22/09 → 28/09",
    periodeDebut: "22/09",
    periodeFin: "28/09",
    statut: "en_cours",
    brutCollecte: 386000,
    remboursements: 18000,
    commissionTaux: 12,
    commissionMontant: 44160,
    netAReverser: 323840,
    nbTransactions: 55,
    nbBillets: 83,
    nbRemboursements: 2,
    calculeLe: "Hier 05:40",
    calculePar: "Système — plateforme TBM",
    valideLe: "Hier 16:20",
    validePar: "Daouda FOMBA",
    docs: [
      { id: "SDC-116", kind: "releve_collecte", nom: "releve-collecte-REV-2026-039.pdf", taille: "39 Ko", genereLe: "Hier 05:40" },
      { id: "SDC-117", kind: "avis_commission", nom: "avis-commission-REV-2026-039.pdf", taille: "16 Ko", genereLe: "Hier 05:40" },
    ],
    historique: [
      { id: "SVE-327", date: "Hier 16:20", type: "validation", detail: "Reversement validé — net de 323 840 FCFA à reverser à Sahel Bus. Exécution du paiement à finaliser manuellement (lancement).", par: "Daouda FOMBA", role: "Administrateur TBM" },
      { id: "SVE-326", date: "Hier 05:40", type: "calcul", detail: "Calcul consolidé : collecté brut 386 000 − remboursements 18 000 − commission 12 % (44 160) = net à reverser 323 840 FCFA.", par: "Système — plateforme TBM", role: "Automatisation" },
      { id: "SVE-325", date: "28/09 23:55", type: "creation", detail: "Période clôturée — reversement ouvert automatiquement après clôture des rapprochements quotidiens (A02).", par: "Système — plateforme TBM", role: "Automatisation" },
    ],
  },
  {
    id: "REV-2026-040",
    compagnie: "Bamako Express",
    periode: "Semaine 41 · 29/09 → 05/10",
    periodeDebut: "29/09",
    periodeFin: "05/10",
    statut: "a_valider",
    brutCollecte: 612000,
    remboursements: 32500,
    commissionTaux: 10,
    commissionMontant: 57950,
    netAReverser: 521550,
    nbTransactions: 87,
    nbBillets: 133,
    nbRemboursements: 4,
    calculeLe: "Aujourd'hui 05:40",
    calculePar: "Système — plateforme TBM",
    docs: [
      { id: "SDC-118", kind: "releve_collecte", nom: "releve-collecte-REV-2026-040.pdf", taille: "44 Ko", genereLe: "Aujourd'hui 05:40" },
      { id: "SDC-119", kind: "avis_commission", nom: "avis-commission-REV-2026-040.pdf", taille: "17 Ko", genereLe: "Aujourd'hui 05:40" },
    ],
    historique: [
      { id: "SVE-330", date: "Aujourd'hui 05:40", type: "calcul", detail: "Calcul consolidé : collecté brut 612 000 − remboursements 32 500 − commission 10 % (57 950) = net à reverser 521 550 FCFA. En attente de validation.", par: "Système — plateforme TBM", role: "Automatisation" },
      { id: "SVE-329", date: "05/10 23:55", type: "creation", detail: "Période clôturée — reversement ouvert automatiquement après clôture des rapprochements quotidiens (A02).", par: "Système — plateforme TBM", role: "Automatisation" },
    ],
  },
  {
    id: "REV-2026-041",
    compagnie: "Sikasso Voyage",
    periode: "Semaine 41 · 29/09 → 05/10",
    periodeDebut: "29/09",
    periodeFin: "05/10",
    statut: "a_valider",
    brutCollecte: 148500,
    remboursements: 12500,
    commissionTaux: 10,
    commissionMontant: 13600,
    netAReverser: 122400,
    nbTransactions: 21,
    nbBillets: 31,
    nbRemboursements: 1,
    calculeLe: "Aujourd'hui 05:40",
    calculePar: "Système — plateforme TBM",
    docs: [
      { id: "SDC-120", kind: "releve_collecte", nom: "releve-collecte-REV-2026-041.pdf", taille: "28 Ko", genereLe: "Aujourd'hui 05:40" },
      { id: "SDC-121", kind: "avis_commission", nom: "avis-commission-REV-2026-041.pdf", taille: "14 Ko", genereLe: "Aujourd'hui 05:40" },
    ],
    historique: [
      { id: "SVE-332", date: "Aujourd'hui 05:40", type: "calcul", detail: "Calcul consolidé : collecté brut 148 500 − remboursements 12 500 (dont l'anomalie « débité sans billet » RMB-030) − commission 10 % (13 600) = net à reverser 122 400 FCFA. En attente de validation.", par: "Système — plateforme TBM", role: "Automatisation" },
      { id: "SVE-331", date: "05/10 23:55", type: "creation", detail: "Période clôturée — reversement ouvert automatiquement après clôture des rapprochements quotidiens (A02).", par: "Système — plateforme TBM", role: "Automatisation" },
    ],
  },
  {
    id: "REV-2026-042",
    compagnie: "Djoliba Transport",
    periode: "Semaine 41 · 29/09 → 05/10",
    periodeDebut: "29/09",
    periodeFin: "05/10",
    statut: "a_calculer",
    brutCollecte: 0,
    remboursements: 0,
    commissionTaux: 8,
    commissionMontant: 0,
    netAReverser: 0,
    nbTransactions: 0,
    nbBillets: 0,
    nbRemboursements: 0,
    estimation: { brut: 305000, transactions: 41, billets: 63 },
    docs: [],
    historique: [
      { id: "SVE-334", date: "05/10 23:55", type: "creation", detail: "Période clôturée — rapprochement quotidien en cours de finalisation (A02). Le calcul consolidera les transactions confirmées et les remboursements exécutés.", par: "Système — plateforme TBM", role: "Automatisation" },
    ],
  },
  {
    id: "REV-2026-043",
    compagnie: "Sahel Bus",
    periode: "Semaine 41 · 29/09 → 05/10",
    periodeDebut: "29/09",
    periodeFin: "05/10",
    statut: "a_calculer",
    brutCollecte: 0,
    remboursements: 0,
    commissionTaux: 12,
    commissionMontant: 0,
    netAReverser: 0,
    nbTransactions: 0,
    nbBillets: 0,
    nbRemboursements: 0,
    estimation: { brut: 224500, transactions: 26, billets: 39 },
    docs: [],
    historique: [
      { id: "SVE-336", date: "05/10 23:55", type: "creation", detail: "Période clôturée — rapprochement quotidien en cours de finalisation (A02). Le calcul consolidera les transactions confirmées et les remboursements exécutés.", par: "Système — plateforme TBM", role: "Automatisation" },
    ],
  },
];

/* ----------------- Utilisateurs & accès (A05) --------------- */

export type UserRole =
  | "Voyageur"
  | "Agent de guichet"
  | "Gestionnaire de compagnie"
  | "Contrôleur"
  | "Support TBM"
  | "Administrateur TBM";

export type UserKind = "voyageur" | "professionnel";

export type UserStatus = "actif" | "attente" | "bloque";

/** Périmètre d'isolation des données : global (plateforme), compagnie (cloisonné), soi (données personnelles). */
export type AccessScope = "global" | "compagnie" | "soi";

export const USER_ROLE_META: Record<
  UserRole,
  {
    label: string;
    className: string;
    kind: UserKind;
    scope: AccessScope;
    scopeLabel: string;
  }
> = {
  Voyageur: {
    label: "Voyageur",
    className: "bg-neutral-100 text-neutral-600",
    kind: "voyageur",
    scope: "soi",
    scopeLabel: "Ses propres billets et réservations",
  },
  "Agent de guichet": {
    label: "Agent de guichet",
    className: "bg-amber-50 text-amber-600",
    kind: "professionnel",
    scope: "compagnie",
    scopeLabel: "Sa compagnie uniquement — vente et embarquement",
  },
  "Gestionnaire de compagnie": {
    label: "Gestionnaire",
    className: "bg-violet-100 text-violet-600",
    kind: "professionnel",
    scope: "compagnie",
    scopeLabel: "Sa compagnie uniquement — départs, tarifs, ventes",
  },
  Contrôleur: {
    label: "Contrôleur",
    className: "bg-emerald-50 text-emerald-600",
    kind: "professionnel",
    scope: "compagnie",
    scopeLabel: "Sa compagnie uniquement — contrôle à bord",
  },
  "Support TBM": {
    label: "Support TBM",
    className: "bg-sky-50 text-sky-600",
    kind: "professionnel",
    scope: "global",
    scopeLabel: "Plateforme entière — droits d'assistance limités",
  },
  "Administrateur TBM": {
    label: "Administrateur",
    className: "bg-coral-50 text-coral-600",
    kind: "professionnel",
    scope: "global",
    scopeLabel: "Plateforme entière — tous droits",
  },
};

export const USER_STATUS_META: Record<
  UserStatus,
  { label: string; className: string }
> = {
  actif: { label: "Actif", className: "bg-emerald-50 text-emerald-600" },
  attente: { label: "À activer", className: "bg-amber-50 text-amber-600" },
  bloque: { label: "Bloqué", className: "bg-rose-50 text-rose-600" },
};

/** Matrice des permissions affichée par rôle (A05 — gestion des rôles et permissions). */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Voyageur: [
    "Consulter les départs, tarifs et disponibilités",
    "Réserver et payer en ligne (Orange Money / Moov Money)",
    "Recevoir son billet électronique par SMS",
    "Demander une annulation ou un remboursement",
  ],
  "Agent de guichet": [
    "Vendre des billets au guichet de sa compagnie",
    "Consulter les réservations de sa compagnie",
    "Enregistrer les embarquements (scan des billets)",
    "Signaler les incidents de voyage",
  ],
  "Gestionnaire de compagnie": [
    "Gérer les départs, lignes et tarifs de sa compagnie",
    "Suivre les ventes, la commission et les rapprochements",
    "Consulter les réservations et billets de sa compagnie",
    "Créer les comptes agents de sa compagnie (activation TBM)",
  ],
  Contrôleur: [
    "Scanner et contrôler les billets à l'embarquement",
    "Suivre l'historique des scans de sa compagnie",
    "Signaler les fraudeurs et les incidents de voyage",
  ],
  "Support TBM": [
    "Assister les voyageurs (réservations, billets)",
    "Traiter les remboursements jusqu'à 15 000 FCFA",
    "Superviser les transactions et escalader en litige",
    "Aucun accès au paramétrage ni aux comptes",
  ],
  "Administrateur TBM": [
    "Gérer les compagnies, les utilisateurs et les rôles",
    "Valider tous les remboursements et lever les litiges",
    "Paramétrer la plateforme (frais, commissions, blocage)",
    "Accéder au journal d'audit complet",
  ],
};

export interface LoginEvent {
  id: string;
  date: string;
  resultat: "succes" | "echec";
  ip: string;
  lieu: string;
  appareil: string;
  detail?: string; // ex. « Mot de passe incorrect — 3ᵉ tentative »
}

export const LOGIN_RESULT_META: Record<
  LoginEvent["resultat"],
  { label: string; className: string }
> = {
  succes: { label: "Succès", className: "bg-emerald-50 text-emerald-600" },
  echec: { label: "Échec", className: "bg-rose-50 text-rose-600" },
};

/** Action sensible : toute opération à forte valeur effectuée par un compte. */
export interface UserSensitiveAction {
  id: string;
  date: string;
  action: string;
  detail: string;
}

export interface UserAccount {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  role: UserRole;
  compagnie?: string; // périmètre d'isolation (comptes de compagnie)
  statut: UserStatus;
  bloqueMotif?: string;
  bloquePar?: string;
  bloqueLe?: string;
  creeLe: string;
  creePar?: string;
  activeLe?: string;
  activePar?: string;
  derniereConnexion?: string;
  connexions: LoginEvent[];
  actionsSensibles: UserSensitiveAction[];
}

export const initialUserAccounts: UserAccount[] = [
  {
    id: "USR-01",
    nom: "Daouda FOMBA",
    email: "admin@tbm.ml",
    role: "Administrateur TBM",
    statut: "actif",
    creeLe: "12/01 09:00",
    activeLe: "12/01 09:00",
    derniereConnexion: "Aujourd'hui 08:15",
    connexions: [
      { id: "LC-901", date: "Aujourd'hui 08:15", resultat: "succes", ip: "41.79.14.22", lieu: "Bamako · ACI 2000", appareil: "Windows · Chrome" },
      { id: "LC-902", date: "Hier 18:40", resultat: "succes", ip: "41.79.14.22", lieu: "Bamako · ACI 2000", appareil: "Windows · Chrome" },
      { id: "LC-903", date: "04/10 09:02", resultat: "succes", ip: "41.79.14.31", lieu: "Bamako · Sogoniko", appareil: "iPhone · Safari" },
    ],
    actionsSensibles: [
      { id: "USA-701", date: "Hier 17:31", action: "Commission modifiée", detail: "Bamako Express : commission passée de 9 % à 10 %." },
      { id: "USA-702", date: "04/10 09:15", action: "Compte bloqué", detail: "Fatoumata Cissé — 5 échecs de connexion consécutifs." },
      { id: "USA-703", date: "04/10 11:20", action: "Compagnie suspendue", detail: "Kayes Lines — documents de reversal manquants." },
    ],
  },
  {
    id: "USR-02",
    nom: "Mody BARRY",
    email: "support@tbm.ml",
    role: "Support TBM",
    statut: "actif",
    creeLe: "12/01 09:00",
    activeLe: "12/01 09:00",
    derniereConnexion: "Hier 18:20",
    connexions: [
      { id: "LC-905", date: "Hier 18:20", resultat: "succes", ip: "41.79.20.8", lieu: "Bamako · Badalabougou", appareil: "Android · Chrome" },
      { id: "LC-906", date: "05/10 08:44", resultat: "succes", ip: "41.79.20.8", lieu: "Bamako · Badalabougou", appareil: "Android · Chrome" },
    ],
    actionsSensibles: [
      { id: "USA-704", date: "05/10 18:58", action: "Remboursement validé", detail: "RMB-029 · Fatoumata Diallo — 7 500 FCFA (délai > 24 h)." },
    ],
  },
  {
    id: "USR-03",
    nom: "Aminata Traoré",
    email: "a.traore@bamakoexpress.ml",
    telephone: "+223 76 22 41 09",
    role: "Gestionnaire de compagnie",
    compagnie: "Bamako Express",
    statut: "actif",
    creeLe: "20/02 10:30",
    activeLe: "20/02 11:05",
    derniereConnexion: "Aujourd'hui 07:30",
    connexions: [
      { id: "LC-910", date: "Aujourd'hui 07:30", resultat: "succes", ip: "41.79.33.17", lieu: "Bamako · Sogoniko", appareil: "iPhone · Safari" },
      { id: "LC-911", date: "Hier 19:05", resultat: "succes", ip: "41.79.33.17", lieu: "Bamako · Sogoniko", appareil: "iPhone · Safari" },
      { id: "LC-912", date: "05/10 10:04", resultat: "succes", ip: "41.79.33.20", lieu: "Bamako · Sogoniko", appareil: "Windows · Edge" },
    ],
    actionsSensibles: [
      { id: "USA-705", date: "05/10 10:12", action: "Tarif modifié", detail: "Bamako → Ségou : 5 500 → 6 000 FCFA." },
      { id: "USA-706", date: "Aujourd'hui 07:52", action: "Compte agent créé", detail: "Oumar DIARRA (agent de guichet) — en attente d'activation TBM." },
    ],
  },
  {
    id: "USR-04",
    nom: "Moussa Keïta",
    email: "m.keita@sahelbus.ml",
    telephone: "+223 66 71 55 38",
    role: "Agent de guichet",
    compagnie: "Sahel Bus",
    statut: "actif",
    creeLe: "02/03 08:10",
    activeLe: "02/03 09:00",
    derniereConnexion: "Hier 17:12",
    connexions: [
      { id: "LC-915", date: "Hier 17:12", resultat: "succes", ip: "41.79.41.9", lieu: "Bamako · gare de Sogoniko", appareil: "Android · Chrome" },
      { id: "LC-916", date: "05/10 06:50", resultat: "succes", ip: "41.79.41.9", lieu: "Bamako · gare de Sogoniko", appareil: "Android · Chrome" },
    ],
    actionsSensibles: [],
  },
  {
    id: "USR-05",
    nom: "Fatoumata Cissé",
    email: "f.cisse@djoliba.ml",
    telephone: "+223 70 18 63 24",
    role: "Gestionnaire de compagnie",
    compagnie: "Djoliba Transport",
    statut: "bloque",
    bloqueMotif: "5 échecs de connexion consécutifs — vérifier l'identité avant déblocage.",
    bloquePar: "Daouda FOMBA",
    bloqueLe: "04/10 09:15",
    creeLe: "15/02 14:20",
    activeLe: "15/02 15:00",
    derniereConnexion: "04/10 08:58",
    connexions: [
      { id: "LC-920", date: "04/10 08:47", resultat: "echec", ip: "197.155.22.10", lieu: "Ségou · centre-ville", appareil: "Android · Chrome", detail: "Mot de passe incorrect — 3ᵉ tentative." },
      { id: "LC-921", date: "04/10 08:52", resultat: "echec", ip: "197.155.22.10", lieu: "Ségou · centre-ville", appareil: "Android · Chrome", detail: "Mot de passe incorrect — 4ᵉ tentative." },
      { id: "LC-922", date: "04/10 08:58", resultat: "echec", ip: "197.155.22.10", lieu: "Ségou · centre-ville", appareil: "Android · Chrome", detail: "Mot de passe incorrect — compte verrouillé après 5 échecs." },
      { id: "LC-923", date: "03/10 09:15", resultat: "succes", ip: "197.155.22.10", lieu: "Ségou · centre-ville", appareil: "Android · Chrome" },
    ],
    actionsSensibles: [
      { id: "USA-707", date: "02/10 14:20", action: "Départ modifié", detail: "Départ DJL-MPT 07:00 avancé à 06:30." },
    ],
  },
  {
    id: "USR-06",
    nom: "Ibrahim Coulibaly",
    email: "i.coulibaly@sikassovoyage.ml",
    telephone: "+223 78 90 12 46",
    role: "Contrôleur",
    compagnie: "Sikasso Voyage",
    statut: "actif",
    creeLe: "10/03 11:40",
    activeLe: "10/03 12:20",
    derniereConnexion: "05/10 06:55",
    connexions: [
      { id: "LC-925", date: "05/10 06:55", resultat: "succes", ip: "41.79.50.3", lieu: "Sikasso · gare de Wayerma", appareil: "Android · App TBM" },
      { id: "LC-926", date: "04/10 06:48", resultat: "succes", ip: "41.79.50.3", lieu: "Sikasso · gare de Wayerma", appareil: "Android · App TBM" },
    ],
    actionsSensibles: [
      { id: "USA-708", date: "05/10 07:20", action: "Embarquement contrôlé", detail: "42 billets scannés — départ SKS-BKO 07:00, 1 billet refusé (déjà scanné)." },
    ],
  },
  {
    id: "USR-07",
    nom: "Oumar DIARRA",
    email: "o.diarra@bamakoexpress.ml",
    telephone: "+223 76 45 88 10",
    role: "Agent de guichet",
    compagnie: "Bamako Express",
    statut: "attente",
    creeLe: "Aujourd'hui 07:52",
    creePar: "Aminata Traoré",
    connexions: [],
    actionsSensibles: [],
  },
  {
    id: "USR-08",
    nom: "Kadiatou SANGARÉ",
    email: "k.sangare@kayeslines.ml",
    telephone: "+223 74 12 90 55",
    role: "Gestionnaire de compagnie",
    compagnie: "Kayes Lines",
    statut: "attente",
    creeLe: "05/10 16:20",
    creePar: "Daouda FOMBA",
    connexions: [],
    actionsSensibles: [],
  },
  {
    id: "USR-09",
    nom: "Salif TOURÉ",
    email: "salif.toure@gmail.com",
    telephone: "+223 76 55 41 23",
    role: "Voyageur",
    statut: "actif",
    creeLe: "18/04 12:00",
    derniereConnexion: "Aujourd'hui 07:10",
    connexions: [
      { id: "LC-930", date: "Aujourd'hui 07:10", resultat: "succes", ip: "41.79.61.44", lieu: "Bamako · Magnambougou", appareil: "Android · App TBM" },
      { id: "LC-931", date: "02/10 20:31", resultat: "echec", ip: "41.79.61.44", lieu: "Bamako · Magnambougou", appareil: "Android · App TBM", detail: "Mot de passe incorrect — 1ʳᵉ tentative." },
      { id: "LC-932", date: "02/10 20:32", resultat: "succes", ip: "41.79.61.44", lieu: "Bamako · Magnambougou", appareil: "Android · App TBM" },
    ],
    actionsSensibles: [],
  },
  {
    id: "USR-10",
    nom: "Aïcha DIALLO",
    email: "aicha.diallo@yahoo.fr",
    telephone: "+223 66 12 90 44",
    role: "Voyageur",
    statut: "actif",
    creeLe: "22/05 16:45",
    derniereConnexion: "Hier 21:02",
    connexions: [
      { id: "LC-935", date: "Hier 21:02", resultat: "succes", ip: "41.79.63.12", lieu: "Bamako · Djélibougou", appareil: "iPhone · App TBM" },
      { id: "LC-936", date: "30/09 08:15", resultat: "succes", ip: "41.79.63.12", lieu: "Bamako · Djélibougou", appareil: "iPhone · App TBM" },
    ],
    actionsSensibles: [],
  },
  {
    id: "USR-11",
    nom: "Jean KONÉ",
    email: "j.kone@outlook.com",
    telephone: "+223 70 33 18 67",
    role: "Voyageur",
    statut: "actif",
    creeLe: "09/06 10:20",
    derniereConnexion: "04/10 18:40",
    connexions: [
      { id: "LC-940", date: "04/10 18:39", resultat: "echec", ip: "41.79.70.5", lieu: "Koutiala · centre", appareil: "Android · App TBM", detail: "Mot de passe incorrect — réinitialisation demandée." },
      { id: "LC-941", date: "04/10 18:44", resultat: "succes", ip: "41.79.70.5", lieu: "Koutiala · centre", appareil: "Android · App TBM", detail: "Connexion après réinitialisation du mot de passe." },
    ],
    actionsSensibles: [],
  },
  {
    id: "USR-12",
    nom: "Bakary SISSOKO",
    email: "b.sissoko@gmail.com",
    telephone: "+223 78 44 52 90",
    role: "Voyageur",
    statut: "bloque",
    bloqueMotif: "Billets falsifiés détectés lors du contrôle — dossier transmis au support.",
    bloquePar: "Daouda FOMBA",
    bloqueLe: "05/10 12:05",
    creeLe: "03/07 09:30",
    derniereConnexion: "05/10 11:58",
    connexions: [
      { id: "LC-945", date: "05/10 11:58", resultat: "succes", ip: "41.79.72.19", lieu: "Bamako · Lafiabougou", appareil: "Android · App TBM" },
    ],
    actionsSensibles: [],
  },
];

/* ------------------------ Journal d'audit (A06) ------------- */

export type AuditAction =
  | "Connexion"
  | "Remboursement"
  | "Modification prix"
  | "Annulation"
  | "Compagnie"
  | "Paramétrage"
  | "Utilisateur"
  | "Transaction"
  | "Rapprochement"
  | "Litige"
  | "Reversement";

export interface AuditEntry {
  id: string;
  date: string;
  auteur: string;
  role: string;
  action: AuditAction;
  objet: string;
  detail: string;
}

export const AUDIT_ACTION_META: Record<AuditAction, { className: string }> = {
  Connexion: { className: "bg-neutral-100 text-neutral-500" },
  Remboursement: { className: "bg-violet-100 text-violet-600" },
  "Modification prix": { className: "bg-amber-50 text-amber-600" },
  Annulation: { className: "bg-rose-50 text-rose-600" },
  Compagnie: { className: "bg-coral-50 text-coral-600" },
  Paramétrage: { className: "bg-sky-50 text-sky-600" },
  Utilisateur: { className: "bg-emerald-50 text-emerald-600" },
  Transaction: { className: "bg-teal-50 text-teal-600" },
  Rapprochement: { className: "bg-lime-50 text-lime-700" },
  Litige: { className: "bg-rose-100 text-rose-700" },
  Reversement: { className: "bg-amber-100 text-amber-700" },
};

export const initialAudit: AuditEntry[] = [
  { id: "AUD-214", date: "06/10 08:02", auteur: "Mody BARRY", role: "Support TBM", action: "Connexion", objet: "Session back-office", detail: "Connexion depuis Bamako (IP 41.79.x.x)." },
  { id: "AUD-213", date: "05/10 18:58", auteur: "Mody BARRY", role: "Support TBM", action: "Remboursement", objet: "RMB-029 · Fatoumata Diallo", detail: "Remboursement de 7 500 FCFA validé — délai > 24 h." },
  { id: "AUD-212", date: "05/10 17:31", auteur: "Daouda FOMBA", role: "Administrateur TBM", action: "Modification prix", objet: "Bamako Express · commission", detail: "Commission passée de 9 % à 10 %." },
  { id: "AUD-211", date: "05/10 16:44", auteur: "Daouda FOMBA", role: "Administrateur TBM", action: "Annulation", objet: "Départ BAM-SKG 16:30", detail: "Départ annulé — 12 tickets remboursés automatiquement." },
  { id: "AUD-210", date: "04/10 11:20", auteur: "Daouda FOMBA", role: "Administrateur TBM", action: "Compagnie", objet: "Kayes Lines", detail: "Compagnie suspendue : documents de reversal manquants." },
  { id: "AUD-209", date: "04/10 09:15", auteur: "Daouda FOMBA", role: "Administrateur TBM", action: "Utilisateur", objet: "Fatoumata Cissé", detail: "Compte bloqué après 5 échecs de connexion." },
  { id: "AUD-208", date: "03/10 14:07", auteur: "Mody BARRY", role: "Support TBM", action: "Remboursement", objet: "RMB-028 · Ibrahim Keïta", detail: "Double débit confirmé — remboursement de 15 000 FCFA." },
];

/* -------------------- Villes, gares, notifications (A07) ---- */

export interface City {
  id: string;
  nom: string;
  region: string;
  gares: string[];
}

export const cities: City[] = [
  { id: "VIL-01", nom: "Bamako", region: "District de Bamako", gares: ["Gare de Sogoniko", "Gare de Badalabougou"] },
  { id: "VIL-02", nom: "Ségou", region: "Région de Ségou", gares: ["Gare de Sébougou"] },
  { id: "VIL-03", nom: "Sikasso", region: "Région de Sikasso", gares: ["Gare de Wayerma"] },
  { id: "VIL-04", nom: "Mopti", region: "Région de Mopti", gares: ["Gare de Sévaré"] },
  { id: "VIL-05", nom: "Kayes", region: "Région de Kayes", gares: ["Gare de Kayes N'Di"] },
  { id: "VIL-06", nom: "Koutiala", region: "Région de Sikasso", gares: ["Gare centrale"] },
];

/* ------------------------- Statistiques (A08) --------------- */

export interface SalesPoint {
  day: string;
  ventes: number;
}

export const salesSeries: SalesPoint[] = [
  { day: "23/09", ventes: 845000 },
  { day: "24/09", ventes: 912000 },
  { day: "25/09", ventes: 780000 },
  { day: "26/09", ventes: 1024000 },
  { day: "27/09", ventes: 1189000 },
  { day: "28/09", ventes: 967000 },
  { day: "29/09", ventes: 745000 },
  { day: "30/09", ventes: 892000 },
  { day: "01/10", ventes: 1053000 },
  { day: "02/10", ventes: 1231000 },
  { day: "03/10", ventes: 1104000 },
  { day: "04/10", ventes: 1348000 },
  { day: "05/10", ventes: 1289000 },
  { day: "06/10", ventes: 1245000 },
];

export const topCompanies = [
  { nom: "Bamako Express", ventes: 486200, part: 39 },
  { nom: "Djoliba Transport", ventes: 341800, part: 27 },
  { nom: "Sahel Bus", ventes: 228500, part: 18 },
  { nom: "Sikasso Voyage", ventes: 188500, part: 16 },
];

export const globalStats = {
  ventesAujourdhui: 1245000,
  deltaVentes: "+12 %",
  ticketsMois: 3412,
  deltaTickets: "+8,4 %",
  compagniesActives: 4,
  compagniesTotal: 6,
  conversion: 62,
  deltaConversion: "+3 pts",
};

/* ------------------------- Paramétrage (A04) ---------------- */

export interface Settings {
  fraisMode: "fixe" | "pourcentage";
  fraisValeur: number;
  commissionDefaut: number;
  blocageMinutes: number; // RG1
  annulationPlus24h: number; // % remboursé
  annulation24a6h: number;
  annulationMoins6h: number;
}

export const defaultSettings: Settings = {
  fraisMode: "fixe",
  fraisValeur: 250,
  commissionDefaut: 10,
  blocageMinutes: 10,
  annulationPlus24h: 100,
  annulation24a6h: 50,
  annulationMoins6h: 0,
};

/* --------------- Réservations & billets (A10) --------------- */

export type ReservationStatus = "en_attente" | "confirmee" | "expiree" | "annulee";

export const RESERVATION_STATUS_META: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  en_attente: { label: "En attente", className: "bg-amber-50 text-amber-600" },
  confirmee: { label: "Confirmée", className: "bg-emerald-50 text-emerald-600" },
  expiree: { label: "Expirée", className: "bg-neutral-100 text-neutral-500" },
  annulee: { label: "Annulée", className: "bg-rose-50 text-rose-600" },
};

export type TicketStatus = "emis" | "utilise" | "annule";

export const TICKET_STATUS_META: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  emis: { label: "Émis", className: "bg-coral-50 text-coral-600" },
  utilise: { label: "Utilisé", className: "bg-emerald-50 text-emerald-600" },
  annule: { label: "Annulé", className: "bg-rose-50 text-rose-600" },
};

export interface Passenger {
  nom: string;
  type: "adulte" | "enfant";
  siege: string; // ex. « 12A »
}

export interface Ticket {
  id: string; // numéro de billet imprimé / QR
  passager: Passenger;
  tarif: number; // FCFA (RG11)
  statut: TicketStatus;
}

export type ScanKind =
  | "paiement"
  | "emission"
  | "scan_embarquement"
  | "controle"
  | "annulation"
  | "expiration";

export interface ScanEvent {
  id: string;
  date: string; // ex. « Aujourd'hui 07:12 »
  type: ScanKind;
  detail: string;
  agent: string;
}

export const SCAN_KIND_META: Record<
  ScanKind,
  { label: string; className: string }
> = {
  paiement: { label: "Paiement", className: "bg-emerald-50 text-emerald-600" },
  emission: { label: "Émission", className: "bg-coral-50 text-coral-600" },
  scan_embarquement: { label: "Scan embarquement", className: "bg-sky-50 text-sky-600" },
  controle: { label: "Contrôle à bord", className: "bg-violet-100 text-violet-600" },
  annulation: { label: "Annulation", className: "bg-rose-50 text-rose-600" },
  expiration: { label: "Expiration", className: "bg-neutral-100 text-neutral-500" },
};

export interface Reservation {
  id: string; // référence RES-xxxx
  telephone: string; // n° du voyageur principal
  canal: "en_ligne" | "guichet";
  operateur?: "Orange Money" | "Moov Money" | null; // null pour le guichet
  departId: string; // → companyDepartures
  statut: ReservationStatus;
  creee: string; // ex. « Aujourd'hui 06:42 »
  tickets: Ticket[];
  historique: ScanEvent[];
  motif?: string; // motif d'annulation / d'expiration
}

export const reservations: Reservation[] = [
  {
    id: "RES-2041",
    telephone: "+223 76 42 18 05",
    canal: "en_ligne",
    operateur: "Orange Money",
    departId: "DEP-01",
    statut: "confirmee",
    creee: "Aujourd'hui 06:15",
    tickets: [
      { id: "TKT-2605-40812", passager: { nom: "Aïssata Coulibaly", type: "adulte", siege: "12A" }, tarif: 5000, statut: "utilise" },
      { id: "TKT-2605-40813", passager: { nom: "Moussa Keïta", type: "adulte", siege: "12B" }, tarif: 5000, statut: "emis" },
    ],
    historique: [
      { id: "SCN-301", date: "Aujourd'hui 07:12", type: "scan_embarquement", detail: "Siège 12A — portique d'embarquement, gare de Sogoniko.", agent: "Contrôle TBM — F. Sissoko" },
      { id: "SCN-300", date: "Aujourd'hui 06:15", type: "emission", detail: "2 billets émis et envoyés par SMS au +223 76 42 18 05.", agent: "Système — plateforme TBM" },
      { id: "SCN-299", date: "Aujourd'hui 06:15", type: "paiement", detail: "Paiement Orange Money confirmé — 10 000 FCFA.", agent: "Système — plateforme TBM" },
    ],
  },
  {
    id: "RES-2042",
    telephone: "+223 66 05 77 21",
    canal: "en_ligne",
    operateur: "Orange Money",
    departId: "DEP-04",
    statut: "confirmee",
    creee: "Hier 18:02",
    tickets: [
      { id: "TKT-2605-40901", passager: { nom: "Fatoumata Diallo", type: "adulte", siege: "05C" }, tarif: 5000, statut: "emis" },
      { id: "TKT-2605-40902", passager: { nom: "Ibrahim Maïga", type: "adulte", siege: "05D" }, tarif: 5000, statut: "emis" },
      { id: "TKT-2605-40903", passager: { nom: "Kadiatou Sangaré", type: "enfant", siege: "05E" }, tarif: 2500, statut: "emis" },
    ],
    historique: [
      { id: "SCN-310", date: "Aujourd'hui 14:40", type: "emission", detail: "Billets revalidés après report — nouvelle heure estimée 16:45 transmise par SMS.", agent: "Système — plateforme TBM" },
      { id: "SCN-305", date: "Hier 18:02", type: "emission", detail: "3 billets émis et envoyés par SMS au +223 66 05 77 21.", agent: "Système — plateforme TBM" },
      { id: "SCN-304", date: "Hier 18:02", type: "paiement", detail: "Paiement Orange Money confirmé — 12 500 FCFA.", agent: "Système — plateforme TBM" },
    ],
  },
  {
    id: "RES-2043",
    telephone: "+223 91 26 03 47",
    canal: "en_ligne",
    operateur: "Moov Money",
    departId: "DEP-02",
    statut: "en_attente",
    creee: "Aujourd'hui 09:58",
    tickets: [],
    historique: [
      { id: "SCN-312", date: "Aujourd'hui 09:59", type: "paiement", detail: "Paiement Moov Money initié — en attente de confirmation USSD.", agent: "Système — plateforme TBM" },
      { id: "SCN-311", date: "Aujourd'hui 09:58", type: "emission", detail: "Réservation créée — 1 place bloquée pendant 10 min (RG1).", agent: "Système — plateforme TBM" },
    ],
  },
  {
    id: "RES-2044",
    telephone: "+223 78 30 44 92",
    canal: "en_ligne",
    operateur: "Orange Money",
    departId: "DEP-09",
    statut: "annulee",
    creee: "04/10 19:22",
    motif: "Départ annulé par la compagnie — pluies torrentielles sur la RN6.",
    tickets: [
      { id: "TKT-2605-40920", passager: { nom: "Sékou Konaté", type: "adulte", siege: "03A" }, tarif: 8500, statut: "annule" },
      { id: "TKT-2605-40921", passager: { nom: "Rokia Fofana", type: "adulte", siege: "03B" }, tarif: 8500, statut: "annule" },
    ],
    historique: [
      { id: "SCN-320", date: "Aujourd'hui 11:20", type: "annulation", detail: "Billets annulés après annulation du départ — remboursement automatique engagé (17 000 FCFA).", agent: "Sahel Bus — dispatch" },
      { id: "SCN-318", date: "04/10 19:22", type: "emission", detail: "2 billets émis et envoyés par SMS au +223 78 30 44 92.", agent: "Système — plateforme TBM" },
      { id: "SCN-317", date: "04/10 19:22", type: "paiement", detail: "Paiement Orange Money confirmé — 17 000 FCFA.", agent: "Système — plateforme TBM" },
    ],
  },
  {
    id: "RES-2045",
    telephone: "+223 76 88 51 14",
    canal: "en_ligne",
    operateur: "Orange Money",
    departId: "DEP-05",
    statut: "confirmee",
    creee: "Hier 15:41",
    tickets: [
      { id: "TKT-2605-40933", passager: { nom: "Oumar Cissé", type: "adulte", siege: "08A" }, tarif: 11000, statut: "utilise" },
      { id: "TKT-2605-40934", passager: { nom: "Mariam Traoré", type: "adulte", siege: "08B" }, tarif: 11000, statut: "utilise" },
    ],
    historique: [
      { id: "SCN-316", date: "Aujourd'hui 05:49", type: "scan_embarquement", detail: "Siège 08B — portique d'embarquement, gare de Sogoniko.", agent: "Contrôle TBM — A. Dembélé" },
      { id: "SCN-315", date: "Aujourd'hui 05:48", type: "scan_embarquement", detail: "Siège 08A — portique d'embarquement, gare de Sogoniko.", agent: "Contrôle TBM — A. Dembélé" },
      { id: "SCN-314", date: "Hier 15:41", type: "emission", detail: "2 billets émis et envoyés par SMS au +223 76 88 51 14.", agent: "Système — plateforme TBM" },
      { id: "SCN-313", date: "Hier 15:41", type: "paiement", detail: "Paiement Orange Money confirmé — 22 000 FCFA.", agent: "Système — plateforme TBM" },
    ],
  },
  {
    id: "RES-2046",
    telephone: "+223 65 19 77 60",
    canal: "en_ligne",
    operateur: "Moov Money",
    departId: "DEP-07",
    statut: "expiree",
    creee: "Hier 21:14",
    motif: "Paiement Moov Money non finalisé — places libérées après 10 min (RG1).",
    tickets: [],
    historique: [
      { id: "SCN-321", date: "Hier 21:24", type: "expiration", detail: "Délai de paiement dépassé — la place est remise en vente.", agent: "Système — plateforme TBM" },
      { id: "SCN-319", date: "Hier 21:14", type: "emission", detail: "Réservation créée — 2 places bloquées pendant 10 min (RG1).", agent: "Système — plateforme TBM" },
    ],
  },
  {
    id: "RES-2047",
    telephone: "+223 79 12 65 38",
    canal: "guichet",
    operateur: null,
    departId: "DEP-08",
    statut: "confirmee",
    creee: "Aujourd'hui 06:40",
    tickets: [
      { id: "TKT-2605-40941", passager: { nom: "Boubacar Touré", type: "adulte", siege: "14A" }, tarif: 5000, statut: "utilise" },
      { id: "TKT-2605-40942", passager: { nom: "Hawa Kanté", type: "adulte", siege: "14B" }, tarif: 5000, statut: "utilise" },
      { id: "TKT-2605-40943", passager: { nom: "Youssouf Doumbia", type: "enfant", siege: "14C" }, tarif: 2500, statut: "utilise" },
      { id: "TKT-2605-40944", passager: { nom: "Djénéba Doumbia", type: "enfant", siege: "14D" }, tarif: 2500, statut: "emis" },
    ],
    historique: [
      { id: "SCN-330", date: "Aujourd'hui 06:58", type: "scan_embarquement", detail: "Sièges 14A, 14B et 14C — contrôle manuel au quai de Sébougou.", agent: "Contrôle TBM — M. Sylla" },
      { id: "SCN-329", date: "Aujourd'hui 06:40", type: "emission", detail: "4 billets imprimés au guichet de Sébougou (espèces).", agent: "Guichet Sébougou — A. Bagayoko" },
    ],
  },
  {
    id: "RES-2048",
    telephone: "+223 70 41 98 23",
    canal: "guichet",
    operateur: null,
    departId: "DEP-10",
    statut: "annulee",
    creee: "Hier 12:30",
    motif: "Annulation par le voyageur plus de 24 h avant le départ — remboursé à 100 % (RG5).",
    tickets: [
      { id: "TKT-2605-40951", passager: { nom: "Amadou Sissoko", type: "adulte", siege: "02C" }, tarif: 5000, statut: "annule" },
      { id: "TKT-2605-40952", passager: { nom: "Assétou Bagayoko", type: "adulte", siege: "02D" }, tarif: 5000, statut: "annule" },
    ],
    historique: [
      { id: "SCN-335", date: "Hier 14:05", type: "annulation", detail: "Annulation demandée au guichet — 10 000 FCFA remboursés (palier 100 %).", agent: "Guichet Sogoniko — A. Bagayoko" },
      { id: "SCN-334", date: "Hier 12:30", type: "emission", detail: "2 billets imprimés au guichet de Sogoniko (espèces).", agent: "Guichet Sogoniko — A. Bagayoko" },
    ],
  },
  {
    id: "RES-2049",
    telephone: "+223 92 55 10 76",
    canal: "en_ligne",
    operateur: "Moov Money",
    departId: "DEP-11",
    statut: "confirmee",
    creee: "Hier 08:12",
    tickets: [
      { id: "TKT-2605-40960", passager: { nom: "Yacouba Ouattara", type: "adulte", siege: "07A" }, tarif: 9000, statut: "emis" },
    ],
    historique: [
      { id: "SCN-338", date: "Hier 08:12", type: "emission", detail: "1 billet émis et envoyé par SMS au +223 92 55 10 76.", agent: "Système — plateforme TBM" },
      { id: "SCN-337", date: "Hier 08:12", type: "paiement", detail: "Paiement Moov Money confirmé — 9 000 FCFA.", agent: "Système — plateforme TBM" },
    ],
  },
  {
    id: "RES-2050",
    telephone: "+223 74 63 22 09",
    canal: "guichet",
    operateur: null,
    departId: "DEP-03",
    statut: "confirmee",
    creee: "Aujourd'hui 08:05",
    tickets: [
      { id: "TKT-2605-40971", passager: { nom: "Salif Diarra", type: "adulte", siege: "21B" }, tarif: 15000, statut: "emis" },
    ],
    historique: [
      { id: "SCN-342", date: "Aujourd'hui 08:05", type: "emission", detail: "1 billet imprimé au guichet de Sogoniko (espèces).", agent: "Guichet Sogoniko — A. Bagayoko" },
    ],
  },
  {
    id: "RES-2051",
    telephone: "+223 89 04 47 31",
    canal: "en_ligne",
    operateur: "Moov Money",
    departId: "DEP-12",
    statut: "en_attente",
    creee: "Aujourd'hui 10:22",
    tickets: [],
    historique: [
      { id: "SCN-344", date: "Aujourd'hui 10:23", type: "paiement", detail: "Paiement Moov Money initié — en attente de confirmation USSD.", agent: "Système — plateforme TBM" },
      { id: "SCN-343", date: "Aujourd'hui 10:22", type: "emission", detail: "Réservation créée — 2 places bloquées pendant 10 min (RG1).", agent: "Système — plateforme TBM" },
    ],
  },
  {
    id: "RES-2052",
    telephone: "+223 77 23 84 66",
    canal: "en_ligne",
    operateur: "Orange Money",
    departId: "DEP-06",
    statut: "confirmee",
    creee: "Hier 20:15",
    tickets: [
      { id: "TKT-2605-40980", passager: { nom: "Bintou Sanogo", type: "adulte", siege: "03A" }, tarif: 5000, statut: "utilise" },
    ],
    historique: [
      { id: "SCN-346", date: "Aujourd'hui 08:40", type: "controle", detail: "Contrôle à bord entre Kati et Ouélessébougou — billet validé.", agent: "Contrôleur — B. Coulibaly" },
      { id: "SCN-345", date: "Aujourd'hui 07:58", type: "scan_embarquement", detail: "Siège 03A — portique d'embarquement, gare de Sogoniko.", agent: "Contrôle TBM — F. Sissoko" },
      { id: "SCN-333", date: "Hier 20:15", type: "emission", detail: "1 billet émis et envoyé par SMS au +223 77 23 84 66.", agent: "Système — plateforme TBM" },
      { id: "SCN-332", date: "Hier 20:15", type: "paiement", detail: "Paiement Orange Money confirmé — 5 000 FCFA.", agent: "Système — plateforme TBM" },
    ],
  },
  {
    id: "RES-2053",
    telephone: "+223 66 71 90 48",
    canal: "guichet",
    operateur: null,
    departId: "DEP-13",
    statut: "annulee",
    creee: "03/10 11:47",
    motif: "Compagnie suspendue par TBM — remboursement automatique des billets.",
    tickets: [
      { id: "TKT-2605-40990", passager: { nom: "Mahamadou Haïdara", type: "adulte", siege: "01A" }, tarif: 16000, statut: "annule" },
      { id: "TKT-2605-40991", passager: { nom: "Kani Touré", type: "adulte", siege: "01B" }, tarif: 16000, statut: "annule" },
      { id: "TKT-2605-40992", passager: { nom: "Ibrahim Haïdara", type: "enfant", siege: "01C" }, tarif: 8000, statut: "annule" },
    ],
    historique: [
      { id: "SCN-352", date: "Aujourd'hui 09:30", type: "annulation", detail: "Billets annulés — suspension de la compagnie, remboursements automatiques (40 000 FCFA).", agent: "TBM — administration" },
      { id: "SCN-350", date: "03/10 11:47", type: "emission", detail: "3 billets imprimés au guichet de Kayes centre (espèces).", agent: "Guichet Kayes — M. Cissoko" },
    ],
  },
  {
    id: "RES-2054",
    telephone: "+223 76 55 31 90",
    canal: "guichet",
    operateur: null,
    departId: "DEP-02",
    statut: "confirmee",
    creee: "Aujourd'hui 10:12",
    tickets: [
      { id: "TKT-2605-41001", passager: { nom: "Drissa Koné", type: "adulte", siege: "09C" }, tarif: 9000, statut: "emis" },
    ],
    historique: [
      { id: "SCN-355", date: "Aujourd'hui 10:12", type: "emission", detail: "1 billet imprimé au guichet de Sogoniko (espèces).", agent: "Guichet Sogoniko — A. Bagayoko" },
    ],
  },
  {
    id: "RES-2055",
    telephone: "+223 95 40 28 17",
    canal: "en_ligne",
    operateur: "Orange Money",
    departId: "DEP-04",
    statut: "expiree",
    creee: "Aujourd'hui 10:31",
    motif: "Paiement Orange Money non finalisé — places libérées après 10 min (RG1).",
    tickets: [],
    historique: [
      { id: "SCN-357", date: "Aujourd'hui 10:41", type: "expiration", detail: "Délai de paiement dépassé — les 3 places sont remises en vente.", agent: "Système — plateforme TBM" },
      { id: "SCN-356", date: "Aujourd'hui 10:31", type: "emission", detail: "Réservation créée — 3 places bloquées pendant 10 min (RG1).", agent: "Système — plateforme TBM" },
    ],
  },
];
