"use client";

import { useMemo, useState, type ElementType, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeftRight,
  Ban,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  Eye,
  Hourglass,
  Phone,
  Printer,
  ReceiptText,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Wrench,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useTbmStore } from "@/lib/tbm-store";
import { ActionIconButton } from "@/components/tbm/action-icon";
import { TablePagination } from "@/components/tbm/table-pagination";
import { useParamState, validParam } from "@/lib/use-param-state";
import { useTablePagination } from "@/lib/use-pagination";
import {
  formatFcfa,
  operatorStatements,
  OPERATORS,
  PAYMENT_EVENT_META,
  PAYMENT_STATUS_META,
  RECONCILIATION_ECART_META,
  transactions as initialTransactions,
  type Operator,
  type PaymentStatus,
  type Transaction,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";

/* ============================ Helpers ============================ */

/** Normalise une chaîne pour la recherche : minuscules, sans espaces/tirets/points. */
function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s\-.]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function operatorBadgeClass(op: Operator): string {
  return op === "Orange Money"
    ? "bg-orange-50 text-orange-600"
    : "bg-violet-100 text-violet-600";
}

/**
 * Étapes de la chaîne critique du point de vue d'une transaction.
 * `blocageMinutes` provient du paramétrage (RG1 — settings.blocageMinutes).
 */
type ChainState = "done" | "pending" | "failed" | "warn";
interface ChainStep {
  label: string;
  note?: string;
  state: ChainState;
}

function chainFor(t: Transaction, blocageMinutes: number): ChainStep[] {
  const anomaly = t.anomalie;
  const resolved = anomaly?.statut === "resolue";
  const emissionFailed = anomaly && !resolved;

  const last: ChainStep =
    t.statut === "rembourse"
      ? { label: "Émission des billets", note: "Billets annulés — paiement remboursé", state: "warn" }
      : emissionFailed
        ? {
            label: "Émission des billets",
            note: "Débit confirmé mais aucun billet émis — réservation expirée avant le retour opérateur",
            state: "failed",
          }
        : t.statut === "reussi"
          ? {
              label: "Émission des billets",
              note: `${t.billetsEmis} billet${t.billetsEmis > 1 ? "s" : ""} émis après confirmation serveur`,
              state: "done",
            }
          : { label: "Émission des billets", note: "Après confirmation serveur uniquement", state: "pending" };

  if (t.statut === "en_attente") {
    return [
      { label: "Demande initiée", note: t.date, state: "done" },
      { label: "Requête envoyée à l'opérateur", note: "En attente de validation par le client (USSD)", state: "done" },
      { label: "Débit client", note: "Non encore confirmé", state: "pending" },
      { label: "Confirmation serveur TBM", note: "Après retour fiable de l'opérateur", state: "pending" },
      last,
    ];
  }
  if (t.statut === "echoue") {
    return [
      { label: "Demande initiée", note: t.date, state: "done" },
      { label: "Requête envoyée à l'opérateur", state: "done" },
      { label: "Débit client", note: "Refusé par l'opérateur", state: "failed" },
      { label: "Confirmation serveur TBM", note: "Jamais reçue", state: "pending" },
      last,
    ];
  }
  if (t.statut === "expire") {
    return [
      { label: "Demande initiée", note: t.date, state: "done" },
      { label: "Requête envoyée à l'opérateur", state: "done" },
      { label: "Débit client", note: "Non finalisé par le client", state: "warn" },
      {
        label: "Confirmation serveur TBM",
        note: `Places libérées après ${blocageMinutes} min (RG1)`,
        state: "warn",
      },
      last,
    ];
  }
  return [
    { label: "Demande initiée", note: t.date, state: "done" },
    { label: "Requête envoyée à l'opérateur", state: "done" },
    { label: "Débit client", note: `${formatFcfa(t.montant)} — ${t.refOperateur}`, state: "done" },
    { label: "Confirmation serveur TBM", note: "Retour fiable de l'opérateur reçu", state: "done" },
    last,
  ];
}

const CHAIN_DOT: Record<ChainState, string> = {
  done: "border-emerald-500 bg-emerald-500 text-white",
  pending: "border-neutral-200 bg-white text-neutral-300",
  failed: "border-rose-500 bg-rose-500 text-white",
  warn: "border-amber-400 bg-amber-400 text-white",
};

/* ======================= Petits composants ======================= */

function OperatorBadge({ op, className }: { op: Operator; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
        operatorBadgeClass(op),
        className
      )}
    >
      <Smartphone className="h-3 w-3" />
      {op}
    </span>
  );
}

function StatusBadge({ statut }: { statut: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[statut];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

function MiniKpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  rightElement,
  index = 0,
}: {
  icon: ElementType;
  label: string;
  value: string;
  hint: string;
  tone: string;
  rightElement?: React.ReactNode;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.05 + index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="flex items-center justify-between rounded-2xl border border-[var(--tbm-border)] bg-[var(--tbm-white)] p-4 shadow-xs"
    >
      <div className="flex items-start gap-3.5">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            tone
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-[12.5px] font-medium text-[var(--tbm-text)]">{label}</h3>
          <p className="mt-1 text-[22px] font-bold tracking-tight text-[var(--tbm-text)]">
            {value}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--tbm-text-muted)]">{hint}</p>
        </div>
      </div>
      {rightElement && (
        <div className="self-start pt-1 shrink-0">
          {rightElement}
        </div>
      )}
    </motion.article>
  );
}

/* ======================= Chaîne critique ========================= */

function CriticalChain({
  txn,
  blocageMinutes,
}: {
  txn: Transaction;
  blocageMinutes: number;
}) {
  const steps = chainFor(txn, blocageMinutes);
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex gap-3 pb-4 last:pb-0">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={cn(
                "absolute left-[9px] top-5 h-full w-0.5",
                s.state === "done" ? "bg-emerald-200" : "bg-neutral-100"
              )}
            />
          )}
          <span
            className={cn(
              "z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-2",
              CHAIN_DOT[s.state]
            )}
          >
            {s.state === "done" && <Check className="h-3 w-3" strokeWidth={3} />}
            {s.state === "failed" && <XCircle className="h-3 w-3" strokeWidth={2.5} />}
            {s.state === "warn" && <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.5} />}
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "text-[12.5px] font-semibold",
                s.state === "pending" ? "text-neutral-400" : "text-neutral-700"
              )}
            >
              {s.label}
            </p>
            {s.note && (
              <p
                className={cn(
                  "text-[11.5px] leading-snug",
                  s.state === "failed" ? "text-rose-600" : s.state === "warn" ? "text-amber-600" : "text-neutral-400"
                )}
              >
                {s.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* =========================== Reçu paiement ======================= */

function ReceiptDialog({
  txn,
  open,
  onOpenChange,
}: {
  txn: Transaction;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl p-0 sm:max-w-[440px]">
        <DialogTitle className="sr-only">
          Reçu de paiement {txn.refOperateur}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Reçu du paiement {txn.id} — {formatFcfa(txn.montant)} via {txn.operateur}.
        </DialogDescription>

        {/* En-tête TBM vert & primary */}
        <div className="rounded-t-2xl bg-[#003B2D] px-6 pb-5 pt-6 text-white">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#9BE000]">
            TBM · Ticket Bus Mali
          </p>
          <p className="mt-1 text-center text-[15px] font-extrabold uppercase tracking-wide text-white">
            Reçu de paiement
          </p>
          <p className="mt-4 text-center text-[30px] font-black leading-none tracking-tight text-white">
            {formatFcfa(txn.montant)}
          </p>
          <p className="mt-2 text-center font-mono text-[12px] text-[#9BE000]/90">
            {txn.refOperateur}
          </p>
        </div>

        {/* Corps */}
        <div className="space-y-3 px-6 py-5">
          <DetailRow label="Référence TBM" value={txn.id} mono />
          <DetailRow
            label="Réservation associée"
            value={txn.refReservation ?? "— (paiement sans réservation finalisée)"}
            mono={!!txn.refReservation}
          />
          <DetailRow label="Date" value={txn.date} />
          <DetailRow label="Moyen de paiement" value={txn.operateur} />
          <DetailRow label="Téléphone débité" value={txn.telephone} />
          <div className="flex items-center justify-between gap-3 border-b border-dashed border-[var(--tbm-border)] pb-3">
            <span className="text-[12px] text-[var(--tbm-text-muted)]">Statut du paiement</span>
            <StatusBadge statut={txn.statut} />
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-dashed border-[var(--tbm-border)] pb-3">
            <span className="text-[12px] text-[var(--tbm-text-muted)]">Billets émis</span>
            <span
              className={cn(
                "text-[12.5px] font-semibold",
                txn.billetsEmis > 0 ? "text-[var(--tbm-text)]" : "text-rose-600"
              )}
            >
              {txn.billetsEmis > 0
                 ? `${txn.billetsEmis} billet${txn.billetsEmis > 1 ? "s" : ""}`
                : "Aucun billet émis"}
            </span>
          </div>

          {/* Point critique */}
          <div className="flex gap-2.5 rounded-xl bg-emerald-50/70 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-[11.5px] leading-relaxed text-emerald-700">
              <span className="font-semibold">Règle d&apos;émission :</span> un billet
              n&apos;est émis qu&apos;après confirmation du paiement par le serveur TBM,
              sur la base du retour fiable de l&apos;opérateur. Aucun débit sans
              confirmation ne peut donner lieu à un billet.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--tbm-border)] px-6 py-4">
          <p className="text-[11px] text-[var(--tbm-text-muted)]">Aperçu de démonstration</p>
          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-xl bg-[#003B2D] px-4 text-[13px] font-semibold text-white hover:bg-[#002a20] hover:text-[#9BE000] shadow-sm transition-all"
            onClick={() => {
              toast({
                title: "Impression du reçu",
                description: `${txn.id} · ${formatFcfa(txn.montant)}`,
              });
              window.print();
            }}
          >
            <Printer className="h-4 w-4" />
            Imprimer le reçu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-neutral-200 pb-3">
      <span className="shrink-0 text-[12px] text-neutral-400">{label}</span>
      <span
        className={cn(
          "truncate text-right text-[12.5px] font-semibold text-neutral-800",
          mono && "font-mono text-[12px]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ===================== Résolution d'anomalie ===================== */

function ResolveAnomalyDialog({
  txn,
  open,
  onOpenChange,
}: {
  txn: Transaction;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const auteur = useAuthStore((s) => s.user?.name) ?? "Opérateur";
  const resolveAnomaly = useTbmStore((s) => s.resolveTransactionAnomaly);
  const [note, setNote] = useState("");
  const valid = note.trim().length >= 10;

  const submit = () => {
    if (!valid) return;
    resolveAnomaly(txn.id, note.trim(), auteur);
    toast({
      title: "Anomalie résolue",
      description: `${txn.id} — la résolution est tracée dans le journal d'audit.`,
    });
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[480px]">
        <DialogTitle className="text-[16px] font-bold text-neutral-900">
          Résoudre l&apos;anomalie — {txn.id}
        </DialogTitle>
        <DialogDescription className="text-[12.5px] leading-relaxed text-neutral-500">
          Paiement {formatFcfa(txn.montant)} débité ({txn.refOperateur}) sans billet
          émis. Justifiez la résolution : elle sera horodatée au journal d&apos;audit.
        </DialogDescription>

        <div className="mt-1 space-y-1.5">
          <Label htmlFor={`note-${txn.id}`} className="text-[12.5px] font-medium text-neutral-700">
            Justification de la résolution *
          </Label>
          <Textarea
            id={`note-${txn.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex. : Remboursement intégral effectué via Moov Money — réf. MM-2505-R10021 confirmée."
            className="min-h-[90px] rounded-xl border-[var(--tbm-border)] text-[13px] focus-visible:ring-[#9BE000]"
          />
          <p className="text-[11px] text-[var(--tbm-text-muted)]">
            Minimum 10 caractères. La transaction passe alors en « anomalie résolue »
            et le rapprochement du jour peut être clôturé.
          </p>
          {txn.id === "TXN-10244" && (
            <p className="rounded-lg bg-violet-50 px-3 py-2 text-[11.5px] leading-relaxed text-violet-700">
              💡 Une demande de remboursement <span className="font-semibold">RMB-030</span>{" "}
              (Moussa Traoré, 12 500 FCFA) est déjà ouverte dans l&apos;onglet
              Remboursements (A03) pour ce débit.
            </p>
          )}
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-xl border-[var(--tbm-border)] text-[13px]"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            disabled={!valid}
            className="h-9 gap-1.5 rounded-xl bg-[#003B2D] px-4 text-[13px] font-semibold text-white hover:bg-[#002a20] hover:text-[#9BE000] disabled:opacity-40"
            onClick={submit}
          >
            <ShieldCheck className="h-4 w-4 stroke-[2.5] text-[#9BE000]" />
            Enregistrer la résolution
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ========================= Fiche transaction ===================== */

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
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function TimelineBadge({ kind }: { kind: Transaction["timeline"][number]["type"] }) {
  const meta = PAYMENT_EVENT_META[kind];
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

function TransactionSheet({
  txn,
  open,
  onOpenChange,
  blocageMinutes,
}: {
  txn: Transaction | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  blocageMinutes: number;
}) {
  const { toast } = useToast();
  const auteur = useAuthStore((s) => s.user?.name) ?? "Opérateur";
  const confirmPending = useTbmStore((s) => s.confirmPendingPayment);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  if (!txn) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[560px]">
          <SheetTitle className="sr-only">Transaction {txn.id}</SheetTitle>
          <SheetDescription className="sr-only">
            Détail du paiement {txn.refOperateur} — {formatFcfa(txn.montant)} via {txn.operateur}.
          </SheetDescription>

          {/* En-tête */}
          <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white/95 px-6 pb-4 pt-5 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-mono text-[16px] font-bold tracking-tight text-neutral-900">
                    {txn.id}
                  </h3>
                  <StatusBadge statut={txn.statut} />
                  {txn.anomalie?.statut === "detectee" && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                      <ShieldAlert className="h-3 w-3" />
                      Débité sans billet
                    </span>
                  )}
                  {txn.anomalie?.statut === "resolue" && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                      <ShieldCheck className="h-3 w-3" />
                      Anomalie résolue
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12.5px] text-neutral-400">
                  {txn.date} · {txn.compagnie}
                </p>
              </div>
              <p className="shrink-0 text-[19px] font-black tracking-tight text-neutral-900">
                {formatFcfa(txn.montant)}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-xl border-neutral-200 text-[12.5px]"
                onClick={() => setReceiptOpen(true)}
              >
                <ReceiptText className="h-3.5 w-3.5" />
                Voir le reçu de paiement
              </Button>
              {txn.statut === "en_attente" && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 rounded-xl bg-coral-500 text-[12.5px] font-semibold text-white hover:bg-coral-600"
                  onClick={() => {
                    confirmPending(txn.id, auteur);
                    toast({
                      title: "Retour opérateur confirmé",
                      description: `${txn.id} — billets émis après confirmation serveur.`,
                    });
                  }}
                >
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Vérifier le retour opérateur
                </Button>
              )}
              {txn.anomalie?.statut === "detectee" && (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 rounded-xl bg-rose-500 text-[12.5px] font-semibold text-white hover:bg-rose-600"
                  onClick={() => setResolveOpen(true)}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Résoudre l&apos;anomalie
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6 px-6 py-5">
            {/* Informations */}
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                Informations de paiement
              </h4>
              <div className="mt-2.5 space-y-2.5 rounded-2xl border border-neutral-200/70 p-4">
                <InfoLine label="Réf. opérateur" value={txn.refOperateur} action={<CopyRef value={txn.refOperateur} />} mono />
                <InfoLine
                  label="Réservation"
                  value={txn.refReservation ?? "— aucune (paiement sans réservation finalisée)"}
                  mono={!!txn.refReservation}
                />
                <InfoLine label="Moyen de paiement" value={txn.operateur} badge={<OperatorBadge op={txn.operateur} />} />
                <InfoLine
                  label="Téléphone débité"
                  value={txn.telephone}
                  action={
                    <a
                      href={`tel:${txn.telephone.replace(/\s/g, "")}`}
                      className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11.5px] font-semibold text-coral-600 hover:bg-coral-50"
                      aria-label={`Appeler le ${txn.telephone}`}
                    >
                      <Phone className="h-3 w-3" />
                      Appeler
                    </a>
                  }
                />
                <InfoLine label="Compagnie" value={txn.compagnie} />
                <InfoLine
                  label="Relevé opérateur"
                  value={txn.releve ? "Présent dans le relevé du jour" : "Absent du relevé (aucun débit)"}
                />
                {txn.anomalie && (
                  <div
                    className={cn(
                      "rounded-xl p-3 text-[12px] leading-relaxed",
                      txn.anomalie.statut === "detectee"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-emerald-50 text-emerald-700"
                    )}
                  >
                    <span className="font-semibold">
                      {txn.anomalie.statut === "detectee" ? "Anomalie détectée : " : "Anomalie résolue : "}
                    </span>
                    {txn.anomalie.statut === "resolue"
                      ? txn.anomalie.resolution
                      : txn.anomalie.detail}
                    {txn.anomalie.statut === "resolue" && txn.anomalie.resoluPar && (
                      <span className="mt-1 block text-[11px] text-emerald-600">
                        Résolu par {txn.anomalie.resoluPar}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Chaîne critique */}
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                Chaîne de validation (point critique)
              </h4>
              <p className="mt-1 text-[11.5px] text-neutral-400">
                Un billet n&apos;est émis qu&apos;après la confirmation serveur, sur le
                retour fiable de l&apos;opérateur. Places bloquées {blocageMinutes} min
                avant annulation (RG1).
              </p>
              <div className="mt-3 rounded-2xl border border-neutral-200/70 p-4">
                <CriticalChain txn={txn} blocageMinutes={blocageMinutes} />
              </div>
            </section>

            {/* Historique */}
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                Historique des échanges ({txn.timeline.length})
              </h4>
              <ol className="mt-3 space-y-3.5">
                {txn.timeline.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-neutral-200" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <TimelineBadge kind={e.type} />
                        <span className="text-[11.5px] font-medium text-neutral-500">{e.date}</span>
                      </div>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-600">{e.detail}</p>
                      <p className="mt-0.5 text-[11px] text-neutral-400">{e.source}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <ReceiptDialog txn={txn} open={receiptOpen} onOpenChange={setReceiptOpen} />
      {txn.anomalie?.statut === "detectee" && (
        <ResolveAnomalyDialog txn={txn} open={resolveOpen} onOpenChange={setResolveOpen} />
      )}
    </>
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

/* ============================== Page ============================= */

export function TransactionsPage() {
  const { toast } = useToast();
  const auteur = useAuthStore((s) => s.user?.name) ?? "Opérateur";
  const transactions = useTbmStore((s) => s.transactions);
  const closedReconciliations = useTbmStore((s) => s.closedReconciliations);
  const closeReconciliation = useTbmStore((s) => s.closeReconciliation);
  const confirmPending = useTbmStore((s) => s.confirmPendingPayment);
  const settings = useTbmStore((s) => s.settings);
  const blocageMinutes = settings.blocageMinutes; // RG1 — paramétrage A04

  const [query, setQuery] = useState("");
  const [operator, setOperator] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [jour, setJour] = useState<string>("all");
  // Onglet + fiche détail synchronisés à l'URL (?tab=, ?sel=) — deep-linking
  const [tabParam, setTab] = useParamState("tab", "transactions");
  const tab = validParam(
    tabParam,
    ["transactions", "rapprochement", "anomalies"],
    "transactions"
  );
  const [selParam, setSel] = useParamState("sel", "");
  // La fiche dérive l'item du store par id (find) : statuts/badges toujours à jour
  const selected = selParam
    ? transactions.find((t) => t.id === selParam) ?? null
    : null;

  const jours = useMemo(
    () => Array.from(new Set(initialTransactions.map((t) => t.jour))),
    []
  );

  const filtered = useMemo(() => {
    const q = normalizeKey(query);
    return transactions.filter((t) => {
      const haystack = normalizeKey(
        [t.id, t.refOperateur, t.refReservation ?? "", t.telephone, t.compagnie].join(" ")
      );
      const matchQuery = q === "" || haystack.includes(q);
      const matchOperator = operator === "all" || t.operateur === operator;
      const matchStatus = status === "all" || t.statut === (status as PaymentStatus);
      const matchJour = jour === "all" || t.jour === jour;
      return matchQuery && matchOperator && matchStatus && matchJour;
    });
  }, [transactions, query, operator, status, jour]);

  /* ---- KPIs ---- */
  const encaisse = useMemo(
    () => transactions.filter((t) => t.statut === "reussi").reduce((s, t) => s + t.montant, 0),
    [transactions]
  );
  const nbEncaisse = transactions.filter((t) => t.statut === "reussi").length;
  const enAttente = transactions.filter((t) => t.statut === "en_attente").length;
  const anomaliesOuvertes = transactions.filter(
    (t) => t.anomalie?.statut === "detectee"
  ).length;

  const anomalyRows = useMemo(
    () => transactions.filter((t) => t.anomalie),
    [transactions]
  );

  const reconciliationRows = useMemo(() => {
    return operatorStatements.map((st) => {
      const side = transactions.filter(
        (t) =>
          t.jour === st.jour &&
          t.operateur === st.operateur &&
          (t.statut === "reussi" || t.statut === "rembourse")
      );
      const anomaliesJour = transactions.filter(
        (t) =>
          t.jour === st.jour &&
          t.operateur === st.operateur &&
          t.anomalie?.statut === "detectee"
      );
      const key = `${st.jour}|${st.operateur}`;
      const closed = closedReconciliations.includes(key);
      // La clôture n'est bloquée que par des anomalies ouvertes (débité sans billet
      // non résolu) — les écarts documentés au relevé sont indicatifs.
      const ecart = anomaliesJour.length > 0;
      const statut: "cloture" | "ecart" | "provisoire" | "conforme" = closed
        ? "cloture"
        : ecart
          ? "ecart"
          : st.jour === "Aujourd'hui"
            ? "provisoire"
            : "conforme";
      return {
        st,
        nbPlateforme: side.length,
        montantPlateforme: side.reduce((s, t) => s + t.montant, 0),
        anomalies: anomaliesJour,
        closed,
        ecart,
        statut,
        key,
      };
    });
  }, [transactions, closedReconciliations]);

  const ecartsRestants = reconciliationRows.filter((r) => r.statut === "ecart").length;
  const nbClotures = closedReconciliations.length;

  // Pagination des listes — hook partagé (reset à la page 1 quand filtres/onglet changent)
  const listPg = useTablePagination(filtered, {
    resetKey: [query, operator, status, jour, tab].join("|"),
  });
  const reconPg = useTablePagination(reconciliationRows, { resetKey: tab });
  const anomalyPg = useTablePagination(anomalyRows, { resetKey: tab });

  const openTxn = (t: Transaction) => setSel(t.id);

  /** Action immédiate de liste : confirme le retour opérateur (RG1 → émission). */
  const confirmRetour = (t: Transaction) => {
    confirmPending(t.id, auteur);
    toast({
      title: "Retour opérateur confirmé",
      description: `${t.id} — billets émis après confirmation serveur.`,
    });
  };

  /** Depuis le rapprochement : ouvre la liste des transactions du jour/opérateur. */
  const voirTransactionsDu = (j: string, op: Operator) => {
    setJour(j);
    setOperator(op);
    setTab("transactions");
  };

  const exportCsv = () => {
    const header =
      "Reference TBM;Ref operateur;Ref reservation;Date;Jour;Compagnie;Operateur;Telephone;Montant (FCFA);Statut;Billets emis;Present au releve;Anomalie";
    const rows = filtered.map((t) =>
      [
        t.id,
        t.refOperateur,
        t.refReservation ?? "",
        t.date,
        t.jour,
        t.compagnie,
        t.operateur,
        t.telephone,
        t.montant,
        PAYMENT_STATUS_META[t.statut].label,
        t.billetsEmis,
        t.releve ? "Oui" : "Non",
        t.anomalie
          ? t.anomalie.statut === "detectee"
            ? "Debite sans billet (detectee)"
            : "Debite sans billet (resolue)"
          : "",
      ].join(";")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tbm-paiements-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export CSV généré",
      description: `${filtered.length} transaction(s) exportée(s) — références opérateur, réservations et anomalies incluses.`,
    });
  };

  return (
    <div>
      {/* En-tête + action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#003B2D] text-[#9BE000]">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-[var(--tbm-text)] sm:text-[22px]">
              Paiements &amp; Transactions
            </h1>
            <p className="mt-0.5 text-[12px] text-[var(--tbm-text-muted)]">
              A02 — Orange Money et Moov Money : suivi, détection des débits sans billet, rapprochement quotidien et reçus.
            </p>
          </div>
        </div>
        <Button
          onClick={exportCsv}
          className="h-10 gap-2 rounded-xl bg-[#003B2D] px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-[#002a20] active:scale-[0.98] transition-all"
        >
          <Download className="h-4 w-4 stroke-[2.5] text-[#9BE000]" />
          Exporter CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi
          index={0}
          icon={ArrowLeftRight}
          label="Encaissé (réussi)"
          value={formatFcfa(encaisse)}
          hint={`${nbEncaisse} transaction${nbEncaisse > 1 ? "s" : ""} confirmée${nbEncaisse > 1 ? "s" : ""}`}
          tone="bg-[#eaf8e2] text-[var(--tbm-success)]"
        />
        <MiniKpi
          index={1}
          icon={Hourglass}
          label="En attente de retour"
          value={`${enAttente}`}
          hint={`places bloquées ${blocageMinutes} min (RG1)`}
          tone="bg-[#fef3c7] text-[var(--tbm-warning)]"
        />
        <MiniKpi
          index={2}
          icon={ShieldAlert}
          label="Débités sans billet"
          value={`${anomaliesOuvertes}`}
          hint={anomaliesOuvertes > 0 ? "à résoudre avant clôture" : "aucune anomalie ouverte"}
          tone={anomaliesOuvertes > 0 ? "bg-[#fee2e2] text-[var(--tbm-danger)]" : "bg-[#f1f5f9] text-[#64748b]"}
        />
        <MiniKpi
          index={3}
          icon={Scale}
          label="Rapprochement quotidien"
          value={ecartsRestants > 0 ? `${ecartsRestants} écart${ecartsRestants > 1 ? "s" : ""}` : "À jour"}
          hint={`${operatorStatements.length} relevés · ${nbClotures} clôturé${nbClotures > 1 ? "s" : ""}`}
          tone={ecartsRestants > 0 ? "bg-[#fee2e2] text-[var(--tbm-danger)]" : "bg-[#ede9fe] text-[#7c3aed]"}
        />
      </div>

      {/* Onglets — synchronisés au paramètre URL ?tab= */}
      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <div className="flex items-center">
          <TabsList className="h-auto p-1 rounded-xl border border-[var(--tbm-border)] bg-white/70 shadow-xs inline-flex gap-1">
            <TabsTrigger
              value="transactions"
              className="h-9 gap-2 rounded-lg px-4 text-[12.5px] font-semibold text-[var(--tbm-text-muted)] data-[state=active]:bg-[#003B2D] data-[state=active]:text-white shadow-none data-[state=active]:shadow-xs transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="rapprochement"
              className="h-9 gap-2 rounded-lg px-4 text-[12.5px] font-medium text-[var(--tbm-text-muted)] data-[state=active]:bg-[#003B2D] data-[state=active]:text-white shadow-none data-[state=active]:shadow-xs transition-colors"
            >
              <Scale className="h-4 w-4" />
              Rapprochement quotidien
              {ecartsRestants > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9.5px] font-bold text-white">
                  {ecartsRestants}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="anomalies"
              className="h-9 gap-2 rounded-lg px-4 text-[12.5px] font-medium text-[var(--tbm-text-muted)] data-[state=active]:bg-[#003B2D] data-[state=active]:text-white shadow-none data-[state=active]:shadow-xs transition-colors"
            >
              <ShieldAlert className="h-4 w-4" />
              Anomalies
              {anomaliesOuvertes > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9.5px] font-bold text-white">
                  {anomaliesOuvertes}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ------------------------- Transactions ------------------------ */}
        <TabsContent value="transactions" className="mt-4">
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tbm-text-muted)]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Réf. opérateur (OM-…, MM-…), réf. réservation, TXN, téléphone…"
                aria-label="Rechercher une transaction"
                className="h-10 rounded-xl border-[var(--tbm-border)] bg-white pl-9 text-[12.5px] text-[var(--tbm-text)] placeholder:text-[var(--tbm-text-muted)] focus-visible:ring-[#9BE000] shadow-xs"
              />
            </div>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger
                aria-label="Filtrer par opérateur"
                className="h-10 w-[150px] rounded-xl border-[var(--tbm-border)] bg-white text-[12.5px] text-[var(--tbm-text)] shadow-xs hover:border-[#003B2D]/40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[var(--tbm-border)]">
                <SelectItem value="all" className="rounded-lg text-[12.5px]">
                  Tous opérateurs
                </SelectItem>
                {OPERATORS.map((o) => (
                  <SelectItem key={o} value={o} className="rounded-lg text-[12.5px]">
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                aria-label="Filtrer par statut"
                className="h-10 w-[140px] rounded-xl border-[var(--tbm-border)] bg-white text-[12.5px] text-[var(--tbm-text)] shadow-xs hover:border-[#003B2D]/40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[var(--tbm-border)]">
                <SelectItem value="all" className="rounded-lg text-[12.5px]">
                  Tous statuts
                </SelectItem>
                {Object.entries(PAYMENT_STATUS_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key} className="rounded-lg text-[12.5px]">
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={jour} onValueChange={setJour}>
              <SelectTrigger
                aria-label="Filtrer par jour"
                className="h-10 w-[140px] rounded-xl border-[var(--tbm-border)] bg-white text-[12.5px] text-[var(--tbm-text)] shadow-xs hover:border-[#003B2D]/40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[var(--tbm-border)]">
                <SelectItem value="all" className="rounded-lg text-[12.5px]">
                  Tous les jours
                </SelectItem>
                {jours.map((j) => (
                  <SelectItem key={j} value={j} className="rounded-lg text-[12.5px]">
                    {j}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-[12px] font-medium text-[var(--tbm-text-muted)]">
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Tableau */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 overflow-hidden rounded-2xl border border-[var(--tbm-border)] bg-white shadow-xs"
          >
            <div className="ff-scrollbar overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[var(--tbm-border)] bg-[#F3F7F5]/80 hover:bg-transparent">
                    <TableHead className="h-11 pl-5 text-xs font-semibold text-[var(--tbm-text)]">
                      Référence
                    </TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-[var(--tbm-text)]">
                      Réservation
                    </TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-[var(--tbm-text)]">
                      Compagnie
                    </TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-[var(--tbm-text)]">
                      Montant
                    </TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-[var(--tbm-text)]">
                      Billets
                    </TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-[var(--tbm-text)]">
                      Statut
                    </TableHead>
                    <TableHead className="h-11 pr-5 text-right text-xs font-semibold text-[var(--tbm-text)]">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listPg.pageItems.map((t) => (
                    <TableRow
                      key={t.id}
                      className="cursor-pointer border-neutral-100 transition-colors hover:bg-neutral-50/70"
                      onClick={() => openTxn(t)}
                    >
                      <TableCell className="py-3.5 pl-5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[12.5px] font-semibold text-neutral-800">
                            {t.refOperateur}
                          </span>
                          <CopyRef value={t.refOperateur} />
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <OperatorBadge op={t.operateur} />
                          <span className="font-mono text-[10.5px] text-neutral-400">{t.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[12.5px]">
                        {t.refReservation ? (
                          <span className="font-mono font-semibold text-neutral-700">
                            {t.refReservation}
                          </span>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-[12.5px] font-medium text-neutral-600">{t.compagnie}</p>
                        <p className="text-[11px] text-neutral-400">{t.date}</p>
                      </TableCell>
                      <TableCell className="text-[13px] font-semibold tabular-nums text-neutral-800">
                        {formatFcfa(t.montant)}
                      </TableCell>
                      <TableCell>
                        {t.billetsEmis > 0 ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                            {t.billetsEmis} émis
                          </span>
                        ) : t.statut === "reussi" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                            <Ban className="h-3 w-3" />
                            0 émis
                          </span>
                        ) : (
                          <span className="text-[11.5px] text-neutral-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge statut={t.statut} />
                          {t.anomalie?.statut === "detectee" && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                              <ShieldAlert className="h-3 w-3" />
                              Sans billet
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center justify-end gap-1">
                          {t.statut === "en_attente" && (
                            <ActionIconButton
                              icon={RefreshCw}
                              tone="sky"
                              label="Vérifier le retour opérateur — confirme le débit et émet les billets"
                              onClick={() => confirmRetour(t)}
                            />
                          )}
                          {t.anomalie?.statut === "detectee" && (
                            <ActionIconButton
                              icon={Wrench}
                              tone="coral"
                              label="Résoudre l'anomalie (débité sans billet)"
                              onClick={() => openTxn(t)}
                            />
                          )}
                          <ActionIconButton
                            icon={Eye}
                            label="Voir la fiche de la transaction"
                            onClick={() => openTxn(t)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-[13px] text-neutral-400">
                        Aucune transaction ne correspond à ces critères.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              page={listPg.page}
              pageCount={listPg.pageCount}
              onPageChange={listPg.setPage}
              total={listPg.total}
              from={listPg.from}
              to={listPg.to}
              pageSize={listPg.pageSize}
              onPageSizeChange={listPg.setPageSize}
              entity="transaction"
            />
          </motion.section>
        </TabsContent>

        {/* ---------------------- Rapprochement -------------------------- */}
        <TabsContent value="rapprochement" className="mt-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200/70 bg-neutral-50/50 px-4 py-3">
            <Scale className="h-4 w-4 shrink-0 text-neutral-400" />
            <p className="text-[12.5px] leading-relaxed text-neutral-500">
              Rapprochement quotidien : chaque débit confirmé côté plateforme est
              confronté au relevé de l&apos;opérateur. La clôture est bloquée tant
              qu&apos;une anomalie « débité sans billet » reste ouverte.
            </p>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 overflow-hidden rounded-2xl border border-[var(--tbm-border)] bg-white shadow-xs"
          >
            <div className="ff-scrollbar overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[var(--tbm-border)] bg-[#F3F7F5]/80 hover:bg-transparent">
                    <TableHead className="h-11 pl-5 text-xs font-semibold text-[var(--tbm-text)]">
                      Jour · Opérateur
                    </TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-[var(--tbm-text)]">
                      Plateforme TBM
                    </TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-[var(--tbm-text)]">
                      Relevé opérateur
                    </TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-[var(--tbm-text)]">
                      Écarts
                    </TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-[var(--tbm-text)]">
                      Statut
                    </TableHead>
                    <TableHead className="h-11 pr-5 text-right text-xs font-semibold text-[var(--tbm-text)]">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconPg.pageItems.map((r) => (
                    <TableRow key={r.key} className="border-neutral-100 hover:bg-transparent">
                      <TableCell className="py-3.5 pl-5">
                        <p className="text-[13px] font-semibold text-neutral-800">{r.st.jour}</p>
                        <div className="mt-1">
                          <OperatorBadge op={r.st.operateur} />
                        </div>
                      </TableCell>
                      <TableCell className="text-[12.5px] text-neutral-600">
                        <span className="font-semibold tabular-nums text-neutral-800">
                          {formatFcfa(r.montantPlateforme)}
                        </span>
                        <span className="ml-1 text-neutral-400">
                          · {r.nbPlateforme} transaction{r.nbPlateforme > 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-[12.5px] text-neutral-600">
                        <span className="font-semibold tabular-nums text-neutral-800">
                          {formatFcfa(r.st.montantReleve)}
                        </span>
                        <span className="ml-1 text-neutral-400">
                          · {r.st.nbReleve} entrée{r.st.nbReleve > 1 ? "s" : ""}
                        </span>
                        <p className="text-[10.5px] text-neutral-400">Reçu : {r.st.recu}</p>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {r.st.ecarts.length === 0 && r.anomalies.length === 0 ? (
                          <span className="text-[11.5px] text-neutral-300">—</span>
                        ) : (
                          <div className="space-y-1.5">
                            {r.st.ecarts.map((e) => (
                              <div key={e.ref} className="flex items-start gap-1.5">
                                <span
                                  className={cn(
                                    "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                                    RECONCILIATION_ECART_META[e.type].className
                                  )}
                                >
                                  {RECONCILIATION_ECART_META[e.type].label}
                                </span>
                                <span className="font-mono text-[10.5px] text-neutral-500">{e.ref}</span>
                              </div>
                            ))}
                            {r.anomalies.map((a) => (
                              <div key={a.id} className="flex items-start gap-1.5">
                                <span className="inline-flex shrink-0 items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                                  Débité sans billet
                                </span>
                                <span className="font-mono text-[10.5px] text-neutral-500">
                                  {a.id}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.statut === "cloture" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Clôturé
                          </span>
                        )}
                        {r.statut === "ecart" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                            <ShieldAlert className="h-3 w-3" />
                            Écart détecté
                          </span>
                        )}
                        {r.statut === "provisoire" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                            <Clock className="h-3 w-3" />
                            Provisoire
                          </span>
                        )}
                        {r.statut === "conforme" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Conforme
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center justify-end gap-1">
                          <ActionIconButton
                            icon={Eye}
                            label={`Voir les transactions ${r.st.operateur} · ${r.st.jour}`}
                            onClick={() => voirTransactionsDu(r.st.jour, r.st.operateur)}
                          />
                          {!r.closed && (
                            <ActionIconButton
                              icon={ClipboardCheck}
                              tone="emerald"
                              disabled={r.ecart}
                              label={
                                r.ecart
                                  ? "Clôture bloquée — résolvez d'abord les anomalies « débité sans billet » de ce jour"
                                  : "Clôturer le rapprochement (tracé au journal d'audit)"
                              }
                              onClick={() => {
                                closeReconciliation(r.st.jour, r.st.operateur, auteur);
                                toast({
                                  title: "Rapprochement clôturé",
                                  description: `${r.st.operateur} · ${r.st.jour} — clôture tracée au journal d'audit.`,
                                });
                              }}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              page={reconPg.page}
              pageCount={reconPg.pageCount}
              onPageChange={reconPg.setPage}
              total={reconPg.total}
              from={reconPg.from}
              to={reconPg.to}
              pageSize={reconPg.pageSize}
              onPageSizeChange={reconPg.setPageSize}
              entity="ligne"
              entityPlural="lignes de rapprochement"
            />
          </motion.section>
        </TabsContent>

        {/* ------------------------ Anomalies ---------------------------- */}
        <TabsContent value="anomalies" className="mt-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200/70 bg-neutral-50/50 px-4 py-3">
            <ShieldAlert className="h-4 w-4 shrink-0 text-neutral-400" />
            <p className="text-[12.5px] leading-relaxed text-neutral-500">
              Détection des paiements débités sans ticket reçu : tout débit confirmé
              par l&apos;opérateur mais sans billet émis est isolé ici pour résolution
              (remboursement via A03 ou régularisation).
            </p>
          </div>

          <div className="mt-3 space-y-3">
            {anomalyRows.length === 0 && (
              <div className="ff-card flex items-center gap-3 rounded-2xl border border-neutral-200/70 bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-neutral-800">
                    Aucune anomalie de rapprochement
                  </p>
                  <p className="text-[12px] text-neutral-400">
                    Tous les paiements débités correspondent à des billets émis.
                  </p>
                </div>
              </div>
            )}
            {anomalyPg.pageItems.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "ff-card rounded-2xl border bg-white p-4 sm:p-5",
                    t.anomalie?.statut === "detectee"
                      ? "border-rose-200/80"
                      : "border-neutral-200/70 opacity-80"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[13.5px] font-bold text-neutral-900">
                          {t.id}
                        </span>
                        <span className="font-mono text-[11.5px] text-neutral-400">
                          {t.refOperateur}
                        </span>
                        {t.anomalie?.statut === "detectee" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            <ShieldAlert className="h-3 w-3" />
                            À traiter
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Résolue
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-600">
                        {t.anomalie?.statut === "resolue"
                          ? t.anomalie.resolution
                          : t.anomalie?.detail}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-neutral-400">
                        <span>{t.date}</span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {t.telephone}
                        </span>
                        <OperatorBadge op={t.operateur} />
                        <span className="font-semibold text-neutral-600">
                          {formatFcfa(t.montant)}
                        </span>
                      </div>
                      {t.anomalie?.statut === "resolue" && t.anomalie.resoluPar && (
                        <p className="mt-1.5 text-[11px] text-emerald-600">
                          Résolu par {t.anomalie.resoluPar}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {t.anomalie?.statut === "detectee" && (
                        <ActionIconButton
                          icon={Wrench}
                          tone="coral"
                          label="Résoudre l'anomalie — justification tracée au journal d'audit"
                          onClick={() => openTxn(t)}
                        />
                      )}
                      <ActionIconButton
                        icon={Eye}
                        label="Voir la fiche du paiement"
                        onClick={() => openTxn(t)}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            <TablePagination
              page={anomalyPg.page}
              pageCount={anomalyPg.pageCount}
              onPageChange={anomalyPg.setPage}
              total={anomalyPg.total}
              from={anomalyPg.from}
              to={anomalyPg.to}
              pageSize={anomalyPg.pageSize}
              onPageSizeChange={anomalyPg.setPageSize}
              entity="anomalie"
              entityPlural="anomalies"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Fiche détail + reçus + résolution — synchronisée à ?sel= */}
      <TransactionSheet
        txn={selected}
        open={selected != null}
        onOpenChange={(v) => {
          if (!v) setSel("");
        }}
        blocageMinutes={blocageMinutes}
      />
    </div>
  );
}
