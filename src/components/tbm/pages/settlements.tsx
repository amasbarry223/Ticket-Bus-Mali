"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Banknote,
  Calculator,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileText,
  Hourglass,
  Info,
  Landmark,
  Lock,
  Percent,
  ScrollText,
  Search,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useTbmStore } from "@/lib/tbm-store";
import {
  companyInitials,
  companyLogoColor,
  ENCAISSEMENT_MODE_META,
  formatFcfa,
  formatNumber,
  REVERSEMENT_MOYEN_META,
  SETTLEMENT_DOC_META,
  SETTLEMENT_EVENT_META,
  SETTLEMENT_STATUS_META,
  settlementNetCollecte,
  type ReversementMoyen,
  type Settlement,
  type SettlementDoc,
  type SettlementDocKind,
  type SettlementEventKind,
  type SettlementStatus,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";
import { ActionIconButton } from "@/components/tbm/action-icon";
import { useParamState, validParam } from "@/lib/use-param-state";

/* ============================ Helpers ============================ */

/** Normalise une chaîne pour la recherche : minuscules, sans espaces/tirets/points. */
function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s\-.]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type DialogState = { kind: "validate" } | { kind: "pay" } | null;

/** Onglets de la page — synchronisés au paramètre d'URL ?tab=… */
const SETTLEMENT_TABS = ["cycle", "paiements", "compagnies"] as const;

/* ======================= Petits composants ======================= */

function MiniKpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="ff-card flex items-center gap-3.5 rounded-2xl border border-neutral-200/70 bg-white p-4"
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          tone
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium text-neutral-400">
          {label}
        </span>
        <span className="block truncate text-[15.5px] font-bold tracking-tight text-neutral-900">
          {value}
        </span>
        <span className="block truncate text-[11px] text-neutral-400">{hint}</span>
      </span>
    </motion.div>
  );
}

function StatusBadge({ statut }: { statut: SettlementStatus }) {
  const meta = SETTLEMENT_STATUS_META[statut];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

function MoyenBadge({ moyen }: { moyen: ReversementMoyen }) {
  const meta = REVERSEMENT_MOYEN_META[moyen];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
        meta.className
      )}
    >
      {moyen === "virement_bancaire" ? (
        <Landmark className="h-3 w-3" />
      ) : (
        <Smartphone className="h-3 w-3" />
      )}
      {meta.label}
    </span>
  );
}

function TauxBadge({ taux }: { taux: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-600">
      <Percent className="h-3 w-3" />
      {taux} %
    </span>
  );
}

function CompanyAvatar({ nom }: { nom: string }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ring-1",
        companyLogoColor(nom)
      )}
      aria-hidden
    >
      {companyInitials(nom)}
    </span>
  );
}

const DOC_ICON: Record<SettlementDocKind, React.ElementType> = {
  releve_collecte: ScrollText,
  avis_commission: FileText,
  preuve_paiement: BadgeCheck,
};

/** Bouton de téléchargement d'un justificatif (démo frontend). */
function DocButton({
  doc,
  revId,
  onDownload,
  compact,
}: {
  doc: SettlementDoc;
  revId: string;
  onDownload: (doc: SettlementDoc, revId: string) => void;
  compact?: boolean;
}) {
  const Icon = DOC_ICON[doc.kind];
  if (compact) {
    return (
      <button
        type="button"
        title={`${SETTLEMENT_DOC_META[doc.kind].label} — ${doc.nom}`}
        aria-label={`Télécharger ${SETTLEMENT_DOC_META[doc.kind].label} (${doc.nom})`}
        onClick={(e) => {
          e.stopPropagation();
          onDownload(doc, revId);
        }}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 transition-colors hover:border-coral-200 hover:bg-coral-50 hover:text-coral-600"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200/70 bg-neutral-50/60 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-500 ring-1 ring-neutral-200/80">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-neutral-700">
            {SETTLEMENT_DOC_META[doc.kind].label}
          </p>
          <p className="truncate font-mono text-[11px] text-neutral-400">{doc.nom}</p>
          <p className="text-[10.5px] text-neutral-400">
            {SETTLEMENT_DOC_META[doc.kind].description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[10.5px] text-neutral-400">
          {doc.taille} · généré {doc.genereLe}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(doc, revId);
          }}
          className="h-8 gap-1.5 rounded-lg border-neutral-200 px-2.5 text-[12px] font-medium shadow-none hover:border-coral-200 hover:bg-coral-50 hover:text-coral-600"
        >
          <Download className="h-3.5 w-3.5" />
          Télécharger
        </Button>
      </div>
    </div>
  );
}

function CopyRef({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  return (
    <button
      type="button"
      aria-label={`Copier la référence ${value}`}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
      onClick={() => {
        navigator.clipboard?.writeText(value).catch(() => undefined);
        setCopied(true);
        toast({ title: "Référence copiée", description: value });
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function InfoLine({
  label,
  value,
  action,
  badge,
  mono,
}: {
  label: string;
  value: string;
  action?: ReactNode;
  badge?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-neutral-100 pb-2.5 last:border-0 last:pb-0">
      <span className="shrink-0 text-[12px] text-neutral-400">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        {badge}
        <span
          className={cn(
            "truncate text-[12.5px] font-semibold text-neutral-800",
            mono && "font-mono text-[12px]"
          )}
        >
          {value}
        </span>
        {action}
      </span>
    </div>
  );
}

function EventBadge({ kind }: { kind: SettlementEventKind }) {
  const meta = SETTLEMENT_EVENT_META[kind];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10.5px] font-semibold",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

/** Ligne du décompte en cascade. */
function DecompteLine({
  label,
  sub,
  amount,
  sign,
  tone,
}: {
  label: string;
  sub?: string;
  amount: string;
  sign?: "minus" | "equals";
  tone?: "neutral" | "coral";
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
      <span className="flex min-w-0 items-center gap-2">
        {sign === "minus" && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[12px] font-bold text-neutral-500">
            −
          </span>
        )}
        {sign === "equals" && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[12px] font-bold text-neutral-500">
            =
          </span>
        )}
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate text-[12.5px] font-semibold",
              tone === "coral" ? "text-coral-700" : "text-neutral-700"
            )}
          >
            {label}
          </span>
          {sub && (
            <span className="block truncate text-[10.5px] text-neutral-400">{sub}</span>
          )}
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 text-[13px] font-bold tabular-nums",
          tone === "coral" ? "text-coral-600" : "text-neutral-800"
        )}
      >
        {amount}
      </span>
    </div>
  );
}

/* ========================= Fiche reversement ========================= */

function SettlementSheet({
  settlement,
  open,
  onOpenChange,
  isAdmin,
  onCalculate,
  onValidate,
  onPay,
  onDownloadDoc,
}: {
  settlement: Settlement | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isAdmin: boolean;
  onCalculate: (s: Settlement) => void;
  onValidate: (s: Settlement) => void;
  onPay: (s: Settlement) => void;
  onDownloadDoc: (doc: SettlementDoc, revId: string) => void;
}) {
  const encaissementMode = useTbmStore((s) => s.settings.encaissementMode);
  if (!settlement) return null;
  const s = settlement;
  const netCollecte = settlementNetCollecte(s);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[600px]"
      >
        <SheetTitle className="sr-only">Reversement {s.id}</SheetTitle>
        <SheetDescription className="sr-only">
          {s.compagnie} — {s.periode} — {formatFcfa(s.netAReverser)} à reverser.
        </SheetDescription>

        {/* En-tête */}
        <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white/95 px-6 pb-4 pt-5 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-mono text-[16px] font-bold tracking-tight text-neutral-900">
                  {s.id}
                </h3>
                <StatusBadge statut={s.statut} />
              </div>
              <p className="mt-0.5 text-[12.5px] text-neutral-400">
                {s.compagnie} · {s.periode}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {s.statut === "a_calculer" ? (
                <>
                  <p className="text-[17px] font-black tracking-tight text-neutral-400">
                    ≈ {formatNumber(s.estimation?.brut ?? 0)}
                  </p>
                  <p className="text-[10.5px] text-neutral-400">
                    FCFA — estimation provisoire
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[19px] font-black tracking-tight text-neutral-900">
                    {formatFcfa(s.netAReverser)}
                  </p>
                  <p className="text-[10.5px] text-neutral-400">net à reverser</p>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {s.statut === "a_calculer" && (
              <Button
                size="sm"
                onClick={() => onCalculate(s)}
                className="h-8 gap-1.5 rounded-xl bg-sky-500 text-[12.5px] font-semibold text-white hover:bg-sky-600"
              >
                <Calculator className="h-3.5 w-3.5" />
                Calculer le reversement
              </Button>
            )}
            {s.statut === "a_valider" &&
              (isAdmin ? (
                <Button
                  size="sm"
                  onClick={() => onValidate(s)}
                  className="h-8 gap-1.5 rounded-xl bg-emerald-500 text-[12.5px] font-semibold text-white hover:bg-emerald-600"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Valider le reversement
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-[11.5px] font-semibold text-neutral-500">
                  <Lock className="h-3.5 w-3.5" />
                  Validation réservée à l&apos;administration
                </span>
              ))}
            {s.statut === "en_cours" &&
              (isAdmin ? (
                <Button
                  size="sm"
                  onClick={() => onPay(s)}
                  className="h-8 gap-1.5 rounded-xl bg-coral-500 text-[12.5px] font-semibold text-white hover:bg-coral-600"
                >
                  <Banknote className="h-3.5 w-3.5" />
                  Enregistrer le reversement
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-[11.5px] font-semibold text-neutral-500">
                  <Lock className="h-3.5 w-3.5" />
                  Paiement réservé à l&apos;administration
                </span>
              ))}
            {s.statut === "paye" && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-[11.5px] font-semibold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Payé {s.payeLe} · réf. {s.refPaiement}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Alerte manualisation au lancement */}
          {s.statut === "en_cours" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-[12.5px] font-bold text-amber-700">
                  Exécution du paiement finalisée manuellement au lancement
                </p>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-amber-700/90">
                Le reversement effectif dépend du modèle d&apos;encaissement retenu
                par TBM (
                {ENCAISSEMENT_MODE_META[encaissementMode].label.toLowerCase()}).
                Exécutez le virement ou le transfert opérateur, puis enregistrez sa
                référence ici : la preuve de reversement sera rattachée au dossier.
              </p>
            </div>
          )}

          {/* Décompte */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Décompte de la période
            </h4>
            {s.statut === "a_calculer" ? (
              <div className="mt-2.5 rounded-2xl border border-neutral-200/70 p-4">
                <div className="rounded-xl bg-amber-50/70 p-3.5">
                  <p className="text-[12.5px] font-bold text-amber-700">
                    Estimation provisionnelle : ≈ {formatNumber(s.estimation?.brut ?? 0)} FCFA
                    collectés
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-amber-700/90">
                    {s.estimation?.transactions ?? 0} transactions confirmées ·{" "}
                    {s.estimation?.billets ?? 0} billets — montants définitifs au
                    calcul, après clôture du rapprochement quotidien (A02).
                  </p>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-neutral-500">
                  Le calcul consolidera : collecté brut − remboursements exécutés
                  (A03) − commission TBM ({s.commissionTaux} %) = net à reverser.
                  Le relevé de collecte et l&apos;avis de commission seront générés
                  automatiquement.
                </p>
              </div>
            ) : (
              <div className="mt-2.5 overflow-hidden rounded-2xl border border-neutral-200/70">
                <div className="divide-y divide-dashed divide-neutral-100">
                  <DecompteLine
                    label="Collecté brut"
                    sub={`${s.nbTransactions} transactions confirmées · ${s.nbBillets} billets émis (A02)`}
                    amount={`${formatNumber(s.brutCollecte)} FCFA`}
                  />
                  <DecompteLine
                    sign="minus"
                    label="Remboursements exécutés"
                    sub={`${s.nbRemboursements} dossier${s.nbRemboursements > 1 ? "s" : ""} remboursé${s.nbRemboursements > 1 ? "s" : ""} sur la période (A03)`}
                    amount={`− ${formatNumber(s.remboursements)} FCFA`}
                  />
                  <DecompteLine
                    sign="equals"
                    label="Collecté net"
                    amount={`${formatNumber(netCollecte)} FCFA`}
                  />
                  <DecompteLine
                    sign="minus"
                    label="Commission TBM"
                    sub={`taux contractuel ${s.commissionTaux} % (accord A01)`}
                    amount={`− ${formatNumber(s.commissionMontant)} FCFA`}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 bg-coral-50/80 px-3.5 py-3">
                  <span className="text-[13px] font-bold text-coral-700">
                    Net à reverser à {s.compagnie}
                  </span>
                  <span className="text-[15px] font-black tabular-nums text-coral-600">
                    {formatFcfa(s.netAReverser)}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Infos & cycle de vie */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Informations du reversement
            </h4>
            <div className="mt-2.5 space-y-2.5 rounded-2xl border border-neutral-200/70 p-4">
              <InfoLine label="Période" value={s.periode} />
              <InfoLine
                label="Compagnie"
                value={s.compagnie}
                badge={<TauxBadge taux={s.commissionTaux} />}
              />
              <InfoLine
                label="Modèle d'encaissement"
                value={ENCAISSEMENT_MODE_META[encaissementMode].label}
              />
              {s.moyen && (
                <InfoLine
                  label="Moyen de reversement"
                  value=""
                  badge={<MoyenBadge moyen={s.moyen} />}
                />
              )}
              {s.refPaiement && (
                <InfoLine
                  label="Référence du paiement"
                  value={s.refPaiement}
                  mono
                  action={<CopyRef value={s.refPaiement} />}
                />
              )}
              <InfoLine
                label="Calcul"
                value={s.calculeLe ? `${s.calculeLe} · ${s.calculePar}` : "— à faire"}
              />
              <InfoLine
                label="Validation"
                value={s.valideLe ? `${s.valideLe} · ${s.validePar}` : "— en attente"}
              />
              <InfoLine
                label="Paiement"
                value={s.payeLe ? `${s.payeLe} · ${s.payePar}` : "— à exécuter"}
              />
            </div>
          </section>

          {/* Justificatifs & relevés */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Justificatifs &amp; relevés ({s.docs.length})
            </h4>
            <p className="mt-1 text-[11.5px] text-neutral-400">
              Téléchargeables — ils servent de pièces au dossier et aux échanges
              avec la compagnie.
            </p>
            <div className="mt-2.5 space-y-2">
              {s.docs.length === 0 ? (
                <p className="rounded-xl bg-neutral-50 p-3 text-[12px] text-neutral-400">
                  Aucun justificatif — le relevé de collecte et l&apos;avis de
                  commission sont générés au calcul du reversement.
                </p>
              ) : (
                s.docs.map((d) => (
                  <DocButton
                    key={d.id}
                    doc={d}
                    revId={s.id}
                    onDownload={onDownloadDoc}
                  />
                ))
              )}
            </div>
          </section>

          {/* Historique du reversement (traçabilité complète) */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Historique du reversement ({s.historique.length})
            </h4>
            <p className="mt-1 text-[11.5px] text-neutral-400">
              Traçabilité complète : chaque étape est signée et tracée au journal
              d&apos;audit (A06).
            </p>
            <ol className="mt-3 space-y-3.5">
              {[...s.historique].reverse().map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-neutral-200" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <EventBadge kind={e.type} />
                      <span className="text-[11.5px] font-medium text-neutral-500">
                        {e.date}
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-600">
                      {e.detail}
                    </p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      {e.par} · {e.role}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ============================== Page ============================= */

export function SettlementsPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const auteur = user?.name ?? "Opérateur";
  const roleLabel = user?.role === "admin" ? "Administrateur TBM" : "Support TBM";
  const isAdmin = user?.role === "admin";

  const settlements = useTbmStore((s) => s.settlements);
  const companies = useTbmStore((s) => s.companies);
  const settings = useTbmStore((s) => s.settings);
  const calculateSettlement = useTbmStore((s) => s.calculateSettlement);
  const validateSettlement = useTbmStore((s) => s.validateSettlement);
  const paySettlement = useTbmStore((s) => s.paySettlement);

  /* Onglet + sélection synchronisés aux paramètres d'URL (?tab=…, ?sel=…) */
  const [tabParam, setTabParam] = useParamState("tab", "cycle");
  const tab = validParam(tabParam, SETTLEMENT_TABS, "cycle");
  const [selParam, setSel] = useParamState("sel", "");

  const [query, setQuery] = useState("");
  const [statut, setStatut] = useState<string>("all");
  const [compagnie, setCompagnie] = useState<string>("all");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [payMoyen, setPayMoyen] = useState<ReversementMoyen>("virement_bancaire");
  const [payRef, setPayRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  /* La fiche dérive l'item du store par id (live), jamais un snapshot. */
  const selected = selParam
    ? settlements.find((s) => s.id === selParam) ?? null
    : null;

  const compagniesList = useMemo(
    () => Array.from(new Set(settlements.map((s) => s.compagnie))),
    [settlements]
  );

  const filtered = useMemo(() => {
    const q = normalizeKey(query);
    return settlements.filter((s) => {
      if (statut !== "all" && s.statut !== statut) return false;
      if (compagnie !== "all" && s.compagnie !== compagnie) return false;
      if (q === "") return true;
      const hay = normalizeKey(
        [
          s.id,
          s.compagnie,
          s.periode,
          s.refPaiement ?? "",
          String(s.brutCollecte),
          String(s.netAReverser),
        ].join(" ")
      );
      return hay.includes(q);
    });
  }, [settlements, query, statut, compagnie]);

  /* KPIs */
  const kpi = useMemo(() => {
    const withAmounts = settlements.filter((s) => s.statut !== "a_calculer");
    const collecte = withAmounts.reduce((acc, s) => acc + s.brutCollecte, 0);
    const commissions = withAmounts.reduce((acc, s) => acc + s.commissionMontant, 0);
    const attente = settlements
      .filter((s) => s.statut === "a_valider" || s.statut === "en_cours")
      .reduce((acc, s) => acc + s.netAReverser, 0);
    const payes = settlements.filter((s) => s.statut === "paye");
    const payeTotal = payes.reduce((acc, s) => acc + s.netAReverser, 0);
    return { collecte, commissions, attente, payes, payeTotal };
  }, [settlements]);

  const aTraiter = settlements.filter(
    (s) => s.statut !== "paye"
  );

  /* Historique des paiements */
  const payesSorted = useMemo(
    () =>
      settlements
        .filter((s) => s.statut === "paye")
        .sort((a, b) => (a.payeLe ?? "").localeCompare(b.payeLe ?? "")),
    [settlements]
  );

  /* Agrégat par compagnie */
  const perCompany = useMemo(() => {
    return compagniesList
      .map((nom) => {
        const list = settlements.filter((s) => s.compagnie === nom);
        const last = [...list].sort((a, b) => b.id.localeCompare(a.id))[0];
        return {
          nom,
          taux: last?.commissionTaux ?? 0,
          nb: list.length,
          collecte: list.reduce((acc, s) => acc + s.brutCollecte, 0),
          commissions: list.reduce((acc, s) => acc + s.commissionMontant, 0),
          reverses: list
            .filter((s) => s.statut === "paye")
            .reduce((acc, s) => acc + s.netAReverser, 0),
          attente: list
            .filter((s) => s.statut === "a_valider" || s.statut === "en_cours")
            .reduce((acc, s) => acc + s.netAReverser, 0),
          aCalculer: list.filter((s) => s.statut === "a_calculer").length,
          last,
        };
      })
      .sort((a, b) => b.collecte - a.collecte);
  }, [compagniesList, settlements]);

  const openValidate = (s: Settlement) => {
    setSel(s.id);
    setDialog({ kind: "validate" });
    setError(null);
  };
  const openPay = (s: Settlement) => {
    setSel(s.id);
    setDialog({ kind: "pay" });
    setPayMoyen("virement_bancaire");
    setPayRef("");
    setError(null);
  };
  const closeDialog = () => {
    setDialog(null);
    setError(null);
  };

  const calculate = (s: Settlement) => {
    calculateSettlement(s.id, auteur, roleLabel);
    toast({
      title: "Reversement calculé",
      description: `${s.id} — décompte consolidé, en attente de validation (relevé de collecte et avis de commission générés).`,
    });
  };

  const confirmValidate = () => {
    if (!selected || dialog?.kind !== "validate") return;
    validateSettlement(selected.id, auteur, roleLabel);
    toast({
      title: "Reversement validé",
      description: `${selected.id} — ${formatFcfa(selected.netAReverser)} engagés pour ${selected.compagnie}. Exécution du paiement à finaliser.`,
    });
    closeDialog();
  };

  const confirmPay = () => {
    if (!selected || dialog?.kind !== "pay") return;
    if (payRef.trim().length < 4) {
      setError(
        "Référence de paiement obligatoire (4 caractères minimum) — avis de virement ou référence opérateur. Elle prouve l'exécution du reversement."
      );
      return;
    }
    paySettlement(selected.id, payMoyen, payRef.trim(), auteur, roleLabel);
    toast({
      title: "Reversement enregistré",
      description: `${selected.id} — ${formatFcfa(selected.netAReverser)} versés à ${selected.compagnie} (réf. ${payRef.trim()}). Preuve rattachée au dossier.`,
    });
    closeDialog();
  };

  const downloadDoc = (doc: SettlementDoc, revId: string) => {
    toast({
      title: "Justificatif téléchargé",
      description: `${revId} — ${doc.nom} (${doc.taille})`,
    });
  };

  const exportCsv = () => {
    const header = [
      "Reference",
      "Periode",
      "Compagnie",
      "Taux commission",
      "Brut collecte",
      "Remboursements",
      "Net collecte",
      "Commission TBM",
      "Net a reverser",
      "Statut",
      "Moyen",
      "Ref paiement",
      "Calcule par",
      "Valide par",
      "Paye le",
      "Paye par",
    ].join(";");
    const rows = filtered.map((s) =>
      [
        s.id,
        s.periode,
        s.compagnie,
        `${s.commissionTaux} %`,
        s.brutCollecte,
        s.remboursements,
        settlementNetCollecte(s),
        s.commissionMontant,
        s.netAReverser,
        SETTLEMENT_STATUS_META[s.statut].label,
        s.moyen ? REVERSEMENT_MOYEN_META[s.moyen].label : "",
        s.refPaiement ?? "",
        s.calculePar ?? "",
        s.validePar ?? "",
        s.payeLe ?? "",
        s.payePar ?? "",
      ]
        .map((c) => String(c).replace(/;/g, ","))
        .join(";")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tbm-commissions-reversements.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export CSV généré",
      description: `${filtered.length} reversement(s) exporté(s) — décomptes, statuts et références de paiement inclus.`,
    });
  };

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            Commissions &amp; reversements
          </h2>
          <p className="mt-0.5 text-[12.5px] text-neutral-400">
            A11 — Montants collectés par compagnie, commissions TBM et net à
            reverser. Conçu dès le départ pour les deux modèles d&apos;encaissement.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          className="h-9 gap-1.5 rounded-xl border-neutral-200 text-[12.5px] font-medium shadow-none hover:border-neutral-300"
        >
          <Download className="h-4 w-4 text-neutral-400" />
          Exporter
        </Button>
      </div>

      {/* Bandeau modèle d'encaissement + droits */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-neutral-200/70 bg-neutral-50/60 px-4 py-3"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-neutral-600">
          <Info className="h-4 w-4 text-coral-500" />
          Modèle d&apos;encaissement retenu :{" "}
          {ENCAISSEMENT_MODE_META[settings.encaissementMode].label} —
        </span>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-neutral-500">
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            Conçu pour les deux modèles (collecte TBM ou collecte compagnie)
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            Au lancement, calcul, validation et paiement finalisés manuellement
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            {isAdmin
              ? "Calcul, validation et exécution des reversements"
              : "Calcul et consultation — validation et paiement réservés à l'administration"}
          </li>
        </ul>
      </motion.div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi
          icon={Wallet}
          label="Collecté (périodes traitées)"
          value={formatFcfa(kpi.collecte)}
          hint={`${settlements.length} reversements · ${compagniesList.length} compagnies`}
          tone="bg-coral-100 text-coral-600"
        />
        <MiniKpi
          icon={Percent}
          label="Commissions TBM"
          value={formatFcfa(kpi.commissions)}
          hint="taux contractuels 8 à 12 %"
          tone="bg-violet-100 text-violet-600"
        />
        <MiniKpi
          icon={Hourglass}
          label="Net à reverser — en attente"
          value={formatFcfa(kpi.attente)}
          hint={`${aTraiter.length} reversement${aTraiter.length > 1 ? "s" : ""} à traiter`}
          tone="bg-amber-100 text-amber-600"
        />
        <MiniKpi
          icon={CheckCircle2}
          label="Reversements payés"
          value={formatFcfa(kpi.payeTotal)}
          hint={`${kpi.payes.length} reversement${kpi.payes.length > 1 ? "s" : ""} exécuté${kpi.payes.length > 1 ? "s" : ""}`}
          tone="bg-emerald-100 text-emerald-600"
        />
      </div>

      {/* Onglets — synchronisés à ?tab=… */}
      <Tabs value={tab} onValueChange={setTabParam} className="mt-5">
        <TabsList className="h-10 w-full justify-start gap-1 overflow-x-auto rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-1 ff-scrollbar sm:w-auto">
          <TabsTrigger
            value="cycle"
            className="h-8 gap-1.5 rounded-lg px-3.5 text-[12.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Calculator className="h-3.5 w-3.5" />
            Cycle de reversement
            {aTraiter.length > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-500 px-1 text-[9.5px] font-bold text-white">
                {aTraiter.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="paiements"
            className="h-8 gap-1.5 rounded-lg px-3.5 text-[12.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Banknote className="h-3.5 w-3.5" />
            Historique des paiements
          </TabsTrigger>
          <TabsTrigger
            value="compagnies"
            className="h-8 gap-1.5 rounded-lg px-3.5 text-[12.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Wallet className="h-3.5 w-3.5" />
            Par compagnie
          </TabsTrigger>
        </TabsList>

        {/* ---------------------- Cycle de reversement ---------------------- */}
        <TabsContent value="cycle" className="mt-4">
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Réf. (REV-…), compagnie, période, réf. paiement…"
                aria-label="Rechercher un reversement"
                className="h-9 rounded-xl border-neutral-200 bg-white pl-9 text-[13px] focus-visible:ring-coral-200"
              />
            </div>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger
                aria-label="Filtrer par statut"
                className="h-9 w-[140px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-100">
                <SelectItem value="all" className="rounded-lg text-[13px]">
                  Tous statuts
                </SelectItem>
                {Object.entries(SETTLEMENT_STATUS_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key} className="rounded-lg text-[13px]">
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={compagnie} onValueChange={setCompagnie}>
              <SelectTrigger
                aria-label="Filtrer par compagnie"
                className="h-9 w-[180px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-100">
                <SelectItem value="all" className="rounded-lg text-[13px]">
                  Toutes compagnies
                </SelectItem>
                {compagniesList.map((nom) => (
                  <SelectItem key={nom} value={nom} className="rounded-lg text-[13px]">
                    {nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tableau */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card mt-3 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
          >
            <div className="ff-scrollbar overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                    <TableHead className="h-11 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400">
                      Réf. &amp; période
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Compagnie
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Collecté
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Commission
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Net à reverser
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Statut
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Justificatifs
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer border-neutral-100 align-top transition-colors hover:bg-neutral-50/70"
                      onClick={() => setSel(s.id)}
                    >
                      <TableCell className="py-3.5 pl-5">
                        <span className="block text-[13px] font-semibold tabular-nums text-neutral-700">
                          {s.id}
                        </span>
                        <span className="block text-[11px] text-neutral-400">
                          {s.periode}
                        </span>
                      </TableCell>
                      <TableCell className="pt-3.5">
                        <span className="flex items-center gap-2.5">
                          <CompanyAvatar nom={s.compagnie} />
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] font-medium text-neutral-700">
                              {s.compagnie}
                            </span>
                            <span className="block text-[11px] text-neutral-400">
                              taux {s.commissionTaux} %
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="pt-3.5">
                        {s.statut === "a_calculer" ? (
                          <span className="block text-[12.5px] italic text-neutral-400">
                            ≈ {formatNumber(s.estimation?.brut ?? 0)} FCFA
                            <span className="ml-1 text-[10.5px] not-italic">
                              (provisoire)
                            </span>
                          </span>
                        ) : (
                          <>
                            <span className="block text-[13px] font-semibold tabular-nums text-neutral-800">
                              {formatNumber(s.brutCollecte)}
                            </span>
                            <span className="block text-[11px] tabular-nums text-neutral-400">
                              − {formatNumber(s.remboursements)} remb. · net{" "}
                              {formatNumber(settlementNetCollecte(s))}
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="pt-3.5">
                        {s.statut === "a_calculer" ? (
                          <span className="text-[12.5px] text-neutral-300">—</span>
                        ) : (
                          <>
                            <TauxBadge taux={s.commissionTaux} />
                            <span className="mt-1 block text-[11.5px] font-semibold tabular-nums text-neutral-600">
                              {formatNumber(s.commissionMontant)} FCFA
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="pt-3.5">
                        {s.statut === "a_calculer" ? (
                          <span className="text-[12.5px] text-neutral-300">— au calcul</span>
                        ) : (
                          <span className="block text-[13.5px] font-bold tabular-nums text-neutral-900">
                            {formatFcfa(s.netAReverser)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="pt-3.5">
                        <StatusBadge statut={s.statut} />
                        <span className="mt-1 block max-w-[150px] truncate text-[11px] text-neutral-400">
                          {s.statut === "paye"
                            ? `payé ${s.payeLe}`
                            : s.statut === "en_cours"
                              ? `validé ${s.valideLe}`
                              : s.statut === "a_valider"
                                ? `calculé ${s.calculeLe}`
                                : "calcul à lancer"}
                        </span>
                      </TableCell>
                      <TableCell className="pt-3.5">
                        {s.docs.length === 0 ? (
                          <span className="text-[11.5px] text-neutral-300">
                            au calcul
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            {s.docs.map((d) => (
                              <DocButton
                                key={d.id}
                                doc={d}
                                revId={s.id}
                                onDownload={downloadDoc}
                                compact
                              />
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="pr-5 pt-3 text-right">
                        <span className="inline-flex items-center justify-end gap-1">
                          {s.statut === "a_calculer" ? (
                            <ActionIconButton
                              icon={Calculator}
                              label="Calculer le reversement"
                              tone="sky"
                              onClick={() => calculate(s)}
                            />
                          ) : s.statut === "a_valider" ? (
                            isAdmin ? (
                              <ActionIconButton
                                icon={Check}
                                label="Valider"
                                tone="emerald"
                                onClick={() => openValidate(s)}
                              />
                            ) : (
                              <ActionIconButton
                                icon={Lock}
                                label="Réservé à l’administration"
                                disabled
                              />
                            )
                          ) : s.statut === "en_cours" ? (
                            isAdmin ? (
                              <ActionIconButton
                                icon={Banknote}
                                label="Reversement"
                                tone="coral"
                                onClick={() => openPay(s)}
                              />
                            ) : (
                              <ActionIconButton
                                icon={Lock}
                                label="Réservé à l’administration"
                                disabled
                              />
                            )
                          ) : null}
                          <ActionIconButton
                            icon={Eye}
                            label="Voir la fiche"
                            onClick={() => setSel(s.id)}
                          />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-10 text-center text-[13px] text-neutral-400"
                      >
                        Aucun reversement ne correspond à ces filtres.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.section>
        </TabsContent>

        {/* --------------------- Historique des paiements --------------------- */}
        <TabsContent value="paiements" className="mt-4">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
          >
            <div className="ff-scrollbar overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                    <TableHead className="h-11 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400">
                      Reversement
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Compagnie
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Net reversé
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Moyen
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Référence du paiement
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Preuve
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payesSorted.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer border-neutral-100 align-top transition-colors hover:bg-neutral-50/70"
                      onClick={() => setSel(s.id)}
                    >
                      <TableCell className="py-3.5 pl-5">
                        <span className="block text-[13px] font-semibold tabular-nums text-neutral-700">
                          {s.id}
                        </span>
                        <span className="block text-[11px] text-neutral-400">
                          payé le {s.payeLe} · {s.payePar}
                        </span>
                      </TableCell>
                      <TableCell className="pt-3.5">
                        <span className="flex items-center gap-2.5">
                          <CompanyAvatar nom={s.compagnie} />
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] font-medium text-neutral-700">
                              {s.compagnie}
                            </span>
                            <span className="block text-[11px] text-neutral-400">
                              {s.periode}
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="pt-3.5">
                        <span className="block text-[13px] font-bold tabular-nums text-neutral-900">
                          {formatFcfa(s.netAReverser)}
                        </span>
                        <span className="block text-[11px] text-neutral-400">
                          commission {formatNumber(s.commissionMontant)} FCFA
                        </span>
                      </TableCell>
                      <TableCell className="pt-3.5">
                        {s.moyen && <MoyenBadge moyen={s.moyen} />}
                      </TableCell>
                      <TableCell className="pt-3.5">
                        <span className="inline-flex items-center gap-0.5 rounded-lg bg-neutral-50 px-2 py-1 font-mono text-[11.5px] font-semibold text-neutral-600 ring-1 ring-neutral-200/70">
                          {s.refPaiement}
                          <CopyRef value={s.refPaiement ?? ""} />
                        </span>
                      </TableCell>
                      <TableCell className="pt-3.5">
                        {s.docs
                          .filter((d) => d.kind === "preuve_paiement")
                          .map((d) => (
                            <DocButton
                              key={d.id}
                              doc={d}
                              revId={s.id}
                              onDownload={downloadDoc}
                              compact
                            />
                          ))}
                      </TableCell>
                      <TableCell className="pr-5 pt-3 text-right">
                        <ActionIconButton
                          icon={Eye}
                          label="Voir la fiche"
                          onClick={() => setSel(s.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {payesSorted.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-[13px] text-neutral-400"
                      >
                        Aucun reversement payé pour le moment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {payesSorted.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50/60 px-5 py-3">
                <span className="text-[12px] font-medium text-neutral-500">
                  Total reversé aux compagnies (démonstration)
                </span>
                <span className="text-[13px] font-bold tabular-nums text-emerald-600">
                  {formatFcfa(kpi.payeTotal)}
                </span>
              </div>
            )}
          </motion.section>
        </TabsContent>

        {/* ------------------------- Par compagnie ------------------------- */}
        <TabsContent value="compagnies" className="mt-4">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
          >
            <div className="ff-scrollbar overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                    <TableHead className="h-11 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400">
                      Compagnie
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Collecté cumulé
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Commissions TBM
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Net reversé
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      En attente
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Dernier reversement
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perCompany.map((c) => (
                    <TableRow
                      key={c.nom}
                      className="cursor-pointer border-neutral-100 align-top transition-colors hover:bg-neutral-50/70"
                      onClick={() => c.last && setSel(c.last.id)}
                    >
                      <TableCell className="py-3.5 pl-5">
                        <span className="flex items-center gap-2.5">
                          <CompanyAvatar nom={c.nom} />
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold text-neutral-800">
                              {c.nom}
                            </span>
                            <span className="block text-[11px] text-neutral-400">
                              {c.nb} reversement{c.nb > 1 ? "s" : ""} · taux {c.taux} %
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="pt-3.5">
                        <span className="block text-[13px] font-semibold tabular-nums text-neutral-800">
                          {formatFcfa(c.collecte)}
                        </span>
                      </TableCell>
                      <TableCell className="pt-3.5">
                        <span className="block text-[13px] font-semibold tabular-nums text-violet-600">
                          {formatFcfa(c.commissions)}
                        </span>
                      </TableCell>
                      <TableCell className="pt-3.5">
                        <span className="block text-[13px] font-semibold tabular-nums text-emerald-600">
                          {formatFcfa(c.reverses)}
                        </span>
                      </TableCell>
                      <TableCell className="pt-3.5">
                        {c.attente > 0 ? (
                          <span className="block text-[13px] font-semibold tabular-nums text-amber-600">
                            {formatFcfa(c.attente)}
                          </span>
                        ) : c.aCalculer > 0 ? (
                          <span className="text-[11.5px] text-neutral-400">
                            {c.aCalculer} au calcul
                          </span>
                        ) : (
                          <span className="text-[11.5px] text-neutral-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="pt-3.5">
                        {c.last && (
                          <>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <StatusBadge statut={c.last.statut} />
                            </div>
                            <span className="mt-1 block text-[11px] text-neutral-400">
                              {c.last.id} · {c.last.periode}
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="pr-5 pt-3 text-right">
                        <ActionIconButton
                          icon={Eye}
                          label={
                            c.last
                              ? "Voir la fiche du dernier reversement"
                              : "Aucun reversement à afficher"
                          }
                          disabled={!c.last}
                          onClick={() => setSel(c.last?.id ?? "")}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {perCompany.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-[13px] text-neutral-400"
                      >
                        Aucune compagnie avec reversements pour le moment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.section>
        </TabsContent>
      </Tabs>

      {/* Fiche reversement */}
      <SettlementSheet
        settlement={selected}
        open={selected != null}
        onOpenChange={(v) => !v && setSel("")}
        isAdmin={isAdmin}
        onCalculate={calculate}
        onValidate={openValidate}
        onPay={openPay}
        onDownloadDoc={downloadDoc}
      />

      {/* Dialog : validation */}
      <Dialog
        open={dialog?.kind === "validate" && selected != null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          {dialog?.kind === "validate" && selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[16px]">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Valider le reversement {selected.id}
                </DialogTitle>
                <DialogDescription className="text-[12.5px] leading-relaxed">
                  {selected.compagnie} · {selected.periode}. La validation engage
                  le reversement du net — l&apos;exécution du paiement reste
                  finalisée manuellement au lancement.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1 rounded-xl bg-neutral-50 p-3.5 text-[12.5px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Collecté brut</span>
                  <span className="font-semibold tabular-nums text-neutral-800">
                    {formatNumber(selected.brutCollecte)} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">− Remboursements</span>
                  <span className="font-semibold tabular-nums text-neutral-800">
                    − {formatNumber(selected.remboursements)} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">
                    − Commission TBM ({selected.commissionTaux} %)
                  </span>
                  <span className="font-semibold tabular-nums text-neutral-800">
                    − {formatNumber(selected.commissionMontant)} FCFA
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-neutral-200 pt-1.5">
                  <span className="font-semibold text-coral-700">
                    Net à reverser
                  </span>
                  <span className="font-black tabular-nums text-coral-600">
                    {formatFcfa(selected.netAReverser)}
                  </span>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  className="h-9 rounded-xl border-neutral-200 text-[13px] shadow-none"
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmValidate}
                  className="h-9 rounded-xl bg-emerald-500 text-[13px] font-semibold text-white hover:bg-emerald-600"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Valider et passer en cours
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog : enregistrement du paiement */}
      <Dialog
        open={dialog?.kind === "pay" && selected != null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="rounded-2xl sm:max-w-[500px]">
          {dialog?.kind === "pay" && selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[16px]">
                  <Banknote className="h-5 w-5 text-coral-500" />
                  Enregistrer le reversement {selected.id}
                </DialogTitle>
                <DialogDescription className="text-[12.5px] leading-relaxed">
                  {selected.compagnie} — {formatFcfa(selected.netAReverser)} à
                  reverser. Saisissez la référence du virement ou du transfert
                  opérateur : la preuve de reversement sera rattachée au dossier et
                  l&apos;opération tracée au journal d&apos;audit.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="moyen" className="text-[13px]">
                    Moyen de reversement
                  </Label>
                  <Select
                    value={payMoyen}
                    onValueChange={(v) => setPayMoyen(v as ReversementMoyen)}
                  >
                    <SelectTrigger
                      id="moyen"
                      className="h-9.5 rounded-xl border-neutral-200 text-[13px] shadow-none"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-neutral-100">
                      {Object.entries(REVERSEMENT_MOYEN_META).map(([key, meta]) => (
                        <SelectItem
                          key={key}
                          value={key}
                          className="rounded-lg text-[13px]"
                        >
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ref-paiement" className="text-[13px]">
                    Référence du paiement <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="ref-paiement"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="Ex. BCEAO-88402-TBM, OM-REV-88012…"
                    className="h-9.5 rounded-xl border-neutral-200 font-mono text-[13px]"
                  />
                </div>
                {error && (
                  <p className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-600">
                    {error}
                  </p>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  className="h-9 rounded-xl border-neutral-200 text-[13px] shadow-none"
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmPay}
                  className="h-9 rounded-xl bg-coral-500 text-[13px] font-semibold text-white hover:bg-coral-600"
                >
                  <Check className="h-4 w-4" />
                  Enregistrer le reversement
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
