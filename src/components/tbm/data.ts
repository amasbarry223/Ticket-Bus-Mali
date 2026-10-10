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
  prix: number; // FCFA
  frequence: string;
}

export type DepartureStatus = "programme" | "embarquement" | "annule";

export interface Departure {
  id: string;
  compagnie: string;
  jour: string; // "Aujourd'hui", "Demain"…
  heure: string;
  trajet: string; // "Bamako → Ségou"
  bus: string; // immatriculation
  placesTotal: number;
  placesDispo: number;
  statut: DepartureStatus;
}

export const DEPARTURE_STATUS_META: Record<
  DepartureStatus,
  { label: string; className: string }
> = {
  programme: { label: "Programmé", className: "bg-neutral-100 text-neutral-500" },
  embarquement: { label: "Embarquement", className: "bg-coral-50 text-coral-600" },
  annule: { label: "Annulé", className: "bg-rose-50 text-rose-600" },
};

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
  { id: "LIG-01", compagnie: "CPG-001", depart: "Bamako", arrivee: "Ségou", duree: "3 h", prix: 5000, frequence: "Quotidien" },
  { id: "LIG-02", compagnie: "CPG-001", depart: "Bamako", arrivee: "Sikasso", duree: "5 h 30", prix: 9000, frequence: "Quotidien" },
  { id: "LIG-03", compagnie: "CPG-001", depart: "Bamako", arrivee: "Kayes", duree: "9 h", prix: 15000, frequence: "Quotidien" },
  { id: "LIG-04", compagnie: "CPG-002", depart: "Bamako", arrivee: "Mopti", duree: "7 h", prix: 11000, frequence: "Lun · Mer · Ven" },
  { id: "LIG-05", compagnie: "CPG-002", depart: "Bamako", arrivee: "Ségou", duree: "3 h", prix: 5000, frequence: "Quotidien" },
  { id: "LIG-06", compagnie: "CPG-003", depart: "Ségou", arrivee: "Bamako", duree: "3 h", prix: 5000, frequence: "Quotidien" },
  { id: "LIG-07", compagnie: "CPG-003", depart: "Ségou", arrivee: "Mopti", duree: "4 h 30", prix: 8500, frequence: "Mar · Jeu · Sam" },
  { id: "LIG-08", compagnie: "CPG-004", depart: "Sikasso", arrivee: "Bamako", duree: "5 h 30", prix: 9000, frequence: "Quotidien" },
  { id: "LIG-09", compagnie: "CPG-004", depart: "Sikasso", arrivee: "Koutiala", duree: "2 h 30", prix: 4500, frequence: "Quotidien" },
  { id: "LIG-10", compagnie: "CPG-005", depart: "Kayes", arrivee: "Bamako", duree: "10 h", prix: 16000, frequence: "Quotidien" },
];

export const companyDepartures: Departure[] = [
  { id: "DEP-01", compagnie: "CPG-001", jour: "Aujourd'hui", heure: "07:30", trajet: "Bamako → Ségou", bus: "BKO 1204 A", placesTotal: 20, placesDispo: 5, statut: "embarquement" },
  { id: "DEP-02", compagnie: "CPG-001", jour: "Aujourd'hui", heure: "13:00", trajet: "Bamako → Sikasso", bus: "BKO 2210 B", placesTotal: 26, placesDispo: 12, statut: "programme" },
  { id: "DEP-03", compagnie: "CPG-001", jour: "Demain", heure: "06:30", trajet: "Bamako → Kayes", bus: "BKO 3317 C", placesTotal: 41, placesDispo: 41, statut: "programme" },
  { id: "DEP-04", compagnie: "CPG-002", jour: "Aujourd'hui", heure: "06:00", trajet: "Bamako → Mopti", bus: "BKO 4421 D", placesTotal: 18, placesDispo: 3, statut: "programme" },
  { id: "DEP-05", compagnie: "CPG-002", jour: "Demain", heure: "07:00", trajet: "Bamako → Ségou", bus: "BKO 5512 E", placesTotal: 20, placesDispo: 20, statut: "programme" },
  { id: "DEP-06", compagnie: "CPG-003", jour: "Aujourd'hui", heure: "07:00", trajet: "Ségou → Bamako", bus: "SGO 1102 F", placesTotal: 26, placesDispo: 8, statut: "embarquement" },
  { id: "DEP-07", compagnie: "CPG-004", jour: "Demain", heure: "05:30", trajet: "Sikasso → Bamako", bus: "SKO 1010 H", placesTotal: 18, placesDispo: 11, statut: "programme" },
  { id: "DEP-08", compagnie: "CPG-005", jour: "Aujourd'hui", heure: "06:00", trajet: "Kayes → Bamako", bus: "KYS 2040 J", placesTotal: 20, placesDispo: 20, statut: "annule" },
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

export interface Transaction {
  id: string;
  date: string;
  compagnie: string;
  operateur: Operator;
  montant: number; // FCFA
  statut: PaymentStatus;
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

export const OPERATORS: Operator[] = ["Orange Money", "Moov Money"];

export const transactions: Transaction[] = [
  { id: "TXN-10248", date: "06/10 08:12", compagnie: "Bamako Express", operateur: "Orange Money", montant: 12500, statut: "reussi" },
  { id: "TXN-10247", date: "06/10 07:54", compagnie: "Djoliba Transport", operateur: "Moov Money", montant: 10000, statut: "reussi" },
  { id: "TXN-10246", date: "06/10 07:31", compagnie: "Sahel Bus", operateur: "Orange Money", montant: 7500, statut: "en_attente" },
  { id: "TXN-10245", date: "05/10 19:46", compagnie: "Bamako Express", operateur: "Orange Money", montant: 15000, statut: "reussi" },
  { id: "TXN-10244", date: "05/10 18:22", compagnie: "Sikasso Voyage", operateur: "Moov Money", montant: 12500, statut: "echoue" },
  { id: "TXN-10243", date: "05/10 17:05", compagnie: "Djoliba Transport", operateur: "Orange Money", montant: 10000, statut: "rembourse" },
  { id: "TXN-10242", date: "05/10 15:48", compagnie: "Sahel Bus", operateur: "Moov Money", montant: 7500, statut: "reussi" },
  { id: "TXN-10241", date: "05/10 14:19", compagnie: "Bamako Express", operateur: "Orange Money", montant: 22500, statut: "expire" },
  { id: "TXN-10240", date: "05/10 11:37", compagnie: "Sikasso Voyage", operateur: "Orange Money", montant: 12500, statut: "reussi" },
  { id: "TXN-10239", date: "04/10 20:03", compagnie: "Djoliba Transport", operateur: "Moov Money", montant: 10000, statut: "reussi" },
];

/* ----------------------- Remboursements (A03) --------------- */

export type RefundStatus = "en_attente" | "traite" | "refuse";

export interface Refund {
  id: string;
  transaction: string;
  passager: string;
  montant: number;
  motif: string;
  demande: string;
  statut: RefundStatus;
  justification?: string;
  traitePar?: string;
}

export const REFUND_STATUS_META: Record<
  RefundStatus,
  { label: string; className: string }
> = {
  en_attente: { label: "En attente", className: "bg-amber-50 text-amber-600" },
  traite: { label: "Traité", className: "bg-emerald-50 text-emerald-600" },
  refuse: { label: "Refusé", className: "bg-rose-50 text-rose-600" },
};

export const initialRefunds: Refund[] = [
  { id: "RMB-031", transaction: "TXN-10243", passager: "Aïcha Sissoko", montant: 10000, motif: "Départ annulé par la compagnie", demande: "05/10 18:40", statut: "en_attente" },
  { id: "RMB-030", transaction: "TXN-10244", passager: "Moussa Traoré", montant: 12500, motif: "Argent débité, ticket non reçu", demande: "05/10 18:55", statut: "en_attente" },
  { id: "RMB-029", transaction: "TXN-10238", passager: "Fatoumata Diallo", montant: 7500, motif: "Annulation voyageur (plus de 24 h)", demande: "04/10 10:12", statut: "traite", justification: "Délai > 24 h — remboursement intégral conforme à la politique.", traitePar: "Mody BARRY" },
  { id: "RMB-028", transaction: "TXN-10235", passager: "Ibrahim Keïta", montant: 15000, motif: "Paiement en double", demande: "03/10 16:27", statut: "traite", justification: "Double débit confirmé par le relevé Orange Money.", traitePar: "Mody BARRY" },
  { id: "RMB-027", transaction: "TXN-10233", passager: "Salif Diarra", montant: 5000, motif: "Annulation voyageur (moins de 6 h)", demande: "02/10 09:44", statut: "refuse", justification: "Moins de 6 h avant le départ : aucun remboursement (RG5).", traitePar: "Mody BARRY" },
];

/* ------------------------- Utilisateurs (A05) --------------- */

export type BackofficeRole =
  | "Administrateur TBM"
  | "Support TBM"
  | "Gestionnaire de compagnie"
  | "Agent de guichet"
  | "Contrôleur";

export interface BackofficeUser {
  id: string;
  nom: string;
  email: string;
  role: BackofficeRole;
  compagnie?: string;
  bloque: boolean;
}

export const initialUsers: BackofficeUser[] = [
  { id: "USR-01", nom: "Daouda FOMBA", email: "admin@tbm.ml", role: "Administrateur TBM", bloque: false },
  { id: "USR-02", nom: "Mody BARRY", email: "support@tbm.ml", role: "Support TBM", bloque: false },
  { id: "USR-03", nom: "Aminata Traoré", email: "a.traore@bamakoexpress.ml", role: "Gestionnaire de compagnie", compagnie: "Bamako Express", bloque: false },
  { id: "USR-04", nom: "Moussa Keïta", email: "m.keita@sahelbus.ml", role: "Agent de guichet", compagnie: "Sahel Bus", bloque: false },
  { id: "USR-05", nom: "Fatoumata Cissé", email: "f.cisse@djoliba.ml", role: "Gestionnaire de compagnie", compagnie: "Djoliba Transport", bloque: true },
  { id: "USR-06", nom: "Ibrahim Coulibaly", email: "i.coulibaly@gmail.com", role: "Contrôleur", compagnie: "Sikasso Voyage", bloque: false },
];

/* ------------------------ Journal d'audit (A06) ------------- */

export type AuditAction =
  | "Connexion"
  | "Remboursement"
  | "Modification prix"
  | "Annulation"
  | "Compagnie"
  | "Paramétrage"
  | "Utilisateur";

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
