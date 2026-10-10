"use client";

import { create } from "zustand";
import {
  defaultSettings,
  initialAudit,
  initialCompanies,
  initialRefunds,
  initialUserAccounts,
  refundMontantRembourse,
  transactions as initialTransactions,
  type AuditAction,
  type AuditEntry,
  type Company,
  type CompanyStatus,
  type Operator,
  type Refund,
  type RefundEvent,
  type RefundVersement,
  type Settings,
  type UserAccount,
  type UserRole,
  type Transaction,
} from "@/components/tbm/data";

let auditSeq = 215;
let refundEventSeq = 430;
let refundVersementSeq = 131;
let userSeq = 13;

function makeAudit(
  entry: Omit<AuditEntry, "id"> & { id?: string }
): AuditEntry {
  return { id: entry.id ?? `AUD-${auditSeq++}`, ...entry };
}

interface TbmState {
  companies: Company[];
  users: UserAccount[];
  refunds: Refund[];
  audit: AuditEntry[];
  settings: Settings;
  transactions: Transaction[];
  closedReconciliations: string[]; // clés « jour|opérateur » clôturées

  setCompanyStatus: (id: string, statut: CompanyStatus, auteur: string) => void;
  addCompany: (company: Company, auteur: string) => void;
  updateCompany: (
    id: string,
    patch: Partial<Omit<Company, "id" | "statut" | "ticketsMois">>,
    auteur: string
  ) => void;
  createProAccount: (
    input: {
      nom: string;
      email: string;
      telephone: string;
      role: UserRole;
      compagnie: string;
    },
    auteur: string,
    role: string
  ) => void;
  activateUser: (id: string, auteur: string, role: string) => void;
  blockUser: (id: string, motif: string, auteur: string, role: string) => void;
  unblockUser: (id: string, auteur: string, role: string) => void;
  changeUserRole: (
    id: string,
    nouveauRole: UserRole,
    justification: string,
    auteur: string,
    role: string
  ) => void;
  claimRefund: (id: string, auteur: string, role: string) => void;
  decideRefund: (
    id: string,
    approuve: boolean,
    justification: string,
    auteur: string,
    role: string
  ) => void;
  addRefundVersement: (
    id: string,
    montant: number,
    refOperateur: string,
    auteur: string,
    role: string
  ) => void;
  openRefundDispute: (
    id: string,
    detail: string,
    auteur: string,
    role: string
  ) => void;
  resolveRefundDispute: (
    id: string,
    resolution: string,
    auteur: string,
    role: string
  ) => void;
  saveSettings: (settings: Settings, auteur: string) => void;
  confirmPendingPayment: (id: string, auteur: string) => void;
  resolveTransactionAnomaly: (
    id: string,
    resolution: string,
    auteur: string
  ) => void;
  closeReconciliation: (
    jour: string,
    operateur: Operator,
    auteur: string
  ) => void;
  pushAudit: (entry: Omit<AuditEntry, "id">) => void;
}

/**
 * État opérationnel du back-office (frontend only).
 * Chaque action sensible alimente automatiquement le journal d'audit (A06).
 */
export const useTbmStore = create<TbmState>()((set) => ({
  companies: initialCompanies,
  users: initialUserAccounts,
  refunds: initialRefunds,
  audit: initialAudit,
  settings: defaultSettings,
  transactions: initialTransactions,
  closedReconciliations: [],

  setCompanyStatus: (id, statut, auteur) =>
    set((state) => {
      const company = state.companies.find((c) => c.id === id);
      if (!company) return state;
      const entry = makeAudit({
        date: "À l'instant",
        auteur,
        role: "Session en cours",
        action: "Compagnie" as AuditAction,
        objet: company.nom,
        detail:
          statut === "active"
            ? "Compagnie activée — vente en ligne autorisée."
            : statut === "suspendue"
              ? "Compagnie suspendue — ventes bloquées."
              : "Compagnie remise en attente de validation.",
      });
      return {
        companies: state.companies.map((c) =>
          c.id === id ? { ...c, statut } : c
        ),
        audit: [entry, ...state.audit],
      };
    }),

  addCompany: (company, auteur) =>
    set((state) => ({
      companies: [company, ...state.companies],
      audit: [
        makeAudit({
          date: "À l'instant",
          auteur,
          role: "Session en cours",
          action: "Compagnie",
          objet: company.nom,
          detail: `Nouvelle compagnie créée (commission ${company.commission} %, ${company.ville}).`,
        }),
        ...state.audit,
      ],
    })),

  updateCompany: (id, patch, auteur) =>
    set((state) => {
      const company = state.companies.find((c) => c.id === id);
      if (!company) return state;
      const changes: string[] = [];
      if (patch.nom && patch.nom !== company.nom)
        changes.push(`nom → « ${patch.nom} »`);
      if (patch.contact && patch.contact !== company.contact)
        changes.push(`e-mail → ${patch.contact}`);
      if (patch.telephone && patch.telephone !== company.telephone)
        changes.push(`téléphone → ${patch.telephone}`);
      if (patch.adresse && patch.adresse !== company.adresse)
        changes.push(`adresse → ${patch.adresse}`);
      if (patch.ville && patch.ville !== company.ville)
        changes.push(`ville → ${patch.ville}`);
      if (patch.commission !== undefined && patch.commission !== company.commission)
        changes.push(`commission ${company.commission} % → ${patch.commission} %`);
      if (patch.params) {
        const p = patch.params;
        const o = company.params;
        if (p.venteEnLigne !== o.venteEnLigne)
          changes.push(`vente en ligne ${p.venteEnLigne ? "activée" : "désactivée"}`);
        if (p.venteGuichet !== o.venteGuichet)
          changes.push(`vente au guichet ${p.venteGuichet ? "activée" : "désactivée"}`);
        if (p.reservationJours !== o.reservationJours)
          changes.push(`réservation ${o.reservationJours} → ${p.reservationJours} j`);
        if (p.annulationGratuite !== o.annulationGratuite)
          changes.push(`annulation gratuite ${o.annulationGratuite} → ${p.annulationGratuite} h`);
      }
      return {
        companies: state.companies.map((c) =>
          c.id === id ? { ...c, ...patch } : c
        ),
        audit: [
          makeAudit({
            date: "À l'instant",
            auteur,
            role: "Session en cours",
            action: "Compagnie" as AuditAction,
            objet: company.nom,
            detail:
              changes.length > 0
                ? `Fiche modifiée : ${changes.join(" · ")}.`
                : "Fiche enregistrée sans modification.",
          }),
          ...state.audit,
        ],
      };
    }),

  /**
   * Création d'un compte professionnel — le compte reste « À activer »
   * jusqu'à validation TBM (aucun accès tant que le compte n'est pas activé).
   */
  createProAccount: (input, auteur, role) =>
    set((state) => {
      const account: UserAccount = {
        id: `USR-${userSeq++}`,
        nom: input.nom.trim(),
        email: input.email.trim().toLowerCase(),
        telephone: input.telephone.trim() || undefined,
        role: input.role,
        compagnie: input.compagnie,
        statut: "attente",
        creeLe: "À l'instant",
        creePar: auteur,
        connexions: [],
        actionsSensibles: [],
      };
      return {
        users: [account, ...state.users],
        audit: [
          makeAudit({
            date: "À l'instant",
            auteur,
            role,
            action: "Utilisateur" as AuditAction,
            objet: account.nom,
            detail: `Compte professionnel créé (${account.role} · ${account.compagnie}) — en attente d'activation, aucun accès tant que le compte n'est pas activé.`,
          }),
          ...state.audit,
        ],
      };
    }),

  /** Activation d'un compte professionnel — mot de passe provisoire remis par SMS. */
  activateUser: (id, auteur, role) =>
    set((state) => {
      const user = state.users.find((u) => u.id === id);
      if (!user || user.statut !== "attente") return state;
      return {
        users: state.users.map((u) =>
          u.id === id
            ? {
                ...u,
                statut: "actif" as const,
                activeLe: "À l'instant",
                activePar: auteur,
              }
            : u
        ),
        audit: [
          makeAudit({
            date: "À l'instant",
            auteur,
            role,
            action: "Utilisateur" as AuditAction,
            objet: user.nom,
            detail: `Compte professionnel activé (${user.role}${user.compagnie ? ` · ${user.compagnie}` : ""}) — mot de passe provisoire envoyé par SMS.`,
          }),
          ...state.audit,
        ],
      };
    }),

  /**
   * Blocage d'un compte — motif obligatoire et tracé.
   * Un administrateur TBM ne peut jamais être bloqué (protection RBAC).
   */
  blockUser: (id, motif, auteur, role) =>
    set((state) => {
      const user = state.users.find((u) => u.id === id);
      if (
        !user ||
        user.statut === "bloque" ||
        user.role === "Administrateur TBM" ||
        !motif.trim()
      )
        return state;
      return {
        users: state.users.map((u) =>
          u.id === id
            ? {
                ...u,
                statut: "bloque" as const,
                bloqueMotif: motif.trim(),
                bloquePar: auteur,
                bloqueLe: "À l'instant",
              }
            : u
        ),
        audit: [
          makeAudit({
            date: "À l'instant",
            auteur,
            role,
            action: "Utilisateur" as AuditAction,
            objet: user.nom,
            detail: `Compte bloqué — « ${motif.trim()} » — accès back-office et application retirés.`,
          }),
          ...state.audit,
        ],
      };
    }),

  /** Déblocage d'un compte — après vérification de l'identité du titulaire. */
  unblockUser: (id, auteur, role) =>
    set((state) => {
      const user = state.users.find((u) => u.id === id);
      if (!user || user.statut !== "bloque") return state;
      return {
        users: state.users.map((u) =>
          u.id === id
            ? {
                ...u,
                statut: "actif" as const,
                bloqueMotif: undefined,
                bloquePar: undefined,
                bloqueLe: undefined,
              }
            : u
        ),
        audit: [
          makeAudit({
            date: "À l'instant",
            auteur,
            role,
            action: "Utilisateur" as AuditAction,
            objet: user.nom,
            detail: "Compte débloqué — accès rétabli après vérification de l'identité.",
          }),
          ...state.audit,
        ],
      };
    }),

  /**
   * Changement de rôle — justification obligatoire, tracée au journal d'audit.
   * Le périmètre d'isolation est recalculé automatiquement à partir du rôle.
   */
  changeUserRole: (id, nouveauRole, justification, auteur, role) =>
    set((state) => {
      const user = state.users.find((u) => u.id === id);
      if (
        !user ||
        user.role === nouveauRole ||
        user.role === "Administrateur TBM" ||
        !justification.trim()
      )
        return state;
      return {
        users: state.users.map((u) =>
          u.id === id ? { ...u, role: nouveauRole } : u
        ),
        audit: [
          makeAudit({
            date: "À l'instant",
            auteur,
            role,
            action: "Utilisateur" as AuditAction,
            objet: user.nom,
            detail: `Rôle modifié : ${user.role} → ${nouveauRole} — « ${justification.trim()} ». Périmètre d'accès recalculé.`,
          }),
          ...state.audit,
        ],
      };
    }),

  /** Prise en charge d'un dossier : l'agent devient responsable du traitement. */
  claimRefund: (id, auteur, role) =>
    set((state) => {
      const refund = state.refunds.find((r) => r.id === id);
      if (!refund || refund.traitePar) return state;
      const event: RefundEvent = {
        id: `RVE-${refundEventSeq++}`,
        date: "À l'instant",
        type: "prise_en_charge",
        detail:
          "Dossier pris en charge — vérification du motif, du débit d'origine et des pièces jointes.",
        par: auteur,
        role,
      };
      return {
        refunds: state.refunds.map((r) =>
          r.id === id
            ? { ...r, traitePar: auteur, historique: [...r.historique, event] }
            : r
        ),
        audit: [
          makeAudit({
            date: "À l'instant",
            auteur,
            role: "Session en cours",
            action: "Remboursement" as AuditAction,
            objet: `${refund.id} · ${refund.passager}`,
            detail: "Dossier de remboursement pris en charge.",
          }),
          ...state.audit,
        ],
      };
    }),

  /**
   * Décision manuelle sur un dossier — justification obligatoire et tracée.
   * Un dossier en litige est gelé jusqu'à la levée du litige (droits admin).
   */
  decideRefund: (id, approuve, justification, auteur, role) =>
    set((state) => {
      const refund = state.refunds.find((r) => r.id === id);
      if (!refund || refund.statut !== "en_attente" || refund.litige?.ouvert)
        return state;
      const event: RefundEvent = {
        id: `RVE-${refundEventSeq++}`,
        date: "À l'instant",
        type: "decision",
        detail: approuve
          ? `Remboursement validé — « ${justification} »`
          : `Remboursement refusé — « ${justification} »`,
        par: auteur,
        role,
      };
      return {
        refunds: state.refunds.map((r) =>
          r.id === id
            ? {
                ...r,
                statut: approuve ? ("approuve" as const) : ("refuse" as const),
                traitePar: auteur,
                justification,
                historique: [...r.historique, event],
              }
            : r
        ),
        audit: [
          makeAudit({
            date: "À l'instant",
            auteur,
            role: "Session en cours",
            action: "Remboursement" as AuditAction,
            objet: `${refund.id} · ${refund.passager}`,
            detail: approuve
              ? `Remboursement de ${new Intl.NumberFormat("fr-FR").format(refund.montantRemboursable)} FCFA validé — « ${justification} »`
              : `Remboursement refusé — « ${justification} »`,
          }),
          ...state.audit,
        ],
      };
    }),

  /**
   * Enregistrement d'un versement opérateur (tranche de remboursement).
   * Le dossier passe à « Remboursé » lorsque le montant éligible est couvert.
   */
  addRefundVersement: (id, montant, refOperateur, auteur, role) =>
    set((state) => {
      const refund = state.refunds.find((r) => r.id === id);
      if (
        !refund ||
        refund.statut !== "approuve" ||
        refund.litige?.ouvert ||
        montant <= 0 ||
        !refOperateur.trim()
      )
        return state;
      const dejaRembourse = refundMontantRembourse(refund);
      const resteAvant = Math.max(
        0,
        refund.montantRemboursable - dejaRembourse
      );
      const montantFinal = Math.min(montant, resteAvant);
      const solde = montantFinal >= resteAvant;
      const rang = refund.versements.length + 1;
      const versement: RefundVersement = {
        id: `RVS-${refundVersementSeq++}`,
        date: "À l'instant",
        montant: montantFinal,
        refOperateur: refOperateur.trim(),
        par: auteur,
      };
      const refClean = refOperateur.trim();
      const montantTxt = new Intl.NumberFormat("fr-FR").format(montantFinal);
      const resteTxt = new Intl.NumberFormat("fr-FR").format(
        resteAvant - montantFinal
      );
      const event: RefundEvent = {
        id: `RVE-${refundEventSeq++}`,
        date: "À l'instant",
        type: "versement",
        detail: solde
          ? `Versement de ${montantTxt} FCFA exécuté (réf. ${refClean}) — dossier intégralement remboursé.`
          : `${rang === 1 ? "1er versement" : `Versement n°${rang}`} de ${montantTxt} FCFA exécuté (réf. ${refClean}) — reste ${resteTxt} FCFA à verser.`,
        par: auteur,
        role,
      };
      return {
        refunds: state.refunds.map((r) =>
          r.id === id
            ? {
                ...r,
                statut: solde ? ("rembourse" as const) : r.statut,
                versements: [...r.versements, versement],
                historique: [...r.historique, event],
              }
            : r
        ),
        audit: [
          makeAudit({
            date: "À l'instant",
            auteur,
            role: "Session en cours",
            action: "Remboursement" as AuditAction,
            objet: `${refund.id} · ${refund.passager}`,
            detail: `Versement opérateur de ${montantTxt} FCFA enregistré (réf. ${refClean})${solde ? " — dossier soldé" : ""}.`,
          }),
          ...state.audit,
        ],
      };
    }),

  /** Escalade d'un dossier en litige — gel des décisions jusqu'à résolution. */
  openRefundDispute: (id, detail, auteur, role) =>
    set((state) => {
      const refund = state.refunds.find((r) => r.id === id);
      if (!refund || refund.litige?.ouvert) return state;
      const event: RefundEvent = {
        id: `RVE-${refundEventSeq++}`,
        date: "À l'instant",
        type: "litige_ouvert",
        detail: `Litige ouvert : ${detail} — dossier gelé jusqu'à résolution administrative.`,
        par: auteur,
        role,
      };
      return {
        refunds: state.refunds.map((r) =>
          r.id === id
            ? {
                ...r,
                litige: {
                  ouvert: true,
                  detail,
                  ouvertLe: "À l'instant",
                  ouvertPar: auteur,
                },
                historique: [...r.historique, event],
              }
            : r
        ),
        audit: [
          makeAudit({
            date: "À l'instant",
            auteur,
            role: "Session en cours",
            action: "Litige" as AuditAction,
            objet: `${refund.id} · ${refund.passager}`,
            detail: `Litige ouvert — ${detail}`,
          }),
          ...state.audit,
        ],
      };
    }),

  /** Levée d'un litige — réservée à l'administration, justification tracée. */
  resolveRefundDispute: (id, resolution, auteur, role) =>
    set((state) => {
      const refund = state.refunds.find((r) => r.id === id);
      if (!refund?.litige?.ouvert) return state;
      const event: RefundEvent = {
        id: `RVE-${refundEventSeq++}`,
        date: "À l'instant",
        type: "litige_resolu",
        detail: `Litige résolu — « ${resolution} »`,
        par: auteur,
        role,
      };
      return {
        refunds: state.refunds.map((r) =>
          r.id === id
            ? {
                ...r,
                litige: {
                  ...r.litige,
                  ouvert: false,
                  resolution,
                  resoluPar: auteur,
                },
                historique: [...r.historique, event],
              }
            : r
        ),
        audit: [
          makeAudit({
            date: "À l'instant",
            auteur,
            role: "Session en cours",
            action: "Litige" as AuditAction,
            objet: `${refund.id} · ${refund.passager}`,
            detail: `Litige résolu — « ${resolution} »`,
          }),
          ...state.audit,
        ],
      };
    }),

  saveSettings: (settings, auteur) =>
    set((state) => ({
      settings,
      audit: [
        makeAudit({
          date: "À l'instant",
          auteur,
          role: "Session en cours",
          action: "Paramétrage",
          objet: "Paramètres commerciaux",
          detail: `Frais de service ${
            settings.fraisMode === "fixe"
              ? `${settings.fraisValeur} FCFA/ticket`
              : `${settings.fraisValeur} %`
          }, commission par défaut ${settings.commissionDefaut} %, blocage des places ${settings.blocageMinutes} min.`,
        }),
        ...state.audit,
      ],
    })),

  /**
   * Retour fiable de l'opérateur simulé : la confirmation serveur arrive,
   * les billets sont émis APRÈS cette confirmation (point critique).
   */
  confirmPendingPayment: (id, auteur) =>
    set((state) => {
      const txn = state.transactions.find((t) => t.id === id);
      if (!txn || txn.statut !== "en_attente") return state;
      // Places bloquées déduites de l'historique d'initiation (RG1)
      const init = txn.timeline.find((e) => e.type === "initiation");
      const places = init ? (init.detail.match(/(\d+) place/) ?? ["", "1"])[1] : "1";
      const nb = Number(places) || 1;
      const now = "À l'instant";
      const updated: Transaction = {
        ...txn,
        statut: "reussi",
        billetsEmis: nb,
        releve: true,
        timeline: [
          {
            id: `PEV-${Date.now()}`,
            date: now,
            type: "emission",
            detail: `${nb} billet${nb > 1 ? "s" : ""} émis et envoyé${nb > 1 ? "s" : ""} par SMS après confirmation serveur.`,
            source: "Serveur TBM",
          },
          {
            id: `PEV-${Date.now() - 1}`,
            date: now,
            type: "confirmation",
            detail: `Retour fiable de l'opérateur reçu — débit de ${new Intl.NumberFormat("fr-FR").format(txn.montant)} FCFA confirmé (${txn.refOperateur}).`,
            source: "Opérateur",
          },
          ...txn.timeline,
        ],
      };
      return {
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
        audit: [
          makeAudit({
            date: now,
            auteur,
            role: "Session en cours",
            action: "Transaction" as AuditAction,
            objet: `${txn.id} · ${txn.refOperateur}`,
            detail: `Retour opérateur confirmé — ${nb} billet${nb > 1 ? "s" : ""} émis après confirmation serveur (point critique respecté).`,
          }),
          ...state.audit,
        ],
      };
    }),

  /** Anomalie « débité sans billet » résolue avec justification obligatoire. */
  resolveTransactionAnomaly: (id, resolution, auteur) =>
    set((state) => {
      const txn = state.transactions.find((t) => t.id === id);
      if (!txn?.anomalie || txn.anomalie.statut === "resolue") return state;
      const now = "À l'instant";
      const updated: Transaction = {
        ...txn,
        anomalie: {
          ...txn.anomalie,
          statut: "resolue",
          resolution,
          resoluPar: auteur,
        },
        timeline: [
          {
            id: `PEV-${Date.now()}`,
            date: now,
            type: "remboursement",
            detail: `Anomalie résolue — « ${resolution} »`,
            source: "Back-office",
          },
          ...txn.timeline,
        ],
      };
      return {
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
        audit: [
          makeAudit({
            date: now,
            auteur,
            role: "Session en cours",
            action: "Transaction" as AuditAction,
            objet: `${txn.id} · ${txn.refOperateur}`,
            detail: `Anomalie « débité sans billet » résolue — « ${resolution} »`,
          }),
          ...state.audit,
        ],
      };
    }),

  /** Clôture du rapprochement quotidien pour un jour + opérateur donné. */
  closeReconciliation: (jour, operateur, auteur) =>
    set((state) => {
      const key = `${jour}|${operateur}`;
      if (state.closedReconciliations.includes(key)) return state;
      return {
        closedReconciliations: [...state.closedReconciliations, key],
        audit: [
          makeAudit({
            date: "À l'instant",
            auteur,
            role: "Session en cours",
            action: "Rapprochement" as AuditAction,
            objet: `${operateur} · ${jour}`,
            detail: "Rapprochement quotidien clôturé — plateforme TBM conforme au relevé de l'opérateur.",
          }),
          ...state.audit,
        ],
      };
    }),

  pushAudit: (entry) =>
    set((state) => ({ audit: [makeAudit(entry), ...state.audit] })),
}));
