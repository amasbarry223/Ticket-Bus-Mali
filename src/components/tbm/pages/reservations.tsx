"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CircleSlash,
  ClipboardList,
  Copy,
  Check,
  Eye,
  Hourglass,
  Phone,
  QrCode,
  ScanLine,
  Search,
  Smartphone,
  Store,
  Ticket as TicketIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { useTbmStore } from "@/lib/tbm-store";
import { ActionIconButton } from "@/components/tbm/action-icon";
import { useParamState, validParam } from "@/lib/use-param-state";
import {
  companyDepartures,
  companyInitials,
  companyLogoColor,
  formatFcfa,
  formatNumber,
  RESERVATION_STATUS_META,
  SCAN_KIND_META,
  TICKET_STATUS_META,
  reservations,
  type Company,
  type Departure,
  type Reservation,
  type ReservationStatus,
  type ScanEvent,
  type ScanKind,
  type Settings,
  type Ticket as TicketModel,
  type TicketStatus,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";

/* ============================ Helpers ============================ */

/** Normalise une chaîne pour la recherche : minuscules, sans espaces/tirets/points. */
function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[\s.\-+()]/g, "");
}

/** Empreinte de recherche d'une réservation : référence, téléphone, billets, passagers. */
function searchKey(r: Reservation): string {
  return normalizeKey(
    [
      r.id,
      r.telephone,
      ...r.tickets.map((t) => t.id),
      ...r.tickets.map((t) => t.passager.nom),
    ].join(" ")
  );
}

function tarifsTotal(r: Reservation): number {
  return r.tickets.reduce((a, t) => a + t.tarif, 0);
}

/** Frais de service facturés sur la réservation (paramétrage A04). */
function serviceFees(r: Reservation, settings: Settings): number {
  if (r.tickets.length === 0) return 0;
  return settings.fraisMode === "fixe"
    ? settings.fraisValeur * r.tickets.length
    : Math.round((tarifsTotal(r) * settings.fraisValeur) / 100);
}

function reservationTotal(r: Reservation, settings: Settings): number {
  return tarifsTotal(r) + serviceFees(r, settings);
}

/* Onglets page-level (paramètre d'URL ?tab=) + billets aplatis. */
const RES_TABS = ["reservations", "billets"] as const;

/** Ligne aplatie de l'onglet « Billets & contrôles » : un billet + son contexte. */
interface TicketRow {
  res: Reservation;
  ticket: TicketModel;
  dep: Departure | null;
}

/**
 * Dernier ScanEvent pertinent pour un billet : dérivé du statut du billet
 * (annulation/expiration pour un annulé, embarquement/contrôle pour un
 * utilisé, émission/paiement pour un émis), avec repli sur le dernier
 * événement de la réservation.
 */
function lastScanFor(r: Reservation, t: TicketModel): ScanEvent | null {
  if (r.historique.length === 0) return null;
  const kinds: ScanKind[] =
    t.statut === "annule"
      ? ["annulation", "expiration"]
      : t.statut === "utilise"
        ? ["scan_embarquement", "controle"]
        : ["emission", "paiement"];
  for (let i = r.historique.length - 1; i >= 0; i--) {
    if (kinds.includes(r.historique[i].type)) return r.historique[i];
  }
  return r.historique[r.historique.length - 1];
}

/** Premier billet ouvrable au QR d'une réservation (non annulé), sinon null. */
function firstActiveTicket(r: Reservation): TicketModel | null {
  return r.tickets.find((t) => t.statut !== "annule") ?? null;
}

const PASSENGER_TINTS = [
  "bg-coral-100 text-coral-600",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-600",
  "bg-violet-100 text-violet-600",
  "bg-sky-100 text-sky-600",
  "bg-rose-100 text-rose-600",
];

function passengerTint(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PASSENGER_TINTS[h % PASSENGER_TINTS.length];
}

function passengerInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ============================ Pièces communes ============================ */

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  index,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "coral" | "amber" | "emerald" | "rose";
  index: number;
}) {
  const tones: Record<string, string> = {
    coral: "group-hover:bg-coral-50 group-hover:text-coral-500",
    amber: "group-hover:bg-amber-50 group-hover:text-amber-600",
    emerald: "group-hover:bg-emerald-50 group-hover:text-emerald-600",
    rose: "group-hover:bg-rose-50 group-hover:text-rose-600",
  };
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.05 + index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group ff-card rounded-2xl border border-neutral-200/70 bg-white p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[12.5px] font-medium text-neutral-500">{label}</h3>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 transition-colors duration-300",
            tones[tone]
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2.5 text-[21px] font-bold leading-none tracking-tight text-neutral-900">
        {value}
      </p>
      <p className="mt-1.5 text-[11.5px] text-neutral-400">{hint}</p>
    </motion.article>
  );
}

function ResStatusBadge({ statut }: { statut: ReservationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold",
        RESERVATION_STATUS_META[statut].className
      )}
    >
      {statut === "en_attente" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      )}
      {RESERVATION_STATUS_META[statut].label}
    </span>
  );
}

function TicketStatusBadge({ statut }: { statut: TicketStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        TICKET_STATUS_META[statut].className
      )}
    >
      {TICKET_STATUS_META[statut].label}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
      {children}
    </h4>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50/70 px-3 py-2.5 ring-1 ring-neutral-200/60">
      <span className="shrink-0 text-[11.5px] text-neutral-400">{label}</span>
      <span className="truncate text-[12.5px] font-medium text-neutral-700">
        {value}
      </span>
    </div>
  );
}

/** Pile d'avatars passagers (3 max) + libellé. */
function PassengerStack({ res }: { res: Reservation }) {
  const shown = res.tickets.slice(0, 3);
  const rest = res.tickets.length - shown.length;
  const first = res.tickets[0]?.passager;

  if (res.tickets.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-neutral-400">
        <span className="h-6 w-6 rounded-full bg-neutral-100 ring-1 ring-neutral-200" />
        {res.statut === "en_attente" ? "Places bloquées" : "Aucun billet"}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="flex -space-x-1.5">
        {shown.map((t) => (
          <span
            key={t.id}
            title={`${t.passager.nom} · ${t.passager.siege}`}
            aria-hidden="true"
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[8.5px] font-bold ring-2 ring-white",
              passengerTint(t.passager.nom)
            )}
          >
            {passengerInitials(t.passager.nom)}
          </span>
        ))}
      </span>
      <span className="min-w-0">
        <span className="block max-w-[150px] truncate text-[12.5px] font-medium text-neutral-700">
          {first?.nom}
          {res.tickets.length > 1 && (
            <span className="text-neutral-400"> +{res.tickets.length - 1}</span>
          )}
        </span>
      </span>
    </div>
  );
}

/** Grille pseudo-QR déterministe (démo frontend) — pure, calculée hors rendu. */
function buildQrGrid(seed: string): boolean[][] {
  const n = 21;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
  const grid: boolean[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => rand() > 0.52)
  );
  const finder = (ox: number, oy: number) => {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const gx = ox + x;
        const gy = oy + y;
        if (gx < 0 || gy < 0 || gx >= n || gy >= n) continue;
        const edge = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[gy][gx] =
          x === -1 || x === 7 || y === -1 || y === 7 ? false : edge || core;
      }
    }
  };
  finder(0, 0);
  finder(14, 0);
  finder(0, 14);
  return grid;
}

/** Pseudo-QR déterministe (démo frontend) — grille 21×21 avec motifs de repérage. */
function QrCodeSvg({
  seed,
  className,
}: {
  seed: string;
  className?: string;
}) {
  const cells = useMemo(() => buildQrGrid(seed), [seed]);

  return (
    <svg
      viewBox="0 0 21 21"
      role="img"
      aria-label="QR code du billet (démo)"
      className={cn("h-full w-full", className)}
    >
      <rect width="21" height="21" fill="#ffffff" />
      {cells.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill="#171717"
              rx="0.22"
            />
          ) : null
        )
      )}
    </svg>
  );
}

/** Timeline de l'historique des scans et validations. */
function ScanTimeline({ events }: { events: ScanEvent[] }) {
  return (
    <ol className="relative ml-1.5 space-y-0 border-l border-neutral-200 pl-5">
      {events.map((e) => {
        const meta = SCAN_KIND_META[e.type];
        return (
          <li key={e.id} className="relative pb-5 last:pb-0">
            <span
              aria-hidden="true"
              className={cn(
                "absolute -left-[25.5px] top-1 h-2.5 w-2.5 rounded-full ring-4",
                e.type === "annulation"
                  ? "bg-rose-500 ring-rose-100"
                  : e.type === "expiration"
                    ? "bg-neutral-400 ring-neutral-100"
                    : e.type === "paiement"
                      ? "bg-emerald-500 ring-emerald-100"
                      : e.type === "controle"
                        ? "bg-violet-500 ring-violet-100"
                        : "bg-coral-400 ring-coral-100"
              )}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                  meta.className
                )}
              >
                {meta.label}
              </span>
              <span className="ml-auto text-[11px] tabular-nums text-neutral-400">
                {e.date}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-600">
              {e.detail}
            </p>
            <p className="mt-0.5 text-[10.5px] text-neutral-400">{e.agent}</p>
          </li>
        );
      })}
    </ol>
  );
}

/** Tampon diagonal du billet (ANNULÉ / VALIDÉ). */
function TicketStamp({ statut }: { statut: TicketStatus }) {
  if (statut === "emis") return null;
  const config =
    statut === "annule"
      ? { label: "ANNULÉ", cls: "border-rose-400 text-rose-500 bg-rose-50/80" }
      : { label: "VALIDÉ", cls: "border-emerald-400 text-emerald-500 bg-emerald-50/80" };
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-lg border-2 px-4 py-1.5 text-[15px] font-black tracking-[0.2em]",
        config.cls
      )}
    >
      {config.label}
    </span>
  );
}

/* ============================ Fiche réservation ============================ */

function ReservationSheet({
  res,
  companyName,
  settings,
  onOpenTicket,
  onClose,
}: {
  res: Reservation | null;
  companyName: string;
  settings: Settings;
  onOpenTicket: (ticket: TicketModel) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const dep = useMemo(
    () => (res ? companyDepartures.find((d) => d.id === res.departId) ?? null : null),
    [res]
  );
  const tarifs = res ? tarifsTotal(res) : 0;
  const fees = res ? serviceFees(res, settings) : 0;
  const total = res ? reservationTotal(res, settings) : 0;
  const used = res?.tickets.filter((t) => t.statut === "utilise").length ?? 0;
  const cancelled = res?.tickets.filter((t) => t.statut === "annule").length ?? 0;
  const issued = (res?.tickets.length ?? 0) - used - cancelled;

  const copyRef = async () => {
    if (!res) return;
    try {
      await navigator.clipboard.writeText(res.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // presse-papier indisponible — ignorer silencieusement (démo)
    }
  };

  return (
    <Sheet open={!!res} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="ff-scrollbar w-full gap-0 overflow-y-auto p-0 sm:max-w-[620px]"
      >
        {res && (
          <>
            {/* ---- En-tête ---- */}
            <div className="border-b border-neutral-100 px-5 pb-4 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <SheetTitle className="text-[19px] font-bold tracking-tight tabular-nums text-neutral-900">
                      {res.id}
                    </SheetTitle>
                    <ResStatusBadge statut={res.statut} />
                  </div>
                  <SheetDescription className="sr-only">
                    Fiche de la réservation {res.id} — {dep?.trajet ?? ""} du{" "}
                    {dep?.jour ?? ""} à {dep?.heure ?? ""}.
                  </SheetDescription>
                  <p className="mt-1 text-[13.5px] font-semibold text-neutral-800">
                    {dep?.trajet ?? "Départ introuvable"}
                  </p>
                  <p className="mt-0.5 text-[12px] text-neutral-400">
                    {dep ? `${dep.jour} · ${dep.heure}` : "—"}
                    {dep?.plateforme && ` · Plateforme ${dep.plateforme}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyRef}
                  className="h-8 rounded-lg border-neutral-200 text-[12px] text-neutral-600 shadow-none hover:border-neutral-300 hover:text-neutral-800"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copiée" : "Copier la référence"}
                </Button>
              </div>

              {/* ---- Alertes contexte support ---- */}
              {res.statut === "annulee" && res.motif && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2 ring-1 ring-rose-200/70">
                  <CircleSlash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                  <p className="text-[12px] font-medium leading-relaxed text-rose-700">
                    Réservation annulée — {res.motif}
                  </p>
                </div>
              )}
              {res.statut === "expiree" && res.motif && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-neutral-100 px-3 py-2 ring-1 ring-neutral-200">
                  <Hourglass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" />
                  <p className="text-[12px] font-medium leading-relaxed text-neutral-600">
                    Réservation expirée — {res.motif}
                  </p>
                </div>
              )}
              {res.statut === "en_attente" && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200/70">
                  <Hourglass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <p className="text-[12px] font-medium leading-relaxed text-amber-700">
                    Paiement en attente — places bloquées pendant{" "}
                    {settings.blocageMinutes} min (RG1) à partir de {res.creee}.
                    Aucun billet émis pour l’instant.
                  </p>
                </div>
              )}
              {res.statut === "confirmee" &&
                dep?.statut === "retarde" &&
                dep.retardMinutes && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200/70">
                    <Hourglass className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <p className="text-[12px] font-medium leading-relaxed text-amber-700">
                      Départ retardé de {dep.retardMinutes} min — prévenez le
                      voyageur : nouvelle heure estimée{" "}
                      {shiftTime(dep.heure, dep.retardMinutes)}.
                    </p>
                  </div>
                )}
            </div>

            {/* ---- Corps ---- */}
            <div className="space-y-5 px-5 pb-8 pt-4">
              <section className="grid gap-2 sm:grid-cols-2">
                <InfoRow
                  label="Téléphone"
                  value={
                    <a
                      href={`tel:${res.telephone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-1.5 text-coral-600 transition-colors hover:text-coral-500"
                    >
                      <Phone className="h-3 w-3" aria-hidden="true" />
                      {res.telephone}
                    </a>
                  }
                />
                <InfoRow
                  label="Canal"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      {res.canal === "en_ligne" ? (
                        <Smartphone className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
                      ) : (
                        <Store className="h-3.5 w-3.5 text-neutral-400" aria-hidden="true" />
                      )}
                      {res.canal === "en_ligne" ? "En ligne" : "Guichet"}
                    </span>
                  }
                />
                <InfoRow
                  label="Paiement"
                  value={
                    res.operateur
                      ? res.operateur
                      : res.canal === "guichet"
                        ? "Espèces (guichet)"
                        : "—"
                  }
                />
                <InfoRow label="Créée le" value={res.creee} />
                <InfoRow label="Bus affecté" value={dep?.bus ?? "—"} />
                <InfoRow label="Compagnie" value={companyName || "—"} />
              </section>

              {/* ---- Billets & passagers ---- */}
              <section>
                <div className="flex items-center justify-between">
                  <SectionTitle>
                    Passagers &amp; billets ({res.tickets.length})
                  </SectionTitle>
                  {res.tickets.length > 0 && (
                    <span className="text-[11.5px] text-neutral-400">
                      {issued} émis · {used} utilisé{used > 1 ? "s" : ""} ·{" "}
                      {cancelled} annulé{cancelled > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {res.tickets.length === 0 ? (
                  <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-dashed border-neutral-200 px-3.5 py-3">
                    <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" />
                    <p className="text-[12px] text-neutral-400">
                      {res.statut === "en_attente"
                        ? "Aucun billet — les billets seront émis après confirmation du paiement."
                        : "Aucun billet n’a été émis pour cette réservation."}
                    </p>
                  </div>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {res.tickets.map((t) => (
                      <li
                        key={t.id}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border border-neutral-200/70 px-3.5 py-2.5",
                          t.statut === "annule" && "opacity-60"
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold",
                            passengerTint(t.passager.nom)
                          )}
                        >
                          {passengerInitials(t.passager.nom)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-[12.5px] font-semibold text-neutral-800">
                              {t.passager.nom}
                            </span>
                            {t.passager.type === "enfant" && (
                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                                Enfant
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] tabular-nums text-neutral-400">
                            {t.id} · siège {t.passager.siege} ·{" "}
                            {formatFcfa(t.tarif)}
                          </span>
                        </span>
                        <TicketStatusBadge statut={t.statut} />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onOpenTicket(t)}
                          aria-label={`Voir le billet électronique de ${t.passager.nom}`}
                          className="h-8 w-8 shrink-0 rounded-lg border-neutral-200 text-neutral-500 shadow-none hover:border-coral-300 hover:text-coral-600"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ---- Montant ---- */}
              {res.tickets.length > 0 && (
                <section>
                  <SectionTitle>Montant</SectionTitle>
                  <div className="mt-2 rounded-2xl border border-neutral-200/70 p-4">
                    <dl className="space-y-1.5 text-[12.5px]">
                      <div className="flex items-center justify-between">
                        <dt className="text-neutral-400">Billets</dt>
                        <dd className="font-medium tabular-nums text-neutral-700">
                          {formatFcfa(tarifs)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-neutral-400">
                          Frais de service (
                          {settings.fraisMode === "fixe"
                            ? `${settings.fraisValeur} FCFA / billet`
                            : `${settings.fraisValeur} %`}
                          )
                        </dt>
                        <dd className="font-medium tabular-nums text-neutral-700">
                          {formatFcfa(fees)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-2">
                        <dt className="font-semibold text-neutral-600">Total</dt>
                        <dd className="text-[14px] font-bold tabular-nums text-neutral-900">
                          {formatFcfa(total)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </section>
              )}

              {/* ---- Historique des scans & validations ---- */}
              <section>
                <SectionTitle>
                  Historique des scans &amp; validations ({res.historique.length})
                </SectionTitle>
                <div className="mt-3">
                  {res.historique.length === 0 ? (
                    <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-neutral-200 px-3.5 py-3">
                      <ScanLine className="h-4 w-4 shrink-0 text-neutral-300" />
                      <p className="text-[12px] text-neutral-400">
                        Aucun scan ni validation enregistré.
                      </p>
                    </div>
                  ) : (
                    <ScanTimeline events={res.historique} />
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ============================ Billet électronique (QR) ============================ */

function EticketDialog({
  data,
  onClose,
}: {
  data: { res: Reservation; ticket: TicketModel } | null;
  onClose: () => void;
}) {
  const dep = data
    ? companyDepartures.find((d) => d.id === data.res.departId) ?? null
    : null;
  return (
    <Dialog open={!!data} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[400px] gap-0 overflow-hidden rounded-2xl border-neutral-200 p-0">
        {data && (
          <>
            <DialogTitle className="sr-only">
              Billet électronique {data.ticket.id} — {data.ticket.passager.nom}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Détails du ticket électronique et QR code de validation.
            </DialogDescription>

            <div className="relative bg-gradient-to-r from-coral-500 to-coral-400 px-5 py-4 text-white">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/80">
                TBM — Billet électronique
              </p>
              <p className="mt-0.5 text-[17px] font-bold tracking-tight">
                {dep?.trajet ?? "—"}
              </p>
              <p className="mt-0.5 text-[11.5px] text-white/85">
                {dep ? `${dep.jour} · ${dep.heure}` : ""} · Réf. {data.res.id}
              </p>
            </div>

            <div className="relative px-5 py-4">
              <div
                className={cn(
                  "flex items-center gap-4",
                  data.ticket.statut !== "emis" && "opacity-70"
                )}
              >
                <div className="relative h-[132px] w-[132px] shrink-0 rounded-xl border border-neutral-200 bg-white p-2">
                  <QrCodeSvg seed={data.ticket.id} />
                  <TicketStamp statut={data.ticket.statut} />
                </div>
                <dl className="min-w-0 flex-1 space-y-2 text-[12px]">
                  <div>
                    <dt className="text-[10.5px] uppercase tracking-wide text-neutral-400">
                      Passager
                    </dt>
                    <dd className="truncate font-semibold text-neutral-800">
                      {data.ticket.passager.nom}
                    </dd>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <dt className="text-[10.5px] uppercase tracking-wide text-neutral-400">
                        Siège
                      </dt>
                      <dd className="font-semibold tabular-nums text-neutral-800">
                        {data.ticket.passager.siege}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10.5px] uppercase tracking-wide text-neutral-400">
                        Tarif
                      </dt>
                      <dd className="font-semibold tabular-nums text-neutral-800">
                        {formatNumber(data.ticket.tarif)} F
                      </dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-[10.5px] uppercase tracking-wide text-neutral-400">
                      Bus
                    </dt>
                    <dd className="font-semibold tabular-nums text-neutral-800">
                      {dep?.bus ?? "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Perforation */}
              <div
                aria-hidden="true"
                className="relative my-3 border-t border-dashed border-neutral-300"
              >
                <span className="absolute -left-[27px] -top-[7px] h-3.5 w-3.5 rounded-full bg-neutral-200/80" />
                <span className="absolute -right-[27px] -top-[7px] h-3.5 w-3.5 rounded-full bg-neutral-200/80" />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10.5px] uppercase tracking-wide text-neutral-400">
                    N° de billet
                  </p>
                  <p className="truncate text-[12.5px] font-bold tabular-nums text-neutral-800">
                    {data.ticket.id}
                  </p>
                </div>
                <TicketStatusBadge statut={data.ticket.statut} />
              </div>

              <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-[11px] leading-relaxed text-neutral-400">
                Présentez ce QR code à l’embarquement et au contrôle à bord —
                une seule validation possible. (Aperçu de démonstration.)
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ======================= Tableau des réservations ======================== */

/**
 * Tableau des réservations — colonne « Actions » en icônes seules :
 * Voir la fiche (Eye) + Voir le billet électronique (QrCode, dès qu'un
 * billet non annulé existe). Clic ligne = ouverture de la fiche.
 */
function ReservationsTable({
  rows,
  depById,
  companyById,
  settings,
  onOpen,
  onOpenEticket,
  emptyLabel,
}: {
  rows: Reservation[];
  depById: Map<string, Departure>;
  companyById: Map<string, Company>;
  settings: Settings;
  onOpen: (r: Reservation) => void;
  onOpenEticket: (r: Reservation, t: TicketModel) => void;
  emptyLabel: string;
}) {
  return (
    <div className="ff-scrollbar max-h-[620px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-neutral-100 hover:bg-transparent">
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 pl-5 text-xs font-medium text-neutral-400">
              Référence
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Passagers
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Départ associé
            </TableHead>
            <TableHead className="sticky top-0 z-10 hidden h-11 bg-neutral-50 text-xs font-medium text-neutral-400 md:table-cell">
              Compagnie
            </TableHead>
            <TableHead className="sticky top-0 z-10 hidden h-11 bg-neutral-50 text-xs font-medium text-neutral-400 lg:table-cell">
              Billets
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-right text-xs font-medium text-neutral-400">
              Montant
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Statut
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 pr-5 text-right text-xs font-medium text-neutral-400">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const dep = depById.get(r.departId);
            const company = dep ? companyById.get(dep.compagnie) : undefined;
            const used = r.tickets.filter((t) => t.statut === "utilise").length;
            const cancelled = r.tickets.filter((t) => t.statut === "annule").length;
            const issued = r.tickets.length - used - cancelled;
            const qrTicket = firstActiveTicket(r);
            return (
              <TableRow
                key={r.id}
                onClick={() => onOpen(r)}
                className="cursor-pointer border-neutral-100 transition-colors hover:bg-neutral-50/70"
              >
                <TableCell className="py-3.5 pl-5">
                  <span className="block text-[13px] font-bold tabular-nums text-neutral-900">
                    {r.id}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-neutral-400">
                    {r.creee} ·{" "}
                    {r.canal === "en_ligne" ? (
                      <span className="inline-flex items-center gap-1">
                        <Smartphone className="h-3 w-3" aria-hidden="true" />
                        En ligne
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Store className="h-3 w-3" aria-hidden="true" />
                        Guichet
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <PassengerStack res={r} />
                </TableCell>
                <TableCell>
                  <span className="block text-[12.5px] font-semibold text-neutral-700">
                    {dep ? dep.trajet : "—"}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] tabular-nums text-neutral-400">
                    {dep ? `${dep.jour} · ${dep.heure}` : ""}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {company ? (
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ring-1",
                          companyLogoColor(dep?.compagnie ?? "")
                        )}
                      >
                        {companyInitials(company.nom)}
                      </span>
                      <span className="block max-w-[130px] truncate text-[12.5px] font-medium text-neutral-600">
                        {company.nom}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[12.5px] text-neutral-400">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {r.tickets.length > 0 ? (
                    <>
                      <span className="text-[12.5px] font-semibold tabular-nums text-neutral-700">
                        {r.tickets.length} billet
                        {r.tickets.length > 1 ? "s" : ""}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-neutral-400">
                        <span className="text-coral-500">
                          {issued} émis
                        </span>
                        {" · "}
                        <span className="text-emerald-600">
                          {used} utilisé{used > 1 ? "s" : ""}
                        </span>
                        {cancelled > 0 && (
                          <>
                            {" · "}
                            <span className="text-rose-500">
                              {cancelled} annulé{cancelled > 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="text-[12px] text-neutral-300">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-[12.5px] font-semibold tabular-nums text-neutral-700">
                  {r.tickets.length > 0
                    ? formatFcfa(reservationTotal(r, settings))
                    : "—"}
                </TableCell>
                <TableCell>
                  <ResStatusBadge statut={r.statut} />
                </TableCell>
                <TableCell className="pr-5">
                  <div className="flex items-center justify-end gap-1.5">
                    <ActionIconButton
                      icon={Eye}
                      label="Voir la fiche"
                      onClick={() => onOpen(r)}
                    />
                    {qrTicket && (
                      <ActionIconButton
                        icon={QrCode}
                        tone="coral"
                        label="Voir le billet électronique"
                        onClick={() => onOpenEticket(r, qrTicket)}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-10 text-center text-[13px] text-neutral-400"
              >
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* ==================== Tableau « Billets & contrôles » ==================== */

/** Liste aplatie de tous les billets : réf., passager, réservation, départ, statut, dernier scan. */
function TicketsTable({
  rows,
  onOpen,
  onOpenEticket,
  emptyLabel,
}: {
  rows: TicketRow[];
  onOpen: (r: Reservation) => void;
  onOpenEticket: (r: Reservation, t: TicketModel) => void;
  emptyLabel: string;
}) {
  return (
    <div className="ff-scrollbar max-h-[620px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-neutral-100 hover:bg-transparent">
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 pl-5 text-xs font-medium text-neutral-400">
              Réf. billet
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Passager
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Réservation liée
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Départ
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Statut du billet
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Dernier scan
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 pr-5 text-right text-xs font-medium text-neutral-400">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ res, ticket, dep }) => {
            const scan = lastScanFor(res, ticket);
            return (
              <TableRow
                key={ticket.id}
                onClick={() => onOpen(res)}
                className="cursor-pointer border-neutral-100 transition-colors hover:bg-neutral-50/70"
              >
                <TableCell className="py-3.5 pl-5">
                  <span className="block text-[12.5px] font-bold tabular-nums text-neutral-900">
                    {ticket.id}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] tabular-nums text-neutral-400">
                    {formatFcfa(ticket.tarif)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold",
                        passengerTint(ticket.passager.nom)
                      )}
                    >
                      {passengerInitials(ticket.passager.nom)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-semibold text-neutral-800">
                        {ticket.passager.nom}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-neutral-400">
                        Siège {ticket.passager.siege}
                        {ticket.passager.type === "enfant" ? " · Enfant" : ""}
                      </span>
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block text-[12.5px] font-bold tabular-nums text-neutral-700">
                    {res.id}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-neutral-400">
                    {res.canal === "en_ligne" ? "En ligne" : "Guichet"} · {res.creee}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block text-[12.5px] font-semibold text-neutral-700">
                    {dep ? dep.trajet : "—"}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] tabular-nums text-neutral-400">
                    {dep ? `${dep.jour} · ${dep.heure}` : ""}
                  </span>
                </TableCell>
                <TableCell>
                  <TicketStatusBadge statut={ticket.statut} />
                </TableCell>
                <TableCell>
                  {scan ? (
                    <>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                          SCAN_KIND_META[scan.type].className
                        )}
                      >
                        {SCAN_KIND_META[scan.type].label}
                      </span>
                      <span
                        className="mt-0.5 block max-w-[240px] truncate text-[10.5px] text-neutral-400"
                        title={`${scan.date} — ${scan.detail}`}
                      >
                        {scan.date} — {scan.detail}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11.5px] text-neutral-300">Aucun scan</span>
                  )}
                </TableCell>
                <TableCell className="pr-5">
                  <div className="flex items-center justify-end gap-1.5">
                    <ActionIconButton
                      icon={Eye}
                      label="Voir la fiche"
                      onClick={() => onOpen(res)}
                    />
                    <ActionIconButton
                      icon={QrCode}
                      tone="coral"
                      label="Voir le billet électronique"
                      onClick={() => onOpenEticket(res, ticket)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-[13px] text-neutral-400"
              >
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* ============================ Page A10 ============================ */

/**
 * A10 — Réservations & Billets : toutes les réservations de la plateforme.
 * Recherche rapide par référence, téléphone ou numéro de billet pour le
 * support, billets électroniques avec QR code et historique des scans.
 */
export function ReservationsPage() {
  const companies = useTbmStore((s) => s.companies);
  const settings = useTbmStore((s) => s.settings);

  // Onglet page-level + fiche détail synchronisés aux paramètres d'URL (?tab=, ?sel=)
  const [tabParam, setTabParam] = useParamState("tab", "reservations");
  const tab = validParam(tabParam, RES_TABS, "reservations");
  const [selParam, setSel] = useParamState("sel", "");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [eticket, setEticket] = useState<{
    res: Reservation;
    ticket: TicketModel;
  } | null>(null);

  const depById = useMemo(
    () => new Map(companyDepartures.map((d) => [d.id, d])),
    []
  );
  const companyById = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies]
  );

  /* ---- KPIs (recalculés à chaque rendu) ---- */
  const online = reservations.filter((r) => r.canal === "en_ligne").length;
  const pending = reservations.filter((r) => r.statut === "en_attente").length;
  const activeTickets = reservations
    .flatMap((r) => r.tickets)
    .filter((t) => t.statut !== "annule");
  const usedTickets = activeTickets.filter((t) => t.statut === "utilise").length;
  const cancelledRes = reservations.filter((r) => r.statut === "annulee").length;
  const expiredRes = reservations.filter((r) => r.statut === "expiree").length;

  /* ---- Liste filtrée ---- */
  const filtered = useMemo(() => {
    const q = normalizeKey(query);
    return reservations.filter((r) => {
      const dep = depById.get(r.departId);
      const matchQuery =
        q === "" || searchKey(r).includes(q) || normalizeKey(dep?.trajet ?? "").includes(q);
      const matchStatus =
        statusFilter === "all" || r.statut === (statusFilter as ReservationStatus);
      const matchCompany =
        companyFilter === "all" || dep?.compagnie === companyFilter;
      const matchDay = dayFilter === "all" || dep?.jour === dayFilter;
      return matchQuery && matchStatus && matchCompany && matchDay;
    });
  }, [query, statusFilter, companyFilter, dayFilter, depById]);

  /** Liste aplatie des billets (onglet « Billets & contrôles ») — mêmes filtres + statut du billet. */
  const ticketRows = useMemo<TicketRow[]>(() => {
    const q = normalizeKey(query);
    const rows: TicketRow[] = [];
    for (const r of filtered) {
      const dep = depById.get(r.departId) ?? null;
      for (const t of r.tickets) {
        if (ticketStatusFilter !== "all" && t.statut !== ticketStatusFilter) continue;
        if (
          q !== "" &&
          !normalizeKey([t.id, t.passager.nom, r.id, r.telephone].join(" ")).includes(q)
        )
          continue;
        rows.push({ res: r, ticket: t, dep });
      }
    }
    return rows;
  }, [filtered, ticketStatusFilter, depById, query]);

  // Fiche dérivée par id (live) — réservations A10 : données de démo en lecture seule.
  const selectedRes = reservations.find((r) => r.id === selParam) ?? null;
  const openSheet = (r: Reservation) => setSel(r.id);
  const closeSheet = () => setSel("");

  return (
    <div>
      {/* ---- En-tête ---- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            Réservations &amp; Billets
          </h2>
          <p className="mt-0.5 max-w-2xl text-[12.5px] text-neutral-400">
            A10 — Toutes les réservations de la plateforme : billets
            électroniques, statuts et historique des scans. Astuce support :
            collez une référence (RES-…), un n° de billet (TKT-…), un téléphone
            ou un nom de passager — espaces et tirets sont ignorés.
          </p>
        </div>
      </div>

      {/* ---- Indicateurs ---- */}
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi
          index={0}
          label="Réservations"
          value={formatNumber(reservations.length)}
          hint={`${online} en ligne · ${reservations.length - online} au guichet`}
          icon={ClipboardList}
          tone="coral"
        />
        <Kpi
          index={1}
          label="En attente de paiement"
          value={formatNumber(pending)}
          hint={`places bloquées ${settings.blocageMinutes} min (RG1)`}
          icon={Hourglass}
          tone="amber"
        />
        <Kpi
          index={2}
          label="Billets actifs"
          value={formatNumber(activeTickets.length)}
          hint={`${usedTickets} validés au scan`}
          icon={QrCode}
          tone="emerald"
        />
        <Kpi
          index={3}
          label="Annulées / expirées"
          value={formatNumber(cancelledRes + expiredRes)}
          hint={`${cancelledRes} annulées · ${expiredRes} expirées`}
          icon={CircleSlash}
          tone="rose"
        />
      </div>

      {/* ---- Recherche & filtres ---- */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Référence, téléphone, n° de billet, passager…"
            aria-label="Rechercher une réservation par référence, téléphone, numéro de billet ou passager"
            className="h-9 rounded-xl border-neutral-200 bg-white pl-9 text-[13px] focus-visible:ring-coral-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            aria-label="Filtrer par statut de réservation"
            className="h-9 w-[150px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-neutral-100">
            <SelectItem value="all" className="rounded-lg text-[13px]">
              Tous les statuts
            </SelectItem>
            {Object.entries(RESERVATION_STATUS_META).map(([key, meta]) => (
              <SelectItem key={key} value={key} className="rounded-lg text-[13px]">
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger
            aria-label="Filtrer par compagnie"
            className="h-9 w-[170px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-neutral-100">
            <SelectItem value="all" className="rounded-lg text-[13px]">
              Toutes les compagnies
            </SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id} className="rounded-lg text-[13px]">
                {c.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dayFilter} onValueChange={setDayFilter}>
          <SelectTrigger
            aria-label="Filtrer par jour de départ"
            className="h-9 w-[140px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-neutral-100">
            <SelectItem value="all" className="rounded-lg text-[13px]">
              Tous les jours
            </SelectItem>
            <SelectItem value="Aujourd'hui" className="rounded-lg text-[13px]">
              Aujourd’hui
            </SelectItem>
            <SelectItem value="Demain" className="rounded-lg text-[13px]">
              Demain
            </SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-[12px] text-neutral-400">
          {tab === "billets"
            ? `${ticketRows.length} billet${ticketRows.length > 1 ? "s" : ""}`
            : `${filtered.length} réservation${filtered.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {/* ---- Onglets page-level (synchronisés au paramètre ?tab=) ---- */}
      <Tabs value={tab} onValueChange={setTabParam} className="mt-4">
        <TabsList className="h-10 w-full justify-start gap-1 overflow-x-auto rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-1 ff-scrollbar sm:w-auto">
          <TabsTrigger
            value="reservations"
            className="gap-1.5 rounded-lg px-3.5 text-[12.5px] data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <TicketIcon className="h-3.5 w-3.5" />
            Réservations
            <span className="rounded-md bg-neutral-200/80 px-1.5 py-px text-[10.5px] font-semibold text-neutral-500">
              {filtered.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="billets"
            className="gap-1.5 rounded-lg px-3.5 text-[12.5px] data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <QrCode className="h-3.5 w-3.5" />
            Billets &amp; contrôles
            <span className="rounded-md bg-neutral-200/80 px-1.5 py-px text-[10.5px] font-semibold text-neutral-500">
              {ticketRows.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ----- Onglet Réservations ----- */}
        <TabsContent value="reservations" className="mt-3">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
          >
            <ReservationsTable
              rows={filtered}
              depById={depById}
              companyById={companyById}
              settings={settings}
              onOpen={openSheet}
              onOpenEticket={(r, t) => setEticket({ res: r, ticket: t })}
              emptyLabel="Aucune réservation ne correspond à votre recherche."
            />

            {/* Pied de carte : rappel du périmètre support */}
            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 px-5 py-3">
              <TicketIcon className="h-3.5 w-3.5 text-neutral-300" aria-hidden="true" />
              <p className="text-[11.5px] text-neutral-400">
                Le support retrouve ici un billet en quelques secondes ;
                l&apos;émission et le reporting restent gérés par les compagnies.
              </p>
              <ArrowRight className="ml-auto hidden h-3.5 w-3.5 text-neutral-300 sm:block" aria-hidden="true" />
            </div>
          </motion.section>
        </TabsContent>

        {/* ----- Onglet Billets & contrôles : liste aplatie des tickets ----- */}
        <TabsContent value="billets" className="mt-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={ticketStatusFilter} onValueChange={setTicketStatusFilter}>
              <SelectTrigger
                aria-label="Filtrer par statut du billet"
                className="h-9 w-[150px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-100">
                <SelectItem value="all" className="rounded-lg text-[13px]">
                  Tous les billets
                </SelectItem>
                {(Object.keys(TICKET_STATUS_META) as TicketStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className="rounded-lg text-[13px]">
                    {TICKET_STATUS_META[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[12px] text-neutral-400">
              Chaque billet avec son dernier événement de scan ou de validation.
            </span>
          </div>
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card mt-3 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
          >
            <TicketsTable
              rows={ticketRows}
              onOpen={openSheet}
              onOpenEticket={(r, t) => setEticket({ res: r, ticket: t })}
              emptyLabel={
                query.trim() !== "" || ticketStatusFilter !== "all"
                  ? "Aucun billet ne correspond à votre recherche."
                  : "Aucun billet — ils apparaissent après confirmation du paiement (RG1)."
              }
            />
            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 px-5 py-3">
              <ScanLine className="h-3.5 w-3.5 text-neutral-300" aria-hidden="true" />
              <p className="text-[11.5px] text-neutral-400">
                Liste aplatie de tous les billets de la plateforme — le dernier scan
                (embarquement, contrôle, annulation…) est dérivé de
                l&apos;historique de la réservation liée.
              </p>
            </div>
          </motion.section>
        </TabsContent>
      </Tabs>

      {/* ---- Fiche réservation ---- */}
      <ReservationSheet
        res={selectedRes}
        companyName={
          selectedRes
            ? (companyById.get(depById.get(selectedRes.departId)?.compagnie ?? "")?.nom ?? "")
            : ""
        }
        settings={settings}
        onClose={closeSheet}
        onOpenTicket={(ticket) => {
          if (selectedRes) setEticket({ res: selectedRes, ticket });
        }}
      />

      {/* ---- Billet électronique (QR) ---- */}
      <EticketDialog data={eticket} onClose={() => setEticket(null)} />
    </div>
  );
}

/** Ajoute des minutes à une heure "HH:MM" (heure estimée après retard). */
function shiftTime(heure: string, minutes: number): string {
  const [h, m] = heure.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
