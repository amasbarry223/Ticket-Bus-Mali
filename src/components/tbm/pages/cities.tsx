"use client";

import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Building2,
  Eye,
  MapPin,
  Megaphone,
  Route,
  Search,
  Send,
  Users,
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
import { TablePagination } from "@/components/tbm/table-pagination";
import { useParamState, validParam } from "@/lib/use-param-state";
import { useTablePagination } from "@/lib/use-pagination";
import {
  cities,
  COMPANY_STATUS_META,
  companyDepartures,
  companyInitials,
  companyLines,
  companyLogoColor,
  formatNumber,
  ROLE_LABEL,
  type Line,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";

const TABS = ["villes", "notifications"] as const;

/** Villes desservies par un trajet de départ (ex. « Bamako → Ségou »). */
function trajetVilles(trajet: string): string[] {
  return trajet.split(" → ").map((v) => v.trim());
}

function MiniKpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
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
        <span className="block truncate text-[11px] text-neutral-400">
          {hint}
        </span>
      </span>
    </motion.div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
      {children}
    </h4>
  );
}

function CibleBadge({ cible }: { cible: "all" | string }) {
  const all = cible === "all";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold",
        all ? "bg-coral-50 text-coral-600" : "bg-sky-50 text-sky-600"
      )}
    >
      {all ? <Users className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
      {all ? "Tous les voyageurs" : cible}
    </span>
  );
}

/**
 * A07 — Référentiel des villes et gares + notifications ciblées aux voyageurs
 * (SMS + push). Les compteurs sont dérivés en direct des lignes, compagnies
 * et départs ; chaque envoi est tracé au journal d’audit (A06).
 */
export function CitiesPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const companies = useTbmStore((s) => s.companies);
  const notifications = useTbmStore((s) => s.notifications);
  const sendNotification = useTbmStore((s) => s.sendNotification);

  /* ---- Paramètres d’URL : onglet + fiche ville sélectionnée ---- */
  const [tabParam, setTabParam] = useParamState("tab", "villes");
  const tab = validParam(tabParam, TABS, "villes");
  const [selParam, setSelParam] = useParamState("sel", "");

  const [query, setQuery] = useState("");

  /* ---- Dialog notification (pré-remplissable depuis une ville) ---- */
  const [notifOpen, setNotifOpen] = useState(false);
  const [cible, setCible] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  /* ---- Fiche détail d’une notification envoyée ---- */
  const [detailId, setDetailId] = useState<string | null>(null);

  /* ---- Dérivés : lignes / compagnies / départs par ville ---- */
  const linesByCity = useMemo(() => {
    const map = new Map<string, Line[]>();
    for (const c of cities) {
      map.set(
        c.nom,
        companyLines.filter(
          (l) => l.depart === c.nom || l.arrivee === c.nom
        )
      );
    }
    return map;
  }, []);

  const companiesByCity = useMemo(() => {
    const map = new Map<string, typeof companies>();
    for (const c of cities) {
      map.set(c.nom, companies.filter((co) => co.ville === c.nom));
    }
    return map;
  }, [companies]);

  const upcomingByCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cities) {
      map.set(
        c.nom,
        companyDepartures.filter(
          (d) =>
            trajetVilles(d.trajet).includes(c.nom) && d.statut !== "termine"
        ).length
      );
    }
    return map;
  }, []);

  const totalGares = useMemo(
    () => cities.reduce((a, c) => a + c.gares.length, 0),
    []
  );
  const regionsCount = useMemo(
    () => new Set(cities.map((c) => c.region)).size,
    []
  );

  const filteredCities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return cities;
    return cities.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.gares.some((g) => g.toLowerCase().includes(q))
    );
  }, [query]);

  // Pagination des listes — hook partagé (reset à la page 1 quand filtre/onglet change)
  const villesPg = useTablePagination(filteredCities, {
    resetKey: [query, tab].join("|"),
  });
  const notifsPg = useTablePagination(notifications, { resetKey: tab });

  const selectedCity = cities.find((c) => c.id === selParam) ?? null;
  const cityLines = selectedCity ? linesByCity.get(selectedCity.nom) ?? [] : [];
  const cityCompanies = selectedCity
    ? companiesByCity.get(selectedCity.nom) ?? []
    : [];
  const cityUpcoming = selectedCity
    ? upcomingByCity.get(selectedCity.nom) ?? 0
    : 0;

  const selectedNotif =
    notifications.find((n) => n.id === detailId) ?? null;

  const openNotifDialog = (ville: string | "all") => {
    setCible(ville);
    setMessage("");
    setError(null);
    setNotifOpen(true);
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (message.trim().length < 10) {
      setError("Le message doit contenir au moins 10 caractères.");
      return;
    }
    sendNotification(
      { cible, message },
      user?.name ?? "Admin",
      user ? ROLE_LABEL[user.role] : "Administrateur TBM"
    );
    setNotifOpen(false);
    setMessage("");
    toast({
      title: "Notification envoyée",
      description:
        cible === "all"
          ? "Diffusée par SMS + push à tous les voyageurs — envoi tracé au journal d’audit."
          : `Diffusée par SMS + push aux voyageurs de ${cible} — envoi tracé au journal d’audit.`,
    });
  };

  return (
    <div>
      {/* ---- En-tête ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            Villes &amp; Gares
          </h2>
          <p className="mt-0.5 max-w-xl text-[12.5px] text-neutral-400">
            A07 — Référentiel des villes et gares du réseau, notifications
            ciblées aux voyageurs par SMS et push.
          </p>
        </div>
        <Button
          onClick={() => openNotifDialog("all")}
          className="h-9 gap-1.5 rounded-lg bg-coral-500 px-3.5 text-[13px] font-medium text-white shadow-md shadow-coral-500/30 transition-all hover:bg-coral-600 active:scale-[0.98]"
        >
          <Send className="h-4 w-4" />
          Notification ciblée
        </Button>
      </div>

      {/* ---- Indicateurs ---- */}
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MiniKpi
          icon={MapPin}
          label="Villes desservies"
          value={formatNumber(cities.length)}
          hint={`${regionsCount} région${regionsCount > 1 ? "s" : ""} couverte${regionsCount > 1 ? "s" : ""}`}
          tone="bg-coral-50 text-coral-500"
        />
        <MiniKpi
          icon={Building2}
          label="Gares référencées"
          value={formatNumber(totalGares)}
          hint="points d’embarquement du réseau"
          tone="bg-amber-50 text-amber-600"
        />
        <MiniKpi
          icon={Route}
          label="Lignes interurbaines"
          value={formatNumber(companyLines.length)}
          hint="toutes compagnies confondues"
          tone="bg-violet-100 text-violet-600"
        />
        <MiniKpi
          icon={Megaphone}
          label="Notifications envoyées"
          value={formatNumber(notifications.length)}
          hint="canal SMS + push"
          tone="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* ---- Onglets (synchronisés ?tab=) ---- */}
      <Tabs value={tab} onValueChange={(v) => setTabParam(v)}>
        <TabsList className="mt-5 h-10 w-full justify-start gap-1 overflow-x-auto rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-1 ff-scrollbar sm:w-auto">
          <TabsTrigger
            value="villes"
            className="h-8 gap-1.5 rounded-lg px-3.5 text-[12.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <MapPin className="h-3.5 w-3.5" />
            Villes &amp; gares
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="h-8 gap-1.5 rounded-lg px-3.5 text-[12.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Megaphone className="h-3.5 w-3.5" />
            Notifications ciblées
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-500 px-1 text-[9.5px] font-bold text-white">
              {notifications.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ============ Onglet Villes & gares ============ */}
        <TabsContent value="villes" className="mt-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher (ville, région, gare)…"
                aria-label="Rechercher une ville, une région ou une gare"
                className="h-9 rounded-xl border-neutral-200 bg-white pl-9 text-[13px] focus-visible:ring-coral-200"
              />
            </div>
            <span className="ml-auto text-[12px] text-neutral-400">
              {filteredCities.length} ville{filteredCities.length > 1 ? "s" : ""}
            </span>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card mt-3 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
          >
            <div className="ff-scrollbar overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                    <TableHead className="h-11 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400">
                      Ville
                    </TableHead>
                    <TableHead className="hidden h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 md:table-cell">
                      Gares
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                      Lignes desservies
                    </TableHead>
                    <TableHead className="hidden h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 sm:table-cell">
                      Compagnies présentes
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {villesPg.pageItems.map((c) => {
                    const lignes = linesByCity.get(c.nom) ?? [];
                    const comps = companiesByCity.get(c.nom) ?? [];
                    return (
                      <TableRow
                        key={c.id}
                        onClick={() => setSelParam(c.id)}
                        className="cursor-pointer border-neutral-100 transition-colors hover:bg-neutral-50/70"
                      >
                        <TableCell className="py-3.5 pl-5">
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-500">
                              <MapPin className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[13px] font-semibold text-neutral-800">
                                {c.nom}
                              </span>
                              <span className="block text-[11px] text-neutral-400">
                                {c.region}
                              </span>
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex max-w-[280px] flex-wrap items-center gap-1">
                            {c.gares.slice(0, 2).map((g) => (
                              <span
                                key={g}
                                className="inline-flex max-w-[170px] items-center gap-1 truncate rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500"
                                title={g}
                              >
                                <Building2 className="h-3 w-3 shrink-0 text-neutral-400" />
                                <span className="truncate">{g}</span>
                              </span>
                            ))}
                            {c.gares.length > 2 && (
                              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
                                +{c.gares.length - 2}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-coral-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-coral-600">
                            <Route className="h-3 w-3" />
                            {lignes.length} ligne{lignes.length > 1 ? "s" : ""}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {comps.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex -space-x-1.5">
                                {comps.slice(0, 3).map((co) => (
                                  <span
                                    key={co.id}
                                    title={co.nom}
                                    aria-hidden="true"
                                    className={cn(
                                      "flex h-6 w-6 items-center justify-center rounded-full text-[8.5px] font-bold ring-2 ring-white",
                                      companyLogoColor(co.id)
                                    )}
                                  >
                                    {companyInitials(co.nom)}
                                  </span>
                                ))}
                              </div>
                              <span className="text-[11.5px] tabular-nums text-neutral-400">
                                {comps.length} compagnie
                                {comps.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11.5px] text-neutral-300">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="pr-5">
                          {/* stopPropagation déjà géré par ActionIconButton */}
                          <div className="flex items-center justify-end gap-1.5">
                            <ActionIconButton
                              icon={Eye}
                              label={`Voir la fiche de ${c.nom}`}
                              tone="neutral"
                              onClick={() => setSelParam(c.id)}
                            />
                            <ActionIconButton
                              icon={Bell}
                              label={`Notifier cette ville (${c.nom})`}
                              tone="coral"
                              onClick={() => openNotifDialog(c.nom)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredCities.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center">
                        <Search className="mx-auto h-6 w-6 text-neutral-200" />
                        <p className="mt-2 text-[13px] text-neutral-400">
                          Aucune ville ne correspond à votre recherche.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              page={villesPg.page}
              pageCount={villesPg.pageCount}
              onPageChange={villesPg.setPage}
              total={villesPg.total}
              from={villesPg.from}
              to={villesPg.to}
              pageSize={villesPg.pageSize}
              onPageSizeChange={villesPg.setPageSize}
              entity="ville"
            />
          </motion.section>
        </TabsContent>

        {/* ============ Onglet Notifications ciblées ============ */}
        <TabsContent value="notifications" className="mt-4">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
          >
            <div className="ff-scrollbar max-h-[560px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                    <TableHead className="h-11 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400 backdrop-blur">
                      Date
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 backdrop-blur">
                      Cible
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 backdrop-blur">
                      Message
                    </TableHead>
                    <TableHead className="hidden h-11 bg-neutral-50/60 text-right text-xs font-medium text-neutral-400 backdrop-blur sm:table-cell">
                      Destinataires
                    </TableHead>
                    <TableHead className="hidden h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 backdrop-blur md:table-cell">
                      Envoyé par
                    </TableHead>
                    <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400 backdrop-blur">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifsPg.pageItems.map((n) => (
                    <TableRow
                      key={n.id}
                      className="border-neutral-100 transition-colors hover:bg-neutral-50/70"
                    >
                      <TableCell className="whitespace-nowrap py-3.5 pl-5 text-[12px] tabular-nums text-neutral-400">
                        {n.date}
                      </TableCell>
                      <TableCell>
                        <CibleBadge cible={n.cible} />
                      </TableCell>
                      <TableCell className="max-w-[360px]">
                        <span
                          className="block truncate text-[12.5px] leading-snug text-neutral-600"
                          title={n.message}
                        >
                          {n.message}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-right text-[12.5px] font-semibold tabular-nums text-neutral-700 sm:table-cell">
                        ≈ {formatNumber(n.destinataires)}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-[12.5px] font-medium text-neutral-700 md:table-cell">
                        {n.envoyePar}
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex justify-end">
                          <ActionIconButton
                            icon={Eye}
                            label="Voir le détail de la notification"
                            tone="neutral"
                            onClick={() => setDetailId(n.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {notifications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <Megaphone className="mx-auto h-7 w-7 text-neutral-200" />
                        <p className="mt-2 text-[13px] font-medium text-neutral-500">
                          Aucune notification envoyée pour le moment.
                        </p>
                        <p className="mt-1 text-[12px] text-neutral-400">
                          Utilisez « Notification ciblée » pour prévenir les
                          voyageurs d’un changement de programme.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              page={notifsPg.page}
              pageCount={notifsPg.pageCount}
              onPageChange={notifsPg.setPage}
              total={notifsPg.total}
              from={notifsPg.from}
              to={notifsPg.to}
              pageSize={notifsPg.pageSize}
              onPageSizeChange={notifsPg.setPageSize}
              entity="notification"
            />
          </motion.section>
        </TabsContent>
      </Tabs>

      {/* ===================== Fiche ville ===================== */}
      <Sheet
        open={!!selectedCity}
        onOpenChange={(o) => {
          if (!o) setSelParam("");
        }}
      >
        <SheetContent
          side="right"
          className="ff-scrollbar w-full gap-0 overflow-y-auto p-0 sm:max-w-[500px]"
        >
          {selectedCity && (
            <>
              <div className="border-b border-neutral-100 px-5 pb-4 pt-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-500">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <SheetTitle className="text-[17px] font-bold tracking-tight text-neutral-900">
                      {selectedCity.nom}
                    </SheetTitle>
                    <SheetDescription className="mt-0.5 text-[12.5px] text-neutral-400">
                      {selectedCity.region} · {selectedCity.id}
                    </SheetDescription>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
                    {selectedCity.gares.length} gare
                    {selectedCity.gares.length > 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-coral-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-coral-600">
                    {cityLines.length} ligne{cityLines.length > 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-violet-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-violet-600">
                    {cityCompanies.length} compagnie
                    {cityCompanies.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="space-y-5 px-5 pb-8 pt-4">
                <section>
                  <SectionTitle>Gares référencées</SectionTitle>
                  <ul className="mt-2 space-y-1.5">
                    {selectedCity.gares.map((g) => (
                      <li
                        key={g}
                        className="flex items-center gap-2.5 rounded-xl bg-neutral-50/70 px-3 py-2.5 ring-1 ring-neutral-200/60"
                      >
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        <span className="truncate text-[12.5px] font-medium text-neutral-700">
                          {g}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <SectionTitle>
                    Lignes desservies ({cityLines.length})
                  </SectionTitle>
                  <div className="mt-2 space-y-2">
                    {cityLines.length === 0 && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-neutral-200 px-3.5 py-3">
                        <Route className="h-4 w-4 shrink-0 text-neutral-300" />
                        <p className="text-[12px] text-neutral-400">
                          Aucune ligne interurbaine ne dessert cette ville.
                        </p>
                      </div>
                    )}
                    {cityLines.map((l) => {
                      const comp = companies.find((c) => c.id === l.compagnie);
                      return (
                        <div
                          key={l.id}
                          className="flex items-center gap-3 rounded-xl border border-neutral-200/70 px-3.5 py-2.5"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block font-mono text-[10.5px] font-semibold text-neutral-400">
                              {l.id}
                            </span>
                            <span className="block truncate text-[12.5px] font-semibold text-neutral-800">
                              {l.depart} → {l.arrivee}
                            </span>
                            <span className="block truncate text-[11px] text-neutral-400">
                              {comp?.nom ?? "Compagnie inconnue"}
                            </span>
                          </span>
                          <span className="shrink-0 text-[11px] text-neutral-400">
                            {l.duree}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <SectionTitle>
                    Compagnies présentes ({cityCompanies.length})
                  </SectionTitle>
                  <div className="mt-2 space-y-2">
                    {cityCompanies.length === 0 && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-neutral-200 px-3.5 py-3">
                        <Users className="h-4 w-4 shrink-0 text-neutral-300" />
                        <p className="text-[12px] text-neutral-400">
                          Aucune compagnie n’a son siège dans cette ville — les
                          lignes qui la desservent partent d’autres villes.
                        </p>
                      </div>
                    )}
                    {cityCompanies.map((co) => (
                      <div
                        key={co.id}
                        className="flex items-center gap-3 rounded-xl border border-neutral-200/70 px-3.5 py-2.5"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold ring-1",
                            companyLogoColor(co.id)
                          )}
                        >
                          {companyInitials(co.nom)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-neutral-800">
                          {co.nom}
                        </span>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                            COMPANY_STATUS_META[co.statut].className
                          )}
                        >
                          {COMPANY_STATUS_META[co.statut].label}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionTitle>Départs à venir</SectionTitle>
                  <div className="mt-2 flex items-center gap-4 rounded-2xl border border-neutral-200/70 p-4">
                    <p className="text-[26px] font-bold leading-none tabular-nums text-neutral-900">
                      {formatNumber(cityUpcoming)}
                    </p>
                    <p className="text-[12px] leading-snug text-neutral-500">
                      départ{cityUpcoming > 1 ? "s" : ""} au départ ou à
                      l’arrivée de {selectedCity.nom} (programme des 2 jours,
                      hors départs terminés).
                    </p>
                  </div>
                </section>

                <Button
                  onClick={() => {
                    setSelParam("");
                    openNotifDialog(selectedCity.nom);
                  }}
                  className="h-9.5 w-full gap-1.5 rounded-xl bg-coral-500 text-[13px] font-semibold text-white shadow-md shadow-coral-500/30 hover:bg-coral-600"
                >
                  <Bell className="h-4 w-4" />
                  Notifier cette ville
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ===================== Fiche notification ===================== */}
      <Sheet
        open={!!selectedNotif}
        onOpenChange={(o) => {
          if (!o) setDetailId(null);
        }}
      >
        <SheetContent
          side="right"
          className="ff-scrollbar w-full gap-0 overflow-y-auto p-0 sm:max-w-[480px]"
        >
          {selectedNotif && (
            <>
              <div className="border-b border-neutral-100 px-5 pb-4 pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <CibleBadge cible={selectedNotif.cible} />
                  <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
                    {selectedNotif.canal}
                  </span>
                </div>
                <SheetTitle className="mt-3 text-[15.5px] font-bold tracking-tight text-neutral-900">
                  Notification {selectedNotif.id}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Détail de la notification {selectedNotif.id} envoyée le{" "}
                  {selectedNotif.date}.
                </SheetDescription>
                <p className="mt-0.5 text-[12px] tabular-nums text-neutral-400">
                  {selectedNotif.date}
                </p>
              </div>

              <div className="space-y-5 px-5 pb-8 pt-4">
                <section>
                  <SectionTitle>Message diffusé</SectionTitle>
                  <p className="mt-2 whitespace-pre-line rounded-2xl border border-neutral-200/70 px-4 py-3.5 text-[13px] leading-relaxed text-neutral-700">
                    {selectedNotif.message}
                  </p>
                </section>

                <section className="space-y-2">
                  <SectionTitle>Contexte d’envoi</SectionTitle>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50/70 px-3 py-2.5 ring-1 ring-neutral-200/60">
                    <span className="text-[11.5px] text-neutral-400">
                      Cible
                    </span>
                    <CibleBadge cible={selectedNotif.cible} />
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50/70 px-3 py-2.5 ring-1 ring-neutral-200/60">
                    <span className="text-[11.5px] text-neutral-400">
                      Canal
                    </span>
                    <span className="text-[12.5px] font-medium text-neutral-700">
                      {selectedNotif.canal}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50/70 px-3 py-2.5 ring-1 ring-neutral-200/60">
                    <span className="text-[11.5px] text-neutral-400">
                      Destinataires estimés
                    </span>
                    <span className="text-[12.5px] font-semibold tabular-nums text-neutral-700">
                      ≈ {formatNumber(selectedNotif.destinataires)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50/70 px-3 py-2.5 ring-1 ring-neutral-200/60">
                    <span className="text-[11.5px] text-neutral-400">
                      Envoyé par
                    </span>
                    <span className="text-[12.5px] font-medium text-neutral-700">
                      {selectedNotif.envoyePar}
                    </span>
                  </div>
                </section>

                <div className="flex items-start gap-2.5 rounded-xl bg-fuchsia-50/70 p-3">
                  <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500" />
                  <p className="text-[11.5px] leading-relaxed text-fuchsia-700">
                    Chaque envoi est tracé au journal d’audit (A06) — action
                    « Notification », auteur et cible conservés.
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ===================== Dialog notification ===================== */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-[16px]">
              Notification ciblée
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              Envoyée par SMS et push aux voyageurs concernés.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSend} className="space-y-3.5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="notif-cible" className="text-[13px]">
                Destinataires
              </Label>
              <Select value={cible} onValueChange={setCible}>
                <SelectTrigger
                  id="notif-cible"
                  className="h-9.5 w-full rounded-xl border-neutral-200 focus:ring-coral-200"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-100">
                  <SelectItem value="all" className="rounded-lg text-[13px]">
                    Tous les voyageurs
                  </SelectItem>
                  {cities.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.nom}
                      className="rounded-lg text-[13px]"
                    >
                      Ville de {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-neutral-400">
                ≈ {formatNumber(cible === "all" ? 5250 : 1200)} destinataires
                estimés selon la cible.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notif-msg" className="text-[13px]">
                Message
              </Label>
              <Textarea
                id="notif-msg"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex. : gare de Sogoniko — les départs de 14 h sont avancés à 13 h 30 ce samedi."
                className="rounded-xl border-neutral-200 text-[13px] focus-visible:ring-coral-200"
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-600"
              >
                {error}
              </p>
            )}
            <DialogFooter className="gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNotifOpen(false)}
                className="h-9 rounded-xl border-neutral-200 text-[13px]"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="h-9 rounded-xl bg-coral-500 text-[13px] font-medium text-white shadow-md shadow-coral-500/30 hover:bg-coral-600"
              >
                <Send className="h-3.5 w-3.5" />
                Envoyer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
