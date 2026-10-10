"use client";

import { create } from "zustand";
import {
  defaultSettings,
  initialAudit,
  initialCompanies,
  initialRefunds,
  initialUsers,
  type AuditAction,
  type AuditEntry,
  type Company,
  type CompanyStatus,
  type Refund,
  type Settings,
  type BackofficeUser,
} from "@/components/tbm/data";

let auditSeq = 215;

function makeAudit(
  entry: Omit<AuditEntry, "id"> & { id?: string }
): AuditEntry {
  return { id: entry.id ?? `AUD-${auditSeq++}`, ...entry };
}

interface TbmState {
  companies: Company[];
  users: BackofficeUser[];
  refunds: Refund[];
  audit: AuditEntry[];
  settings: Settings;

  setCompanyStatus: (id: string, statut: CompanyStatus, auteur: string) => void;
  addCompany: (company: Company, auteur: string) => void;
  updateCompany: (
    id: string,
    patch: Partial<Omit<Company, "id" | "statut" | "ticketsMois">>,
    auteur: string
  ) => void;
  toggleUserBlock: (id: string, auteur: string) => void;
  processRefund: (
    id: string,
    justification: string,
    auteur: string,
    refuse?: boolean
  ) => void;
  saveSettings: (settings: Settings, auteur: string) => void;
  pushAudit: (entry: Omit<AuditEntry, "id">) => void;
}

/**
 * État opérationnel du back-office (frontend only).
 * Chaque action sensible alimente automatiquement le journal d'audit (A06).
 */
export const useTbmStore = create<TbmState>()((set) => ({
  companies: initialCompanies,
  users: initialUsers,
  refunds: initialRefunds,
  audit: initialAudit,
  settings: defaultSettings,

  setCompanyStatus: (id, statut, auteur) =>
    set((state) => {
      const company = state.companies.find((c) => c.id === id);
      if (!company) return state;
      const entry = makeAudit({
        date: "À l’instant",
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
          date: "À l’instant",
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
            date: "À l’instant",
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

  toggleUserBlock: (id, auteur) =>
    set((state) => {
      const user = state.users.find((u) => u.id === id);
      if (!user) return state;
      const bloque = !user.bloque;
      return {
        users: state.users.map((u) => (u.id === id ? { ...u, bloque } : u)),
        audit: [
          makeAudit({
            date: "À l’instant",
            auteur,
            role: "Session en cours",
            action: "Utilisateur",
            objet: user.nom,
            detail: bloque
              ? "Compte bloqué — accès back-office et compagnie retirés."
              : "Compte débloqué — accès rétabli.",
          }),
          ...state.audit,
        ],
      };
    }),

  processRefund: (id, justification, auteur, refuse = false) =>
    set((state) => {
      const refund = state.refunds.find((r) => r.id === id);
      if (!refund) return state;
      return {
        refunds: state.refunds.map((r) =>
          r.id === id
            ? {
                ...r,
                statut: refuse ? ("refuse" as const) : ("traite" as const),
                justification,
                traitePar: auteur,
              }
            : r
        ),
        audit: [
          makeAudit({
            date: "À l’instant",
            auteur,
            role: "Session en cours",
            action: "Remboursement",
            objet: `${refund.id} · ${refund.passager}`,
            detail: refuse
              ? `Remboursement refusé — « ${justification} »`
              : `Remboursement de ${new Intl.NumberFormat("fr-FR").format(refund.montant)} FCFA validé — « ${justification} »`,
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
          date: "À l’instant",
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

  pushAudit: (entry) =>
    set((state) => ({ audit: [makeAudit(entry), ...state.audit] })),
}));
