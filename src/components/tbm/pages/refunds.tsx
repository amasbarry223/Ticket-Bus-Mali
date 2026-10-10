"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  HandCoins,
  Hourglass,
  Landmark,
  Lock,
  Phone,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Snowflake,
  UserCheck,
  X,
  XCircle,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useTbmStore } from "@/lib/tbm-store";
import { ActionIconButton } from "@/components/tbm/action-icon";
import { useParamState, validParam } from "@/lib/use-param-state";
import {
  formatFcfa,
  formatNumber,
  refundMontantRembourse,
  refundResteDu,
  REFUND_EVENT_META,
  REFUND_REASON_META,
  REFUND_STATUS_META,
  type Refund,
  type RefundEventKind,
  type RefundReason,
  type RefundStatus,
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

function operatorBadgeClass(op: Refund["operateur"]): string {
  return op === "Orange Money"
    ? "bg-orange-50 text-orange-600"
    : "bg-violet-100 text-violet-600";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Rôle d'un agent, déduit des événements de traçabilité de ses dossiers. */
function agentRoleFor(refunds: Refund[], name: string): string {
  for (const r of refunds) {
    const ev = r.historique.find(
      (e) =>
        e.par === name &&
        (e.type === "decision" || e.type === "prise_en_charge")
    );
    if (ev) return ev.role;
  }
  return "Agent TBM";
}

type DialogState =
  | { kind: "decide"; approuve: boolean }
  | { kind: "versement" }
  | { kind: "litige" }
  | { kind: "litige-resolu" }
  | null;

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
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium text-neutral-400">{label}</span>
        <span className="block truncate text-[15.5px] font-bold tracking-tight text-neutral-900">
          {value}
        </span>
        <span className="block truncate text-[11px] text-neutral-400">{hint}</span>
      </span>
    </motion.div>
  );
}

function StatusBadge({ statut }: { statut: RefundStatus }) {
  const meta = REFUND_STATUS_META[statut];
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

function ReasonBadge({ motif }: { motif: RefundReason }) {
  const meta = REFUND_REASON_META[motif];
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

function OperatorBadge({ op, className }: { op: Refund["operateur"]; className?: string }) {
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

function LitigePill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
      <Scale className="h-3 w-3" />
      Litige
    </span>
  );
}

/** Barre de progression « déjà remboursé / remboursable ». */
function RembourseProgress({ r, compact }: { r: Refund; compact?: boolean }) {
  const paid = refundMontantRembourse(r);
  const pct =
    r.montantRemboursable === 0
      ? 0
      : Math.min(100, Math.round((paid / r.montantRemboursable) * 100));
  return (
    <div className={compact ? "min-w-[120px]" : ""}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-sky-500" : "bg-neutral-200"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[10.5px] tabular-nums text-neutral-400">
        {formatNumber(paid)} / {formatNumber(r.montantRemboursable)} FCFA remboursés
      </p>
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
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
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

function EventBadge({ kind }: { kind: RefundEventKind }) {
  const meta = REFUND_EVENT_META[kind];
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

/* ========================= Fiche dossier ========================= */

function RefundSheet({
  refund,
  open,
  onOpenChange,
  refunds,
  isAdmin,
  plafond,
  canDecide,
  onClaim,
  onDecide,
  onVersement,
  onLitige,
  onLitigeResolu,
}: {
  refund: Refund | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  refunds: Refund[];
  isAdmin: boolean;
  plafond: number;
  canDecide: (montant: number) => boolean;
  onClaim: (r: Refund) => void;
  onDecide: (r: Refund, approuve: boolean) => void;
  onVersement: (r: Refund) => void;
  onLitige: (r: Refund) => void;
  onLitigeResolu: (r: Refund) => void;
}) {
  if (!refund) return null;
  const r = refund;
  const paid = refundMontantRembourse(r);
  const reste = refundResteDu(r);
  const gelé = r.litige?.ouvert ?? false;

  // Historique de l'agent en charge (spéc : « historique de l'agent ayant traité le dossier »)
  const agentCases = r.traitePar
    ? refunds.filter(
        (x) => x.traitePar === r.traitePar && x.statut !== "en_attente" && x.id !== r.id
      )
    : [];
  const agentVerse =
    r.traitePar
      ? refunds
          .flatMap((x) => x.versements)
          .filter((v) => v.par === r.traitePar)
          .reduce((s, v) => s + v.montant, 0)
      : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[600px]">
        <SheetTitle className="sr-only">Dossier {r.id}</SheetTitle>
        <SheetDescription className="sr-only">
          Remboursement de {r.passager} — {formatFcfa(r.montantRemboursable)} via {r.operateur}.
        </SheetDescription>

        {/* En-tête */}
        <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white/95 px-6 pb-4 pt-5 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-mono text-[16px] font-bold tracking-tight text-neutral-900">
                  {r.id}
                </h3>
                <StatusBadge statut={r.statut} />
                {gelé && <LitigePill />}
                {r.litige && !gelé && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                    <ShieldCheck className="h-3 w-3" />
                    Litige résolu
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12.5px] text-neutral-400">
                {r.passager} · demande {r.demande}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[19px] font-black tracking-tight text-neutral-900">
                {formatFcfa(r.montantRemboursable)}
              </p>
              <p className="text-[10.5px] text-neutral-400">remboursable</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {r.statut === "en_attente" && !r.traitePar && !gelé && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-xl border-sky-200 bg-sky-50 text-[12.5px] text-sky-700 hover:bg-sky-100"
                onClick={() => onClaim(r)}
              >
                <UserCheck className="h-3.5 w-3.5" />
                Prendre en charge
              </Button>
            )}
            {r.statut === "en_attente" && !gelé && (
              canDecide(r.montantRemboursable) ? (
                <>
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 rounded-xl bg-emerald-500 text-[12.5px] font-semibold text-white hover:bg-emerald-600"
                    onClick={() => onDecide(r, true)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Valider
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 rounded-xl border-rose-200 text-[12.5px] font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => onDecide(r, false)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Refuser
                  </Button>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-[11.5px] font-semibold text-neutral-500">
                  <Lock className="h-3.5 w-3.5" />
                  Validation administrateur requise (&gt; {formatNumber(plafond)} FCFA)
                </span>
              )
            )}
            {r.statut === "approuve" && reste > 0 && !gelé && (
              canDecide(reste) ? (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 rounded-xl bg-coral-500 text-[12.5px] font-semibold text-white hover:bg-coral-600"
                  onClick={() => onVersement(r)}
                >
                  <Banknote className="h-3.5 w-3.5" />
                  Enregistrer un versement
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-[11.5px] font-semibold text-neutral-500">
                  <Lock className="h-3.5 w-3.5" />
                  Versement réservé à l&apos;administration (&gt; {formatNumber(plafond)} FCFA)
                </span>
              )
            )}
            {!gelé && r.statut !== "rembourse" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-xl border-amber-200 bg-amber-50 text-[12.5px] font-semibold text-amber-700 hover:bg-amber-100"
                onClick={() => onLitige(r)}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Escalader en litige
              </Button>
            )}
            {gelé && isAdmin && (
              <Button
                size="sm"
                className="h-8 gap-1.5 rounded-xl bg-emerald-500 text-[12.5px] font-semibold text-white hover:bg-emerald-600"
                onClick={() => onLitigeResolu(r)}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Lever le litige
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Alerte litige */}
          {gelé && r.litige && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-[12.5px] font-bold text-rose-700">
                  Litige ouvert {r.litige.ouvertLe}
                  {r.litige.ouvertPar ? ` par ${r.litige.ouvertPar}` : ""} — dossier gelé
                </p>
              </div>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-rose-700/90">
                {r.litige.detail}
              </p>
              <p className="mt-1.5 text-[11.5px] text-rose-600/80">
                Aucune décision ni versement n&apos;est possible tant que le litige
                n&apos;est pas levé
                {isAdmin
                  ? "."
                  : " (résolution réservée à l'administration)."}
              </p>
            </div>
          )}
          {r.litige && !gelé && r.litige.resolution && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[12.5px] font-bold text-emerald-700">
                Litige résolu{r.litige.resoluPar ? ` par ${r.litige.resoluPar}` : ""}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-emerald-700/90">
                « {r.litige.resolution} »
              </p>
            </div>
          )}

          {/* Informations */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Informations du dossier
            </h4>
            <div className="mt-2.5 space-y-2.5 rounded-2xl border border-neutral-200/70 p-4">
              <InfoLine
                label="Transaction d'origine"
                value={r.transaction}
                mono
                action={<CopyRef value={r.transaction} />}
              />
              <InfoLine
                label="Réservation"
                value={r.refReservation ?? "— aucune (paiement sans réservation)"}
                mono={!!r.refReservation}
              />
              <InfoLine label="Opérateur" value="" badge={<OperatorBadge op={r.operateur} />} />
              <InfoLine
                label="Téléphone du compte"
                value={r.telephone}
                action={
                  <a
                    href={`tel:${r.telephone.replace(/\s/g, "")}`}
                    className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11.5px] font-semibold text-coral-600 hover:bg-coral-50"
                    aria-label={`Appeler le ${r.telephone}`}
                  >
                    <Phone className="h-3 w-3" />
                    Appeler
                  </a>
                }
              />
              <InfoLine label="Compagnie" value={r.compagnie} />
              <InfoLine label="Demande reçue" value={r.demande} />
            </div>
          </section>

          {/* Motif */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Motif de la demande
            </h4>
            <div className="mt-2.5 rounded-2xl border border-neutral-200/70 p-4">
              <ReasonBadge motif={r.motif} />
              <p className="mt-2 text-[11.5px] text-neutral-400">
                {REFUND_REASON_META[r.motif].description}
              </p>
              <p className="mt-2 rounded-xl bg-neutral-50 p-3 text-[12.5px] italic leading-relaxed text-neutral-600">
                « {r.motifDetail} »
              </p>
            </div>
          </section>

          {/* Montants & versements */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Montants & versements opérateur
            </h4>
            <div className="mt-2.5 space-y-4 rounded-2xl border border-neutral-200/70 p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-neutral-50 p-3">
                  <p className="text-[10.5px] font-medium uppercase tracking-wide text-neutral-400">Remboursable</p>
                  <p className="mt-0.5 text-[13.5px] font-bold tabular-nums text-neutral-900">
                    {formatNumber(r.montantRemboursable)}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50/70 p-3">
                  <p className="text-[10.5px] font-medium uppercase tracking-wide text-emerald-600/80">Déjà remboursé</p>
                  <p className="mt-0.5 text-[13.5px] font-bold tabular-nums text-emerald-700">
                    {formatNumber(paid)}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50/70 p-3">
                  <p className="text-[10.5px] font-medium uppercase tracking-wide text-amber-600/80">Reste dû</p>
                  <p className="mt-0.5 text-[13.5px] font-bold tabular-nums text-amber-700">
                    {formatNumber(reste)}
                  </p>
                </div>
              </div>
              <RembourseProgress r={r} />

              <div className="space-y-2">
                {r.versements.length === 0 ? (
                  <p className="rounded-xl bg-neutral-50 p-3 text-[12px] text-neutral-400">
                    {r.statut === "refuse"
                      ? "Aucun versement — dossier refusé."
                      : r.statut === "approuve"
                        ? "Aucun versement enregistré — exécution vers l'opérateur en attente."
                        : "Aucun versement — le dossier n'a pas encore été validé."}
                  </p>
                ) : (
                  r.versements.map((v) => (
                    <div
                      key={v.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50/60 px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                          <Banknote className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-bold tabular-nums text-neutral-800">
                            {formatFcfa(v.montant)}
                            <span className="ml-1.5 font-normal text-neutral-400">· {v.date}</span>
                          </p>
                          <p className="text-[11px] text-neutral-400">enregistré par {v.par}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-0.5 rounded-lg bg-white px-2 py-1 font-mono text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200/70">
                        {v.refOperateur}
                        <CopyRef value={v.refOperateur} />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Traitement & droits */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Traitement
            </h4>
            <div className="mt-2.5 space-y-2.5 rounded-2xl border border-neutral-200/70 p-4">
              <InfoLine
                label="Agent en charge"
                value={r.traitePar ?? "— non attribué"}
              />
              <InfoLine label="Décision" value={REFUND_STATUS_META[r.statut].label} />
              {r.justification && (
                <div className="rounded-xl bg-coral-50/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-600/80">
                    Justification obligatoire
                  </p>
                  <p className="mt-1 text-[12.5px] italic leading-relaxed text-neutral-600">
                    « {r.justification} »
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-400">— {r.traitePar}</p>
                </div>
              )}
              {!isAdmin && r.montantRemboursable > plafond && r.statut === "en_attente" && (
                <p className="rounded-xl bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-700">
                  Ce dossier dépasse votre plafond de traitement ({formatNumber(plafond)} FCFA).
                  Seule l&apos;administration peut le valider ou le refuser.
                </p>
              )}
            </div>
          </section>

          {/* Historique de l'agent en charge */}
          {r.traitePar && (
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                Historique de l&apos;agent
              </h4>
              <div className="mt-2.5 rounded-2xl border border-neutral-200/70 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral-100 text-[12px] font-bold text-coral-600">
                    {initials(r.traitePar)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-neutral-800">{r.traitePar}</p>
                    <p className="text-[11.5px] text-neutral-400">{agentRoleFor(refunds, r.traitePar)}</p>
                  </div>
                </div>
                <p className="mt-2.5 text-[12px] text-neutral-500">
                  {agentCases.length + 1} dossier{agentCases.length + 1 > 1 ? "s" : ""} traité
                  {agentCases.length + 1 > 1 ? "s" : ""} · {formatFcfa(agentVerse)} versé
                  {agentVerse > 1 ? "s" : ""} à ce jour
                </p>
                {agentCases.length > 0 && (
                  <div className="mt-3 max-h-44 space-y-1.5 overflow-y-auto ff-scrollbar border-t border-dashed border-neutral-100 pt-3">
                    {agentCases.map((x) => (
                      <div
                        key={x.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50"
                      >
                        <span className="min-w-0 truncate">
                          <span className="font-mono text-[11.5px] font-semibold text-neutral-600">{x.id}</span>
                          <span className="ml-2 text-[11.5px] text-neutral-400">{x.passager}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-[11.5px] font-semibold tabular-nums text-neutral-500">
                            {formatNumber(x.montantRemboursable)}
                          </span>
                          <StatusBadge statut={x.statut} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Historique du dossier (traçabilité complète) */}
          <section>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Historique du dossier ({r.historique.length})
            </h4>
            <p className="mt-1 text-[11.5px] text-neutral-400">
              Traçabilité complète : chaque action est signée par son auteur et tracée.
            </p>
            <ol className="mt-3 space-y-3.5">
              {[...r.historique].reverse().map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-neutral-200" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <EventBadge kind={e.type} />
                      <span className="text-[11.5px] font-medium text-neutral-500">{e.date}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-600">{e.detail}</p>
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

export function RefundsPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const auteur = user?.name ?? "Opérateur";
  const roleLabel = user?.role === "admin" ? "Administrateur TBM" : "Support TBM";
  const isAdmin = user?.role === "admin";

  const refunds = useTbmStore((s) => s.refunds);
  const claimRefund = useTbmStore((s) => s.claimRefund);
  const decideRefund = useTbmStore((s) => s.decideRefund);
  const addRefundVersement = useTbmStore((s) => s.addRefundVersement);
  const openRefundDispute = useTbmStore((s) => s.openRefundDispute);
  const resolveRefundDispute = useTbmStore((s) => s.resolveRefundDispute);
  // Paramètres métier (A04) : plafond de traitement du support — modifiable en direct
  const settings = useTbmStore((s) => s.settings);
  const plafond = settings.plafondSupportFcfa;

  const [query, setQuery] = useState("");
  const [statut, setStatut] = useState<string>("all");
  const [motif, setMotif] = useState<string>("all");
  const [litige, setLitige] = useState<string>("all");
  // Onglets + fiche détail synchronisés à l'URL (?tab=, ?sel=) — deep-linking
  const [tabParam, setTab] = useParamState("tab", "dossiers");
  const tab = validParam(tabParam, ["dossiers", "versements", "litiges"], "dossiers");
  const [selParam, setSel] = useParamState("sel", "");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [justification, setJustification] = useState("");
  const [versementMontant, setVersementMontant] = useState("");
  const [versementRef, setVersementRef] = useState("");
  const [litigeDetail, setLitigeDetail] = useState("");
  const [error, setError] = useState<string | null>(null);

  /** Droits : support limité au plafond du paramétrage, administration sans plafond. */
  const canDecide = (montant: number) => isAdmin || montant <= plafond;

  // La fiche dérive l'item du store par id (find) : statuts/versements toujours à jour
  const selected = selParam ? refunds.find((r) => r.id === selParam) ?? null : null;

  const filtered = useMemo(() => {
    const q = normalizeKey(query);
    return refunds.filter((r) => {
      if (statut !== "all" && r.statut !== statut) return false;
      if (motif !== "all" && r.motif !== motif) return false;
      if (litige === "ouvert" && !r.litige?.ouvert) return false;
      if (litige === "aucun" && r.litige?.ouvert) return false;
      if (q === "") return true;
      const hay = normalizeKey(
        [
          r.id,
          r.passager,
          r.telephone,
          r.transaction,
          r.refReservation ?? "",
          r.compagnie,
          ...r.versements.map((v) => v.refOperateur),
        ].join(" ")
      );
      return hay.includes(q);
    });
  }, [refunds, query, statut, motif, litige]);

  const pending = refunds.filter((r) => r.statut === "en_attente");
  const pendingTotal = pending.reduce((s, r) => s + r.montantRemboursable, 0);
  const approuves = refunds.filter((r) => r.statut === "approuve");
  const resteTotal = approuves.reduce((s, r) => s + refundResteDu(r), 0);
  const totalVerse = refunds.reduce((s, r) => s + refundMontantRembourse(r), 0);
  const soldes = refunds.filter((r) => r.statut === "rembourse").length;
  const litiges = refunds.filter((r) => r.litige?.ouvert);

  /** Liste aplatie des versements opérateur, tous dossiers confondus (onglet dédié). */
  const versementsFlat = useMemo(
    () => refunds.flatMap((r) => r.versements.map((v) => ({ v, r }))),
    [refunds]
  );
  const totalVersementsFlat = versementsFlat.reduce((s, x) => s + x.v.montant, 0);

  /** Onglet Litiges : dossiers avec litige ouvert OU résolu (ouverts en premier). */
  const dossiersLitige = useMemo(
    () =>
      refunds
        .filter((r) => r.litige)
        .sort((a, b) => Number(!!b.litige?.ouvert) - Number(!!a.litige?.ouvert)),
    [refunds]
  );

  const openDecide = (r: Refund, approuve: boolean) => {
    setSel(r.id);
    setDialog({ kind: "decide", approuve });
    setJustification("");
    setError(null);
  };
  const openVersement = (r: Refund) => {
    setSel(r.id);
    setDialog({ kind: "versement" });
    setVersementMontant(String(refundResteDu(r)));
    setVersementRef("");
    setError(null);
  };
  const openLitige = (r: Refund) => {
    setSel(r.id);
    setDialog({ kind: "litige" });
    setLitigeDetail("");
    setError(null);
  };
  const openLitigeResolu = (r: Refund) => {
    setSel(r.id);
    setDialog({ kind: "litige-resolu" });
    setLitigeDetail("");
    setError(null);
  };
  const closeDialog = () => {
    setDialog(null);
    setError(null);
  };

  const claim = (r: Refund) => {
    claimRefund(r.id, auteur, roleLabel);
    toast({
      title: "Dossier pris en charge",
      description: `${r.id} — vous êtes désormais en charge du traitement.`,
    });
  };

  const confirmDecide = () => {
    if (!selected || dialog?.kind !== "decide") return;
    if (justification.trim().length < 10) {
      setError(
        "Justification obligatoire (10 caractères minimum) — elle sera tracée au journal d'audit avec votre nom."
      );
      return;
    }
    decideRefund(selected.id, dialog.approuve, justification.trim(), auteur, roleLabel);
    toast({
      title: dialog.approuve ? "Remboursement validé" : "Remboursement refusé",
      description: `${selected.id} — décision tracée au journal d'audit (A06).`,
    });
    closeDialog();
  };

  const confirmVersement = () => {
    if (!selected || dialog?.kind !== "versement") return;
    const montant = Number(versementMontant.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(montant) || montant <= 0) {
      setError("Montant invalide — saisissez un montant supérieur à 0 FCFA.");
      return;
    }
    if (versementRef.trim().length < 4) {
      setError(
        "Référence opérateur obligatoire (4 caractères minimum) — elle prouve l'exécution du versement."
      );
      return;
    }
    const reste = refundResteDu(selected);
    const solde = montant >= reste;
    addRefundVersement(selected.id, montant, versementRef.trim(), auteur, roleLabel);
    toast({
      title: solde ? "Dossier soldé" : "Versement enregistré",
      description: `${selected.id} — ${formatFcfa(Math.min(montant, reste))} versés via ${selected.operateur} (réf. ${versementRef.trim()}).`,
    });
    closeDialog();
  };

  const confirmLitige = () => {
    if (!selected || dialog?.kind !== "litige") return;
    if (litigeDetail.trim().length < 10) {
      setError("Détail obligatoire (10 caractères minimum) — il sera tracé au journal d'audit.");
      return;
    }
    openRefundDispute(selected.id, litigeDetail.trim(), auteur, roleLabel);
    toast({
      title: "Litige ouvert",
      description: `${selected.id} — dossier gelé jusqu'à résolution administrative.`,
    });
    closeDialog();
  };

  const confirmLitigeResolu = () => {
    if (!selected || dialog?.kind !== "litige-resolu") return;
    if (litigeDetail.trim().length < 10) {
      setError("Résolution obligatoire (10 caractères minimum) — elle sera tracée au journal d'audit.");
      return;
    }
    resolveRefundDispute(selected.id, litigeDetail.trim(), auteur, roleLabel);
    toast({
      title: "Litige résolu",
      description: `${selected.id} — le dossier est dégelé, la décision reste à rendre.`,
    });
    closeDialog();
  };

  const exportCsv = () => {
    const header = [
      "Reference",
      "Passager",
      "Telephone",
      "Motif",
      "Transaction",
      "Reservation",
      "Operateur",
      "Compagnie",
      "Montant remboursable",
      "Deja rembourse",
      "Reste du",
      "Statut",
      "Litige",
      "Agent en charge",
      "Ref versement operateur",
      "Justification",
    ].join(";");
    const rows = filtered.map((r) =>
      [
        r.id,
        r.passager,
        r.telephone,
        REFUND_REASON_META[r.motif].label,
        r.transaction,
        r.refReservation ?? "",
        r.operateur,
        r.compagnie,
        r.montantRemboursable,
        refundMontantRembourse(r),
        refundResteDu(r),
        REFUND_STATUS_META[r.statut].label,
        r.litige?.ouvert ? "Ouvert" : r.litige ? "Resolu" : "",
        r.traitePar ?? "",
        r.versements.map((v) => v.refOperateur).join(" / "),
        r.justification ?? "",
      ]
        .map((c) => String(c).replace(/;/g, ","))
        .join(";")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tbm-remboursements-litiges.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export CSV généré",
      description: `${filtered.length} dossier(s) exporté(s) — montants, versements opérateur et litiges inclus.`,
    });
  };

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            Remboursements &amp; litiges
          </h2>
          <p className="mt-0.5 text-[12.5px] text-neutral-400">
            A03 — Traitement manuel des demandes, justification obligatoire, traçabilité complète.
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

      {/* Bandeau droits spécifiques */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-neutral-200/70 bg-neutral-50/60 px-4 py-3"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-neutral-600">
          <ShieldCheck className="h-4 w-4 text-coral-500" />
          {isAdmin ? "Vos droits (administration)" : "Vos droits (support)"} :
        </span>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-neutral-500">
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            {isAdmin
              ? "Traitement sans plafond de montant"
              : `Traitement jusqu'à ${formatNumber(plafond)} FCFA (paramétrage)`}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            {isAdmin
              ? "Levée des litiges"
              : "Escalade en litige (levée réservée à l'administration)"}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            Traçabilité complète au journal d&apos;audit (A06)
          </li>
        </ul>
      </motion.div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi
          icon={Clock}
          label="À traiter"
          value={`${pending.length} demande${pending.length > 1 ? "s" : ""}`}
          hint={`${formatFcfa(pendingTotal)} en jeu`}
          tone="bg-amber-100 text-amber-600"
        />
        <MiniKpi
          icon={Hourglass}
          label="Validés en cours"
          value={`${approuves.length} dossier${approuves.length > 1 ? "s" : ""}`}
          hint={`reste ${formatFcfa(resteTotal)} à verser`}
          tone="bg-sky-100 text-sky-600"
        />
        <MiniKpi
          icon={Banknote}
          label="Déjà remboursés"
          value={formatFcfa(totalVerse)}
          hint={`${soldes} dossier${soldes > 1 ? "s" : ""} soldé${soldes > 1 ? "s" : ""}`}
          tone="bg-emerald-100 text-emerald-600"
        />
        <MiniKpi
          icon={Scale}
          label="Litiges ouverts"
          value={`${litiges.length}`}
          hint="gelés jusqu'à résolution admin"
          tone="bg-rose-100 text-rose-600"
        />
      </div>

      {/* Onglets — synchronisés au paramètre URL ?tab= */}
      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className="h-10 w-full justify-start gap-1 overflow-x-auto rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-1 ff-scrollbar sm:w-auto">
          <TabsTrigger
            value="dossiers"
            className="h-8 gap-1.5 rounded-lg px-3.5 text-[12.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <HandCoins className="h-3.5 w-3.5" />
            Dossiers
            {pending.length > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9.5px] font-bold text-white">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="versements"
            className="h-8 gap-1.5 rounded-lg px-3.5 text-[12.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Landmark className="h-3.5 w-3.5" />
            Versements opérateur
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-200 px-1 text-[9.5px] font-bold text-neutral-600">
              {versementsFlat.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="litiges"
            className="h-8 gap-1.5 rounded-lg px-3.5 text-[12.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Scale className="h-3.5 w-3.5" />
            Litiges
            {litiges.length > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9.5px] font-bold text-white">
                {litiges.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* --------------------- Dossiers (liste) ---------------------- */}
        <TabsContent value="dossiers" className="mt-4">
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Réf., passager, téléphone, TXN, réservation…"
                aria-label="Rechercher un dossier de remboursement"
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
                <SelectItem value="all" className="rounded-lg text-[13px]">Tous statuts</SelectItem>
                {Object.entries(REFUND_STATUS_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key} className="rounded-lg text-[13px]">
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={motif} onValueChange={setMotif}>
              <SelectTrigger
                aria-label="Filtrer par motif"
                className="h-9 w-[170px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-100">
                <SelectItem value="all" className="rounded-lg text-[13px]">Tous motifs</SelectItem>
                {Object.entries(REFUND_REASON_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key} className="rounded-lg text-[13px]">
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={litige} onValueChange={setLitige}>
              <SelectTrigger
                aria-label="Filtrer par litige"
                className="h-9 w-[150px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-100">
                <SelectItem value="all" className="rounded-lg text-[13px]">Tous dossiers</SelectItem>
                <SelectItem value="ouvert" className="rounded-lg text-[13px]">Litiges ouverts</SelectItem>
                <SelectItem value="aucun" className="rounded-lg text-[13px]">Sans litige</SelectItem>
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
                    <TableHead className="h-11 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400">Réf.</TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Passager</TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Motif</TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Transaction</TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Montants</TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Statut</TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const gelé = r.litige?.ouvert ?? false;
                    const reste = refundResteDu(r);
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer border-neutral-100 align-top transition-colors hover:bg-neutral-50/70"
                        onClick={() => setSel(r.id)}
                      >
                        <TableCell className="py-3.5 pl-5">
                          <span className="block text-[13px] font-semibold tabular-nums text-neutral-700">{r.id}</span>
                          <span className="block text-[11px] text-neutral-400">{r.demande}</span>
                        </TableCell>
                        <TableCell className="max-w-[170px] pt-3.5">
                          <span className="block truncate text-[12.5px] font-medium text-neutral-700">{r.passager}</span>
                          <span className="block truncate text-[11px] text-neutral-400">{r.telephone}</span>
                        </TableCell>
                        <TableCell className="max-w-[210px] pt-3.5">
                          <ReasonBadge motif={r.motif} />
                          <span className="mt-1 block truncate text-[11.5px] text-neutral-400" title={r.motifDetail}>
                            {r.motifDetail}
                          </span>
                        </TableCell>
                        <TableCell className="pt-3.5">
                          <span className="block font-mono text-[12px] font-semibold text-neutral-600">{r.transaction}</span>
                          <span className="block text-[11px] text-neutral-400">
                            {r.refReservation ?? r.compagnie}
                          </span>
                        </TableCell>
                        <TableCell className="pt-3.5">
                          <span className="block text-[13px] font-semibold tabular-nums text-neutral-800">
                            {formatFcfa(r.montantRemboursable)}
                          </span>
                          {refundMontantRembourse(r) > 0 ? (
                            <RembourseProgress r={r} compact />
                          ) : (
                            <span className="block text-[11px] text-neutral-400">aucun versement</span>
                          )}
                        </TableCell>
                        <TableCell className="pt-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge statut={r.statut} />
                            {gelé && <LitigePill />}
                          </div>
                          <span className="mt-1 block max-w-[150px] truncate text-[11px] text-neutral-400">
                            {r.traitePar ? `par ${r.traitePar}` : "non attribué"}
                          </span>
                        </TableCell>
                        <TableCell className="pr-5 pt-3">
                          <div className="flex items-center justify-end gap-1">
                            {r.statut === "en_attente" ? (
                              gelé ? (
                                <ActionIconButton
                                  icon={Snowflake}
                                  disabled
                                  label="Dossier gelé — litige ouvert"
                                />
                              ) : canDecide(r.montantRemboursable) ? (
                                <>
                                  <ActionIconButton
                                    icon={Check}
                                    tone="emerald"
                                    label="Valider le remboursement"
                                    onClick={() => openDecide(r, true)}
                                  />
                                  <ActionIconButton
                                    icon={X}
                                    tone="rose"
                                    label="Refuser le remboursement"
                                    onClick={() => openDecide(r, false)}
                                  />
                                </>
                              ) : (
                                <ActionIconButton
                                  icon={Lock}
                                  disabled
                                  label="Admin requis — au-delà du plafond support"
                                />
                              )
                            ) : r.statut === "approuve" ? (
                              gelé ? (
                                <ActionIconButton
                                  icon={Snowflake}
                                  disabled
                                  label="Dossier gelé — litige ouvert"
                                />
                              ) : canDecide(reste) ? (
                                <ActionIconButton
                                  icon={Banknote}
                                  tone="coral"
                                  label="Enregistrer un versement opérateur"
                                  onClick={() => openVersement(r)}
                                />
                              ) : (
                                <ActionIconButton
                                  icon={Lock}
                                  disabled
                                  label="Admin requis — au-delà du plafond support"
                                />
                              )
                            ) : null}
                            <ActionIconButton
                              icon={Eye}
                              label={`Voir la fiche du dossier ${r.id}`}
                              onClick={() => setSel(r.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-[13px] text-neutral-400">
                        Aucun dossier ne correspond à ces filtres.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.section>
        </TabsContent>

        {/* ------------------ Versements opérateur --------------------- */}
        <TabsContent value="versements" className="mt-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200/70 bg-neutral-50/50 px-4 py-3">
            <Landmark className="h-4 w-4 shrink-0 text-neutral-400" />
            <p className="text-[12.5px] leading-relaxed text-neutral-500">
              Liste aplatie de tous les versements opérateur enregistrés, tous dossiers
              confondus — chaque tranche est prouvée par sa référence opérateur.
            </p>
            <span className="ml-auto text-[12px] font-semibold text-neutral-600">
              {versementsFlat.length} versement{versementsFlat.length > 1 ? "s" : ""} ·{" "}
              {formatFcfa(totalVersementsFlat)} versés
            </span>
          </div>

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
                      Date
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Dossier
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Montant
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Réf. opérateur
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Agent
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versementsFlat.map(({ v, r }) => (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer border-neutral-100 transition-colors hover:bg-neutral-50/70"
                      onClick={() => setSel(r.id)}
                    >
                      <TableCell className="py-3.5 pl-5 text-[12.5px] text-neutral-600">
                        {v.date}
                      </TableCell>
                      <TableCell>
                        <span className="block font-mono text-[12.5px] font-semibold text-neutral-800">
                          {r.id}
                        </span>
                        <span className="block text-[11px] text-neutral-400">
                          {r.passager} · {r.operateur}
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] font-semibold tabular-nums text-emerald-700">
                        {formatFcfa(v.montant)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 font-mono text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200/70">
                          {v.refOperateur}
                          <CopyRef value={v.refOperateur} />
                        </span>
                      </TableCell>
                      <TableCell className="text-[12.5px] text-neutral-600">
                        {v.par}
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center justify-end gap-1">
                          <ActionIconButton
                            icon={Eye}
                            label={`Voir la fiche du dossier ${r.id}`}
                            onClick={() => setSel(r.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {versementsFlat.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-[13px] text-neutral-400">
                        Aucun versement enregistré pour le moment — validez un dossier
                        puis enregistrez le versement opérateur.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.section>
        </TabsContent>

        {/* -------------------------- Litiges -------------------------- */}
        <TabsContent value="litiges" className="mt-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200/70 bg-neutral-50/50 px-4 py-3">
            <Scale className="h-4 w-4 shrink-0 text-neutral-400" />
            <p className="text-[12.5px] leading-relaxed text-neutral-500">
              Litiges ouverts (dossiers gelés) et litiges résolus — toute décision ou
              versement est suspendu jusqu&apos;à la levée du litige, réservée à
              l&apos;administration.
            </p>
          </div>

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
                      Dossier
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Motif
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Litige
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Détail / résolution
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiersLitige.map((r) => {
                    const l = r.litige!;
                    const ouvert = l.ouvert;
                    return (
                      <TableRow
                        key={r.id}
                        className={cn(
                          "cursor-pointer border-neutral-100 align-top transition-colors hover:bg-neutral-50/70",
                          ouvert && "bg-rose-50/40"
                        )}
                        onClick={() => setSel(r.id)}
                      >
                        <TableCell className="py-3.5 pl-5">
                          <span className="block font-mono text-[12.5px] font-semibold text-neutral-800">
                            {r.id}
                          </span>
                          <span className="block text-[11px] text-neutral-400">
                            {r.passager} · {r.telephone}
                          </span>
                        </TableCell>
                        <TableCell className="pt-3.5">
                          <ReasonBadge motif={r.motif} />
                        </TableCell>
                        <TableCell className="pt-3.5">
                          {ouvert ? (
                            <LitigePill />
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                              <ShieldCheck className="h-3 w-3" />
                              Litige résolu
                            </span>
                          )}
                          <span className="mt-1 block text-[11px] text-neutral-400">
                            {ouvert
                              ? `ouvert ${l.ouvertLe}${l.ouvertPar ? ` par ${l.ouvertPar}` : ""}`
                              : `ouvert ${l.ouvertLe}${l.resoluPar ? ` · levé par ${l.resoluPar}` : ""}`}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[300px] pt-3.5">
                          <span
                            className={cn(
                              "block truncate text-[12px]",
                              ouvert ? "text-rose-600" : "text-emerald-700"
                            )}
                            title={ouvert ? l.detail : l.resolution ?? l.detail}
                          >
                            {ouvert ? l.detail : l.resolution ?? l.detail}
                          </span>
                        </TableCell>
                        <TableCell className="pr-5 pt-3">
                          <div className="flex items-center justify-end gap-1">
                            {ouvert && isAdmin && (
                              <ActionIconButton
                                icon={ShieldCheck}
                                tone="emerald"
                                label="Lever le litige (résolution administrative)"
                                onClick={() => openLitigeResolu(r)}
                              />
                            )}
                            <ActionIconButton
                              icon={Eye}
                              label={`Voir la fiche du dossier ${r.id}`}
                              onClick={() => setSel(r.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {dossiersLitige.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-[13px] text-neutral-400">
                        Aucun litige — tous les dossiers sont traités sans blocage.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.section>
        </TabsContent>
      </Tabs>

      {/* Fiche dossier */}
      <RefundSheet
        refund={selected}
        open={selected != null}
        onOpenChange={(v) => {
          if (!v) setSel("");
        }}
        refunds={refunds}
        isAdmin={isAdmin}
        plafond={plafond}
        canDecide={canDecide}
        onClaim={claim}
        onDecide={openDecide}
        onVersement={openVersement}
        onLitige={openLitige}
        onLitigeResolu={openLitigeResolu}
      />

      {/* Dialog : décision (valider / refuser) */}
      <Dialog
        open={dialog?.kind === "decide" && selected != null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          {dialog?.kind === "decide" && selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[16px]">
                  {dialog.approuve ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      Valider le remboursement {selected.id}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-rose-500" />
                      Refuser le remboursement {selected.id}
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="text-[12.5px] leading-relaxed">
                  {selected.passager} — {formatFcfa(selected.montantRemboursable)} · Motif :{" "}
                  {REFUND_REASON_META[selected.motif].label}.
                  {dialog.approuve
                    ? " Après validation, enregistrez le(s) versement(s) opérateur avec la référence fournie par celui-ci."
                    : " Le voyageur sera informé du refus et de sa justification."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="justification" className="text-[13px]">
                  Justification <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                  placeholder="Ex. : délai d'annulation > 24 h, remboursement intégral conforme au palier RG5…"
                  className="rounded-xl border-neutral-200 text-[13px] focus-visible:ring-coral-200"
                />
                {error && (
                  <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-600">
                    {error}
                  </p>
                )}
                <p className="text-[11.5px] text-neutral-400">
                  La justification et votre nom ({auteur} · {roleLabel}) seront enregistrés au journal
                  d&apos;audit — traçabilité obligatoire.
                </p>
              </div>
              <DialogFooter className="gap-2 pt-1">
                <Button variant="outline" onClick={closeDialog} className="h-9 rounded-xl border-neutral-200 text-[13px]">
                  Annuler
                </Button>
                <Button
                  onClick={confirmDecide}
                  className={cn(
                    "h-9 rounded-xl text-[13px] font-medium text-white shadow-md active:scale-[0.98]",
                    dialog.approuve
                      ? "bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600"
                      : "bg-rose-500 shadow-rose-500/30 hover:bg-rose-600"
                  )}
                >
                  {dialog.approuve ? "Valider le remboursement" : "Confirmer le refus"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog : versement opérateur */}
      <Dialog
        open={dialog?.kind === "versement" && selected != null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          {dialog?.kind === "versement" && selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[16px]">
                  <Banknote className="h-5 w-5 text-coral-500" />
                  Enregistrer un versement — {selected.id}
                </DialogTitle>
                <DialogDescription className="text-[12.5px] leading-relaxed">
                  Reste dû : {formatFcfa(refundResteDu(selected))} — le versement s&apos;effectue via{" "}
                  {selected.operateur} vers le compte d&apos;origine ({selected.telephone}).
                  Un dossier versé au montant exact est automatiquement soldé.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="versement-montant" className="text-[13px]">
                    Montant versé (FCFA) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="versement-montant"
                    value={versementMontant}
                    onChange={(e) => setVersementMontant(e.target.value)}
                    inputMode="numeric"
                    className="h-9 rounded-xl border-neutral-200 text-[13px] tabular-nums focus-visible:ring-coral-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="versement-ref" className="text-[13px]">
                    Référence opérateur <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="versement-ref"
                    value={versementRef}
                    onChange={(e) => setVersementRef(e.target.value)}
                    placeholder={`Ex. : ${selected.operateur === "Orange Money" ? "OM-RMB-88125" : "MM-RMB-55210"}`}
                    className="h-9 rounded-xl border-neutral-200 font-mono text-[12.5px] focus-visible:ring-coral-200"
                  />
                </div>
                {error && (
                  <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-600">
                    {error}
                  </p>
                )}
                <p className="text-[11.5px] text-neutral-400">
                  Le versement et la référence opérateur seront tracés au journal d&apos;audit
                  avec votre nom ({auteur}).
                </p>
              </div>
              <DialogFooter className="gap-2 pt-1">
                <Button variant="outline" onClick={closeDialog} className="h-9 rounded-xl border-neutral-200 text-[13px]">
                  Annuler
                </Button>
                <Button
                  onClick={confirmVersement}
                  className="h-9 rounded-xl bg-coral-500 text-[13px] font-medium text-white shadow-md shadow-coral-500/30 hover:bg-coral-600 active:scale-[0.98]"
                >
                  Enregistrer le versement
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog : escalade en litige */}
      <Dialog
        open={dialog?.kind === "litige" && selected != null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          {dialog?.kind === "litige" && selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[16px]">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Escalader {selected.id} en litige
                </DialogTitle>
                <DialogDescription className="text-[12.5px] leading-relaxed">
                  Le dossier sera immédiatement gelé : plus aucune décision ni versement ne sera
                  possible jusqu&apos;à la levée du litige, réservée à l&apos;administration.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="litige-detail" className="text-[13px]">
                  Motif du litige <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="litige-detail"
                  value={litigeDetail}
                  onChange={(e) => setLitigeDetail(e.target.value)}
                  rows={3}
                  placeholder="Ex. : la compagnie conteste le double débit, preuves contradictoires entre relevé et capture client…"
                  className="rounded-xl border-neutral-200 text-[13px] focus-visible:ring-coral-200"
                />
                {error && (
                  <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-600">
                    {error}
                  </p>
                )}
                <p className="text-[11.5px] text-neutral-400">
                  L&apos;escalade sera tracée au journal d&apos;audit avec votre nom ({auteur}).
                </p>
              </div>
              <DialogFooter className="gap-2 pt-1">
                <Button variant="outline" onClick={closeDialog} className="h-9 rounded-xl border-neutral-200 text-[13px]">
                  Annuler
                </Button>
                <Button
                  onClick={confirmLitige}
                  className="h-9 rounded-xl bg-rose-500 text-[13px] font-medium text-white shadow-md shadow-rose-500/30 hover:bg-rose-600 active:scale-[0.98]"
                >
                  Ouvrir le litige
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog : lever le litige (admin) */}
      <Dialog
        open={dialog?.kind === "litige-resolu" && selected != null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          {dialog?.kind === "litige-resolu" && selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-[16px]">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  Lever le litige — {selected.id}
                </DialogTitle>
                <DialogDescription className="text-[12.5px] leading-relaxed">
                  Litige ouvert {selected.litige?.ouvertLe}
                  {selected.litige?.ouvertPar ? ` par ${selected.litige.ouvertPar}` : ""} : «{" "}
                  {selected.litige?.detail} » La levée du litige dégèle le dossier ; la décision de
                  remboursement reste ensuite à rendre.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="litige-resolution" className="text-[13px]">
                  Résolution administrative <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="litige-resolution"
                  value={litigeDetail}
                  onChange={(e) => setLitigeDetail(e.target.value)}
                  rows={3}
                  placeholder="Ex. : double débit confirmé au relevé Orange Money du 05/10 — remboursement du second versement dû."
                  className="rounded-xl border-neutral-200 text-[13px] focus-visible:ring-coral-200"
                />
                {error && (
                  <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-600">
                    {error}
                  </p>
                )}
                <p className="text-[11.5px] text-neutral-400">
                  La résolution et votre nom ({auteur} · {roleLabel}) seront tracés au journal
                  d&apos;audit.
                </p>
              </div>
              <DialogFooter className="gap-2 pt-1">
                <Button variant="outline" onClick={closeDialog} className="h-9 rounded-xl border-neutral-200 text-[13px]">
                  Annuler
                </Button>
                <Button
                  onClick={confirmLitigeResolu}
                  className="h-9 rounded-xl bg-emerald-500 text-[13px] font-medium text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600 active:scale-[0.98]"
                >
                  Lever le litige
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
