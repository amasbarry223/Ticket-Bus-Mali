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

export interface Company {
  id: string;
  nom: string;
  contact: string;
  ville: string;
  commission: number; // %
  ticketsMois: number;
  statut: CompanyStatus;
}

export const COMPANY_STATUS_META: Record<
  CompanyStatus,
  { label: string; className: string }
> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-600" },
  suspendue: { label: "Suspendue", className: "bg-rose-50 text-rose-600" },
  attente: { label: "En attente", className: "bg-amber-50 text-amber-600" },
};

export const initialCompanies: Company[] = [
  { id: "CPG-001", nom: "Bamako Express", contact: "contact@bamakoexpress.ml", ville: "Bamako", commission: 10, ticketsMois: 1284, statut: "active" },
  { id: "CPG-002", nom: "Djoliba Transport", contact: "ventes@djoliba.ml", ville: "Bamako", commission: 8, ticketsMois: 967, statut: "active" },
  { id: "CPG-003", nom: "Sahel Bus", contact: "sahelbus@gmail.com", ville: "Ségou", commission: 12, ticketsMois: 645, statut: "active" },
  { id: "CPG-004", nom: "Sikasso Voyage", contact: "info@sikassovoyage.ml", ville: "Sikasso", commission: 10, ticketsMois: 516, statut: "attente" },
  { id: "CPG-005", nom: "Kayes Lines", contact: "klines@gmail.com", ville: "Kayes", commission: 11, ticketsMois: 0, statut: "suspendue" },
];

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
