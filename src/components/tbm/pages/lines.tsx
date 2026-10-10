"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Eye,
  History,
  MapPin,
  Route,
  Search,
  Ticket,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTbmStore } from "@/lib/tbm-store";
import { ActionIconButton } from "@/components/tbm/action-icon";
import { useParamState, validParam } from "@/lib/use-param-state";
import {
  COMPANY_STATUS_META,
  companyDepartures,
  companyInitials,
  companyLines,
  companyLogoColor,
  DEPARTURE_MODIFICATION_META,
  DEPARTURE_STATUS_META,
  departureModifications,
  formatFcfa,
  formatNumber,
  type Departure,
  type DepartureModification,
  type DepartureStatus,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";

const TABS = ["departs", "lignes"] as const;

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
  tone: "coral" | "amber" | "rose" | "neutral";
  index: number;
}) {
  const tones: Record<string, string> = {
    coral: "group-hover:bg-coral-50 group-hover:text-coral-500",
    amber: "group-hover:bg-amber-50 group-hover:text-amber-600",
    rose: "group-hover:bg-rose-50 group-hover:text-rose-600",
    neutral: "group-hover:bg-neutral-200/60",
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

function StatusBadge({ statut }: { statut: DepartureStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold",
        DEPARTURE_STATUS_META[statut].className
      )}
    >
      {statut === "retarde" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      )}
      {DEPARTURE_STATUS_META[statut].label}
    </span>
  );
}

function OccupancyBar({
  total,
  dispo,
  muted,
}: {
  total: number;
  dispo: number;
  muted?: boolean;
}) {
  const sold = total - dispo;
  const pct = total > 0 ? Math.round((sold / total) * 100) : 0;
  return (
    <div className="min-w-[110px]">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            muted ? "bg-neutral-200" : pct >= 80 ? "bg-coral-500" : "bg-coral-400/70"
          )}
          style={{ width: `${muted ? 0 : pct}%` }}
        />
      </div>
      <p className="mt-1 text-[10.5px] tabular-nums text-neutral-400">
        {muted ? "—" : `${formatNumber(sold)}/${formatNumber(total)} vendues · ${formatNumber(dispo)} libres`}
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
      {children}
    </h4>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50/70 px-3 py-2.5 ring-1 ring-neutral-200/60">
      <span className="text-[11.5px] text-neutral-400">{label}</span>
      <span className="truncate text-[12.5px] font-medium text-neutral-700">
        {value}
      </span>
    </div>
  );
}

function StopsTimeline({
  depart,
  arrivee,
  arrets,
}: {
  depart: string;
  arrivee: string;
  arrets: string[];
}) {
  const points = [
    { name: depart, kind: "end" as const },
    ...arrets.map((a) => ({ name: a, kind: "stop" as const })),
    { name: arrivee, kind: "end" as const },
  ];
  return (
    <ol className="space-y-0">
      {points.map((p, i) => (
        <li key={`${p.name}-${i}`} className="relative flex items-center gap-3 pb-4 last:pb-0">
          {i < points.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute left-[5px] top-3 h-full w-px bg-neutral-200"
            />
          )}
          <span
            aria-hidden="true"
            className={cn(
              "relative z-10 h-[11px] w-[11px] shrink-0 rounded-full ring-4",
              p.kind === "end"
                ? "bg-coral-500 ring-coral-100"
                : "border-2 border-neutral-300 bg-white ring-white"
            )}
          />
          <span
            className={cn(
              "text-[12.5px]",
              p.kind === "end"
                ? "font-semibold text-neutral-800"
                : "text-neutral-500"
            )}
          >
            {p.name}
            {p.kind === "end" && (
              <span className="ml-2 text-[10.5px] font-medium uppercase tracking-wide text-neutral-400">
                {i === 0 ? "Départ" : "Arrivée"}
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ModificationsTimeline({
  mods,
}: {
  mods: DepartureModification[];
}) {
  if (mods.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-3.5 py-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        <p className="text-[12px] text-neutral-600">
          Programme conforme — aucune modification signalée.
        </p>
      </div>
    );
  }
  return (
    <ol className="relative ml-1.5 space-y-0 border-l border-neutral-200 pl-5">
      {mods.map((m) => {
        const meta = DEPARTURE_MODIFICATION_META[m.type];
        return (
          <li key={m.id} className="relative pb-5 last:pb-0">
            <span
              aria-hidden="true"
              className={cn(
                "absolute -left-[25.5px] top-1 h-2.5 w-2.5 rounded-full ring-4",
                m.type === "annulation"
                  ? "bg-rose-500 ring-rose-100"
                  : m.type === "retard"
                    ? "bg-amber-500 ring-amber-100"
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
                {m.date}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-600">
              {m.detail}
            </p>
            <p className="mt-0.5 text-[10.5px] text-neutral-400">
              Signalé par {m.auteur}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/* ============================ Page A09 ============================ */

/**
 * A09 — Lignes & Départs : supervision inter-compagnies (lecture seule).
 * Consultation des lignes interrégionales (arrêts, tarifs, capacité),
 * tableau des départs avec statuts et suivi des modifications de programme.
 * Ne remplace pas l'outil de programmation propre à chaque compagnie.
 */
export function LinesPage() {
  const companies = useTbmStore((s) => s.companies);

  /* ---- Paramètres d’URL : onglet + fiche sélectionnée (?tab=, ?sel=) ---- */
  const [tabParam, setTabParam] = useParamState("tab", "departs");
  const view = validParam(tabParam, TABS, "departs") as "departs" | "lignes";
  const [selParam, setSelParam] = useParamState("sel", "");
  const setSel = (v: string | null) => setSelParam(v ?? "");

  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");

  const companyById = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies]
  );

  /* ---- KPIs du jour (live : tient compte des compagnies suspendues) ---- */
  const kpis = useMemo(() => {
    const today = companyDepartures.filter((d) => d.jour === "Aujourd'hui");
    const exploitables = today.filter(
      (d) =>
        d.statut !== "annule" &&
        companyById.get(d.compagnie)?.statut !== "suspendue"
    );
    const sold = exploitables.reduce(
      (a, d) => a + (d.placesTotal - d.placesDispo),
      0
    );
    const cap = exploitables.reduce((a, d) => a + d.placesTotal, 0);
    const occ = cap > 0 ? Math.round((sold / cap) * 100) : 0;
    const perturbes = today.filter(
      (d) =>
        d.statut === "retarde" ||
        d.statut === "annule" ||
        companyById.get(d.compagnie)?.statut === "suspendue"
    ).length;
    return { count: today.length, sold, occ, perturbes, modifs: departureModifications.length };
  }, [companyById]);

  /* ---- Tableau des départs filtré ---- */
  const filteredDeparts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const dayRank: Record<string, number> = {
      "Aujourd'hui": 0,
      Demain: 1,
    };
    return companyDepartures
      .filter((d) => {
        const company = companyById.get(d.compagnie);
        const matchQuery =
          q === "" ||
          d.trajet.toLowerCase().includes(q) ||
          d.bus.toLowerCase().includes(q) ||
          (company?.nom.toLowerCase().includes(q) ?? false);
        const matchCompany =
          companyFilter === "all" || d.compagnie === companyFilter;
        const matchStatus =
          statusFilter === "all" || d.statut === (statusFilter as DepartureStatus);
        const matchDay = dayFilter === "all" || d.jour === dayFilter;
        return matchQuery && matchCompany && matchStatus && matchDay;
      })
      .sort((a, b) => {
        const jr = (dayRank[a.jour] ?? 2) - (dayRank[b.jour] ?? 2);
        if (jr !== 0) return jr;
        return a.heure.localeCompare(b.heure);
      });
  }, [query, companyFilter, statusFilter, dayFilter, companyById]);

  /* ---- Réseau de lignes (agrégé inter-compagnies) ---- */
  interface Offering {
    compagnieId: string;
    prix: number;
    frequence: string;
  }
  interface NetworkLine {
    key: string;
    depart: string;
    arrivee: string;
    duree: string;
    distanceKm: number;
    arrets: string[];
    offerings: Offering[];
  }
  const network = useMemo(() => {
    const map = new Map<string, NetworkLine>();
    for (const l of companyLines) {
      const key = `${l.depart} → ${l.arrivee}`;
      const cur = map.get(key) ?? {
        key,
        depart: l.depart,
        arrivee: l.arrivee,
        duree: l.duree,
        distanceKm: l.distanceKm,
        arrets: l.arrets,
        offerings: [],
      };
      cur.offerings.push({
        compagnieId: l.compagnie,
        prix: l.prix,
        frequence: l.frequence,
      });
      map.set(key, cur);
    }
    return [...map.values()];
  }, []);

  const filteredNetwork = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return network;
    return network.filter(
      (n) =>
        n.key.toLowerCase().includes(q) ||
        n.arrets.some((a) => a.toLowerCase().includes(q)) ||
        n.offerings.some((o) =>
          (companyById.get(o.compagnieId)?.nom ?? "")
            .toLowerCase()
            .includes(q)
        )
    );
  }, [network, query, companyById]);

  /* ---- Sélection des fiches, synchronisée à l’URL (?sel=) ---- */
  const selectedDepId = companyDepartures.some((d) => d.id === selParam)
    ? selParam
    : null;
  const selectedLineKey = network.some((n) => n.key === selParam)
    ? selParam
    : null;

  /* ---- Fiche détail départ ---- */
  const selectedDep = companyDepartures.find((d) => d.id === selectedDepId) ?? null;
  const depCompany = selectedDep ? companyById.get(selectedDep.compagnie) : null;
  const depMods = useMemo(
    () =>
      selectedDep
        ? departureModifications.filter((m) => m.departId === selectedDep.id)
        : [],
    [selectedDep]
  );
  const depStops = useMemo(() => {
    if (!selectedDep) return null;
    const [depart, arrivee] = selectedDep.trajet.split(" → ");
    const line = companyLines.find(
      (l) => l.depart === depart && l.arrivee === arrivee
    );
    return line ? { depart, arrivee, arrets: line.arrets } : { depart, arrivee, arrets: [] };
  }, [selectedDep]);

  /* ---- Fiche détail ligne ---- */
  const selectedLine = network.find((n) => n.key === selectedLineKey) ?? null;
  const lineDepartures = useMemo(
    () =>
      selectedLine
        ? companyDepartures
            .filter((d) => d.trajet === selectedLine.key && d.statut !== "termine")
            .sort((a, b) => a.heure.localeCompare(b.heure))
        : [],
    [selectedLine]
  );

  return (
    <div>
      {/* ---- En-tête ---- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            Lignes &amp; Départs
          </h2>
          <p className="mt-0.5 max-w-xl text-[12.5px] text-neutral-400">
            A09 — Supervision des départs de toutes les compagnies : lecture
            seule, la programmation reste gérée par l’outil de chaque compagnie.
          </p>
        </div>
      </div>

      {/* ---- Indicateurs du jour ---- */}
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi
          index={0}
          label="Départs aujourd’hui"
          value={formatNumber(kpis.count)}
          hint={`${formatNumber(companyDepartures.length)} sur 2 jours`}
          icon={CalendarClock}
          tone="coral"
        />
        <Kpi
          index={1}
          label="Places vendues (jour)"
          value={formatNumber(kpis.sold)}
          hint="hors départs annulés et suspendus"
          icon={Ticket}
          tone="neutral"
        />
        <Kpi
          index={2}
          label="Taux d’occupation"
          value={`${kpis.occ} %`}
          hint="capacité embarquée aujourd’hui"
          icon={Route}
          tone="coral"
        />
        <Kpi
          index={3}
          label="Départs perturbés"
          value={formatNumber(kpis.perturbes)}
          hint={`retards, annulations, suspensions · ${kpis.modifs} modifs suivies`}
          icon={History}
          tone="rose"
        />
      </div>

      {/* ---- Filtres partagés ---- */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              view === "departs"
                ? "Rechercher (trajet, bus, compagnie)…"
                : "Rechercher (trajet, arrêt, compagnie)…"
            }
            aria-label="Rechercher une ligne ou un départ"
            className="h-9 rounded-xl border-neutral-200 bg-white pl-9 text-[13px] focus-visible:ring-coral-200"
          />
        </div>
        {view === "departs" && (
          <>
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
                  <SelectItem
                    key={c.id}
                    value={c.id}
                    className="rounded-lg text-[13px]"
                  >
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                aria-label="Filtrer par statut"
                className="h-9 w-[140px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-100">
                <SelectItem value="all" className="rounded-lg text-[13px]">
                  Tous les statuts
                </SelectItem>
                {Object.entries(DEPARTURE_STATUS_META).map(([key, meta]) => (
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
            <Select value={dayFilter} onValueChange={setDayFilter}>
              <SelectTrigger
                aria-label="Filtrer par jour"
                className="h-9 w-[130px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
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
          </>
        )}
        <span className="ml-auto text-[12px] text-neutral-400">
          {view === "departs"
            ? `${filteredDeparts.length} départ${filteredDeparts.length > 1 ? "s" : ""}`
            : `${filteredNetwork.length} ligne${filteredNetwork.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {/* ---- Vue : départs / lignes ---- */}
      <Tabs
        value={view}
        onValueChange={(v) => setTabParam(v)}
      >
        <TabsList className="mt-3 h-9 rounded-xl bg-neutral-100 p-1">
          <TabsTrigger value="departs" className="h-7 rounded-lg text-[12.5px]">
            Tableau des départs
          </TabsTrigger>
          <TabsTrigger value="lignes" className="h-7 rounded-lg text-[12.5px]">
            Réseau de lignes
          </TabsTrigger>
        </TabsList>

        {/* ============ Onglet Départs ============ */}
        <TabsContent value="departs" className="mt-3">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
          >
            <div className="ff-scrollbar overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                    <TableHead className="h-11 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400">
                      Départ
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Trajet
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Compagnie
                    </TableHead>
                    <TableHead className="hidden h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 md:table-cell">
                      Bus
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-right text-xs font-medium text-neutral-400">
                      Tarif
                    </TableHead>
                    <TableHead className="hidden h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 sm:table-cell">
                      Capacité
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 pr-5 text-xs font-medium text-neutral-400">
                      Statut
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeparts.map((d) => {
                    const company = companyById.get(d.compagnie);
                    const hasMods = departureModifications.some(
                      (m) => m.departId === d.id
                    );
                    return (
                      <TableRow
                        key={d.id}
                        onClick={() => setSel(d.id)}
                        className="cursor-pointer border-neutral-100 transition-colors hover:bg-neutral-50/70"
                      >
                        <TableCell className="py-3.5 pl-5">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold leading-none tabular-nums text-neutral-900">
                              {d.heure}
                            </span>
                            {hasMods && (
                              <History
                                className="h-3.5 w-3.5 text-amber-500"
                                aria-label="Programme modifié"
                              />
                            )}
                          </div>
                          <span className="mt-1 block text-[10.5px] text-neutral-400">
                            {d.jour}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="block text-[13px] font-semibold text-neutral-800">
                            {d.trajet}
                          </span>
                          {d.plateforme && (
                            <span className="block text-[11px] text-neutral-400">
                              Plateforme {d.plateforme}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ring-1",
                                companyLogoColor(d.compagnie)
                              )}
                            >
                              {companyInitials(company?.nom ?? "??")}
                            </span>
                            <span className="min-w-0">
                              <span className="block max-w-[140px] truncate text-[12.5px] font-medium text-neutral-700">
                                {company?.nom ?? "—"}
                              </span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-[12.5px] tabular-nums text-neutral-500 md:table-cell">
                          {d.bus}
                        </TableCell>
                        <TableCell className="text-right text-[12.5px] font-semibold tabular-nums text-neutral-700">
                          {formatFcfa(d.prix)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <OccupancyBar
                            total={d.placesTotal}
                            dispo={d.placesDispo}
                            muted={d.statut === "annule"}
                          />
                        </TableCell>
                        <TableCell className="pr-5">
                          <div className="flex justify-end">
                            <StatusBadge statut={d.statut} />
                          </div>
                          {d.statut === "retarde" && d.retardMinutes && (
                            <p className="mt-1 text-right text-[10.5px] text-amber-600">
                              +{d.retardMinutes} min
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="pr-5">
                          <div className="flex justify-end">
                            <ActionIconButton
                              icon={Eye}
                              label="Voir la fiche du départ"
                              tone="coral"
                              onClick={() => setSel(d.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredDeparts.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-10 text-center text-[13px] text-neutral-400"
                      >
                        Aucun départ ne correspond à votre recherche.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.section>
        </TabsContent>

        {/* ============ Onglet Lignes ============ */}
        <TabsContent value="lignes" className="mt-3">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
          >
            <div className="ff-scrollbar overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                    <TableHead className="h-11 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400">
                      Ligne interrégionale
                    </TableHead>
                    <TableHead className="hidden h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 md:table-cell">
                      Arrêts intermédiaires
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Durée · Distance
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-right text-xs font-medium text-neutral-400">
                      Tarifs
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Compagnies
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNetwork.map((n) => {
                    const prixMin = Math.min(...n.offerings.map((o) => o.prix));
                    const prixMax = Math.max(...n.offerings.map((o) => o.prix));
                    return (
                      <TableRow
                        key={n.key}
                        onClick={() => setSel(n.key)}
                        className="cursor-pointer border-neutral-100 transition-colors hover:bg-neutral-50/70"
                      >
                        <TableCell className="py-3.5 pl-5">
                          <span className="block text-[13px] font-semibold text-neutral-800">
                            {n.depart} → {n.arrivee}
                          </span>
                          <span className="block text-[11px] text-neutral-400">
                            {n.arrets.length} arrêt
                            {n.arrets.length > 1 ? "s" : ""} intermédiaire
                            {n.arrets.length > 1 ? "s" : ""}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="block max-w-[220px] truncate text-[12px] text-neutral-500">
                            {n.arrets.length > 0
                              ? n.arrets.join(" · ")
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="block text-[12.5px] font-medium text-neutral-700">
                            {n.duree}
                          </span>
                          <span className="block text-[11px] text-neutral-400">
                            {formatNumber(n.distanceKm)} km
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-[12.5px] font-semibold tabular-nums text-neutral-700">
                          {prixMin === prixMax
                            ? formatFcfa(prixMin)
                            : `${formatNumber(prixMin)} – ${formatFcfa(prixMax)}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1.5">
                              {n.offerings.map((o) => (
                                <span
                                  key={o.compagnieId}
                                  title={
                                    companyById.get(o.compagnieId)?.nom ?? ""
                                  }
                                  aria-hidden="true"
                                  className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full text-[8.5px] font-bold ring-2 ring-white",
                                    companyLogoColor(o.compagnieId)
                                  )}
                                >
                                  {companyInitials(
                                    companyById.get(o.compagnieId)?.nom ?? "??"
                                  )}
                                </span>
                              ))}
                            </div>
                            <span className="text-[11.5px] tabular-nums text-neutral-400">
                              ×{n.offerings.length}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-5">
                          <div className="flex justify-end">
                            <ActionIconButton
                              icon={Eye}
                              label="Voir la fiche de la ligne"
                              tone="coral"
                              onClick={() => setSel(n.key)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredNetwork.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-[13px] text-neutral-400"
                      >
                        Aucune ligne ne correspond à votre recherche.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.section>
        </TabsContent>
      </Tabs>

      {/* ===================== Fiche départ ===================== */}
      <Sheet
        open={!!selectedDep}
        onOpenChange={(o) => {
          if (!o) setSel(null);
        }}
      >
        <SheetContent
          side="right"
          className="ff-scrollbar w-full gap-0 overflow-y-auto p-0 sm:max-w-[560px]"
        >
          {selectedDep && (
            <>
              <div className="border-b border-neutral-100 px-5 pb-4 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums text-neutral-900">
                        {selectedDep.heure}
                      </span>
                      <StatusBadge statut={selectedDep.statut} />
                    </div>
                    <SheetTitle className="mt-2 text-[15.5px] font-bold tracking-tight text-neutral-900">
                      {selectedDep.trajet}
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                      Fiche du départ {selectedDep.trajet} du {selectedDep.jour}{" "}
                      à {selectedDep.heure}.
                    </SheetDescription>
                    <p className="mt-0.5 text-[12px] text-neutral-400">
                      {selectedDep.jour}
                      {selectedDep.plateforme &&
                        ` · Plateforme ${selectedDep.plateforme}`}
                    </p>
                  </div>
                </div>
                {selectedDep.statut === "retarde" && selectedDep.retardMinutes && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200/70">
                    <History className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <p className="text-[12px] font-medium text-amber-700">
                      Départ retardé de {selectedDep.retardMinutes} min —
                      nouvelle heure estimée{" "}
                      {shiftTime(selectedDep.heure, selectedDep.retardMinutes)}.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-5 px-5 pb-8 pt-4">
                <section className="grid gap-2 sm:grid-cols-2">
                  <InfoRow
                    label="Compagnie"
                    value={depCompany?.nom ?? "—"}
                  />
                  <InfoRow label="Bus affecté" value={selectedDep.bus} />
                  <InfoRow label="Tarif" value={formatFcfa(selectedDep.prix)} />
                  <InfoRow
                    label="Capacité"
                    value={`${selectedDep.placesTotal} places`}
                  />
                </section>

                <section>
                  <SectionTitle>Places disponibles &amp; vendues</SectionTitle>
                  <div className="mt-2 rounded-2xl border border-neutral-200/70 p-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[11.5px] text-neutral-400">
                          Places vendues
                        </p>
                        <p className="mt-1 text-[22px] font-bold leading-none tabular-nums text-neutral-900">
                          {formatNumber(
                            selectedDep.placesTotal - selectedDep.placesDispo
                          )}
                          <span className="ml-1 text-[12px] font-semibold text-neutral-400">
                            / {formatNumber(selectedDep.placesTotal)}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11.5px] text-neutral-400">
                          Disponibles
                        </p>
                        <p className="mt-1 text-[22px] font-bold leading-none tabular-nums text-emerald-600">
                          {formatNumber(selectedDep.placesDispo)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-coral-500"
                        style={{
                          width: `${
                            selectedDep.statut === "annule"
                              ? 0
                              : Math.round(
                                  ((selectedDep.placesTotal -
                                    selectedDep.placesDispo) /
                                    selectedDep.placesTotal) *
                                    100
                                )
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </section>

                {depStops && (
                  <section>
                    <SectionTitle>
                      Itinéraire &amp; arrêts intermédiaires
                    </SectionTitle>
                    <div className="mt-3 rounded-2xl border border-neutral-200/70 px-4 py-4">
                      <StopsTimeline
                        depart={depStops.depart}
                        arrivee={depStops.arrivee}
                        arrets={depStops.arrets}
                      />
                    </div>
                  </section>
                )}

                <section>
                  <SectionTitle>
                    Modifications du programme ({depMods.length})
                  </SectionTitle>
                  <div className="mt-3">
                    <ModificationsTimeline mods={depMods} />
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ===================== Fiche ligne ===================== */}
      <Sheet
        open={!!selectedLine}
        onOpenChange={(o) => {
          if (!o) setSel(null);
        }}
      >
        <SheetContent
          side="right"
          className="ff-scrollbar w-full gap-0 overflow-y-auto p-0 sm:max-w-[560px]"
        >
          {selectedLine && (
            <>
              <div className="border-b border-neutral-100 px-5 pb-4 pt-5">
                <SheetTitle className="text-[17px] font-bold tracking-tight text-neutral-900">
                  {selectedLine.depart} → {selectedLine.arrivee}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Ligne interrégionale {selectedLine.key}.
                </SheetDescription>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
                    {selectedLine.duree}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-neutral-500">
                    {formatNumber(selectedLine.distanceKm)} km
                  </span>
                  <span className="inline-flex items-center rounded-md bg-coral-50 px-2 py-0.5 text-[11px] font-semibold text-coral-600">
                    {selectedLine.arrets.length} arrêt
                    {selectedLine.arrets.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="space-y-5 px-5 pb-8 pt-4">
                <section>
                  <SectionTitle>Parcours</SectionTitle>
                  <div className="mt-3 rounded-2xl border border-neutral-200/70 px-4 py-4">
                    <StopsTimeline
                      depart={selectedLine.depart}
                      arrivee={selectedLine.arrivee}
                      arrets={selectedLine.arrets}
                    />
                  </div>
                </section>

                <section>
                  <SectionTitle>
                    Compagnies exploitantes ({selectedLine.offerings.length})
                  </SectionTitle>
                  <div className="mt-2 space-y-2">
                    {selectedLine.offerings.map((o) => {
                      const c = companyById.get(o.compagnieId);
                      return (
                        <div
                          key={o.compagnieId}
                          className="flex items-center gap-3 rounded-xl border border-neutral-200/70 px-3.5 py-2.5"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ring-1",
                              companyLogoColor(o.compagnieId)
                            )}
                          >
                            {companyInitials(c?.nom ?? "??")}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-[12.5px] font-semibold text-neutral-800">
                                {c?.nom ?? "—"}
                              </span>
                              {c && (
                                <span
                                  className={cn(
                                    "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                                    COMPANY_STATUS_META[c.statut].className
                                  )}
                                >
                                  {COMPANY_STATUS_META[c.statut].label}
                                </span>
                              )}
                            </span>
                            <span className="block text-[11px] text-neutral-400">
                              {o.frequence}
                            </span>
                          </span>
                          <span className="shrink-0 text-[12.5px] font-semibold tabular-nums text-neutral-700">
                            {formatFcfa(o.prix)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <SectionTitle>
                    Départs à venir ({lineDepartures.length})
                  </SectionTitle>
                  <div className="mt-2 space-y-2">
                    {lineDepartures.length === 0 && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-neutral-200 px-3.5 py-3">
                        <MapPin className="h-4 w-4 shrink-0 text-neutral-300" />
                        <p className="text-[12px] text-neutral-400">
                          Aucun départ à venir sur cette ligne.
                        </p>
                      </div>
                    )}
                    {lineDepartures.map((d) => (
                      <DepartureMiniRow
                        key={d.id}
                        dep={d}
                        onSelect={() => setSel(d.id)}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DepartureMiniRow({
  dep,
  onSelect,
}: {
  dep: Departure;
  onSelect: () => void;
}) {
  const sold = dep.placesTotal - dep.placesDispo;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl border border-neutral-200/70 px-3.5 py-2.5 text-left transition-colors hover:bg-neutral-50"
    >
      <span className="w-[56px] shrink-0">
        <span className="block text-[13px] font-bold leading-none tabular-nums text-neutral-900">
          {dep.heure}
        </span>
        <span className="mt-0.5 block text-[10.5px] text-neutral-400">
          {dep.jour}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-medium text-neutral-700">
          {dep.bus} · {formatNumber(sold)}/{formatNumber(dep.placesTotal)}{" "}
          vendues · {formatNumber(dep.placesDispo)} libres
        </span>
      </span>
      <StatusBadge statut={dep.statut} />
    </button>
  );
}

/** Ajoute des minutes à une heure "HH:MM" (utilisée pour l'heure estimée). */
function shiftTime(heure: string, minutes: number): string {
  const [h, m] = heure.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
