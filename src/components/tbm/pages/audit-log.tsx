"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Ban,
  Building2,
  Clock,
  Clock3,
  Download,
  Eye,
  KeyRound,
  Percent,
  Scale,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
  Tag,
  Undo2,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { useTbmStore } from "@/lib/tbm-store";
import { ActionIconButton } from "@/components/tbm/action-icon";
import { TablePagination } from "@/components/tbm/table-pagination";
import { useParamState, validParam } from "@/lib/use-param-state";
import { useTablePagination } from "@/lib/use-pagination";
import {
  AUDIT_ACTION_META,
  type AuditAction,
  type AuditEntry,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";

const TABS = ["journal", "sensibles", "types"] as const;

/** Actions à haut risque pour l’exploitation (suivi renforcé A06). */
const SENSITIVE_ACTIONS: AuditAction[] = [
  "Remboursement",
  "Litige",
  "Utilisateur",
  "Reversement",
  "Paramétrage",
  "Modification prix",
];

const ACTION_KEYS = Object.keys(AUDIT_ACTION_META) as AuditAction[];

function ActionIcon({ action }: { action: AuditAction }) {
  switch (action) {
    case "Remboursement":
      return <Undo2 className="h-3 w-3" />;
    case "Litige":
      return <ShieldAlert className="h-3 w-3" />;
    case "Utilisateur":
      return <UserCheck className="h-3 w-3" />;
    case "Reversement":
      return <Percent className="h-3 w-3" />;
    case "Paramétrage":
      return <Settings className="h-3 w-3" />;
    case "Modification prix":
      return <Tag className="h-3 w-3" />;
    case "Compagnie":
      return <Building2 className="h-3 w-3" />;
    case "Annulation":
      return <Ban className="h-3 w-3" />;
    case "Transaction":
      return <ArrowLeftRight className="h-3 w-3" />;
    case "Rapprochement":
      return <Scale className="h-3 w-3" />;
    case "Connexion":
      return <KeyRound className="h-3 w-3" />;
    default:
      return <ScrollText className="h-3 w-3" />;
  }
}

function ActionBadge({ action }: { action: AuditAction }) {
  const meta = AUDIT_ACTION_META[action] ?? { className: "bg-neutral-100 text-neutral-600" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold border shadow-2xs",
        meta.className,
        action === "Remboursement" && "border-violet-200/60 bg-violet-50 text-violet-700",
        action === "Litige" && "border-rose-200/60 bg-rose-50 text-rose-700",
        action === "Utilisateur" && "border-emerald-200/60 bg-emerald-50 text-emerald-700",
        action === "Reversement" && "border-amber-200/60 bg-amber-50 text-amber-700",
        action === "Paramétrage" && "border-sky-200/60 bg-sky-50 text-sky-700",
        action === "Modification prix" && "border-orange-200/60 bg-orange-50 text-orange-700",
        action === "Compagnie" && "border-teal-200/60 bg-teal-50 text-teal-700",
        action === "Annulation" && "border-rose-200/60 bg-rose-50 text-rose-700",
        action === "Transaction" && "border-[#003B2D]/20 bg-[#F3F7F5] text-[#003B2D]",
        action === "Rapprochement" && "border-lime-200/60 bg-lime-50 text-lime-800",
        action === "Connexion" && "border-neutral-200 bg-neutral-100/80 text-neutral-700"
      )}
    >
      <ActionIcon action={action} />
      {action}
    </span>
  );
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
  tone?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3.5 rounded-2xl border border-[var(--tbm-border)] bg-[var(--tbm-white)] p-4 shadow-xs"
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          tone ?? "bg-[#003B2D]/10 text-[#003B2D]"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-medium text-[var(--tbm-text)]">
          {label}
        </span>
        <span className="block truncate text-[22px] font-bold tracking-tight text-[var(--tbm-text)]">
          {value}
        </span>
        <span className="block truncate text-[11px] text-[var(--tbm-text-muted)]">
          {hint}
        </span>
      </span>
    </motion.div>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-12 text-center">
        <ScrollText className="mx-auto h-7 w-7 text-neutral-200" />
        <p className="mt-2 text-[13px] text-neutral-400">{label}</p>
      </TableCell>
    </TableRow>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-neutral-50/70 px-3 py-2.5 ring-1 ring-neutral-200/60">
      <span className="shrink-0 pt-0.5 text-[11.5px] text-neutral-400">
        {label}
      </span>
      <span className="min-w-0 text-right text-[12.5px] font-medium text-neutral-700">
        {value}
      </span>
    </div>
  );
}

/** Table du journal (utilisée par les onglets « Journal complet » et « Actions sensibles »). */
function AuditTable({
  entries,
  onSelect,
  emptyLabel,
}: {
  entries: AuditEntry[];
  onSelect: (id: string) => void;
  emptyLabel: string;
}) {
  return (
    <div className="ff-scrollbar overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-[var(--tbm-border)] bg-[#F3F7F5]/80 hover:bg-transparent">
            <TableHead className="h-11 pl-5 text-xs font-semibold text-[var(--tbm-text)]">
              Date
            </TableHead>
            <TableHead className="h-11 text-xs font-semibold text-[var(--tbm-text)]">
              Auteur
            </TableHead>
            <TableHead className="h-11 text-xs font-semibold text-[var(--tbm-text)]">
              Action
            </TableHead>
            <TableHead className="h-11 text-xs font-semibold text-[var(--tbm-text)]">
              Objet
            </TableHead>
            <TableHead className="hidden h-11 text-xs font-semibold text-[var(--tbm-text)] lg:table-cell">
              Détail
            </TableHead>
            <TableHead className="h-11 pr-5 text-right text-xs font-semibold text-[var(--tbm-text)]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => {
            const authorInitials = e.auteur
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "DF";
            const isInstant = e.date.includes("À l'instant");
            const isAdmin = e.role.toLowerCase().includes("admin");

            return (
              <TableRow
                key={e.id}
                onClick={() => onSelect(e.id)}
                className="group cursor-pointer border-b border-[var(--tbm-border)] transition-colors hover:bg-[#F3F7F5]/60"
              >
                {/* Date */}
                <TableCell className="whitespace-nowrap py-3.5 pl-5">
                  {isInstant ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      À l&apos;instant
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
                        <Clock className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-mono text-[12px] tabular-nums text-[var(--tbm-text)] font-medium">
                        {e.date}
                      </span>
                    </div>
                  )}
                </TableCell>

                {/* Auteur */}
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold shadow-2xs",
                        isAdmin
                          ? "bg-[#003B2D] text-[#9BE000]"
                          : "border border-neutral-200 bg-neutral-100 text-[#003B2D]"
                      )}
                    >
                      {authorInitials}
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate text-[12.5px] font-semibold text-[var(--tbm-text)]">
                        {e.auteur}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                        {e.role}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Action */}
                <TableCell>
                  <ActionBadge action={e.action} />
                </TableCell>

                {/* Objet */}
                <TableCell className="max-w-[220px]">
                  <span
                    className="block truncate text-[12.5px] font-semibold text-[#001D18] group-hover:text-[#003B2D] transition-colors"
                    title={e.objet}
                  >
                    {e.objet}
                  </span>
                </TableCell>

                {/* Détail */}
                <TableCell className="hidden max-w-[340px] lg:table-cell">
                  <span
                    className="block truncate text-[12px] leading-snug text-[var(--tbm-text-muted)]"
                    title={e.detail}
                  >
                    {e.detail}
                  </span>
                </TableCell>

                {/* Bouton d'action */}
                <TableCell className="pr-5">
                  <div className="flex justify-end">
                    <ActionIconButton
                      icon={Eye}
                      label="Voir l’entrée du journal"
                      tone="neutral"
                      onClick={() => onSelect(e.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {entries.length === 0 && (
            <EmptyRow colSpan={6} label={emptyLabel} />
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * A06 — Journal d’audit : qui a fait quoi, quand.
 * Les actions sensibles des autres modules s’affichent ici en direct
 * (chaque action du store alimente automatiquement ce journal).
 */
export function AuditLogPage() {
  const audit = useTbmStore((s) => s.audit);
  const { toast } = useToast();

  /* ---- Paramètres d’URL : onglet + entrée sélectionnée ---- */
  const [tabParam, setTabParam] = useParamState("tab", "journal");
  const tab = validParam(tabParam, TABS, "journal");
  const [selParam, setSelParam] = useParamState("sel", "");

  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  /* ---- KPIs du journal ---- */
  const kpis = useMemo(() => {
    const sensibles = audit.filter((e) =>
      SENSITIVE_ACTIONS.includes(e.action)
    ).length;
    const instant = audit.filter((e) =>
      e.date.includes("À l'instant")
    ).length;
    const auteurs = new Set(audit.map((e) => e.auteur)).size;
    return { total: audit.length, sensibles, instant, auteurs };
  }, [audit]);

  /* ---- Filtrage partagé (recherche + type d’action) ---- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return audit.filter((e) => {
      const matchQuery =
        q === "" ||
        e.auteur.toLowerCase().includes(q) ||
        e.objet.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q);
      const matchAction = actionFilter === "all" || e.action === actionFilter;
      return matchQuery && matchAction;
    });
  }, [audit, query, actionFilter]);

  const filteredSensitive = useMemo(
    () => filtered.filter((e) => SENSITIVE_ACTIONS.includes(e.action)),
    [filtered]
  );

  // Pagination des listes — hook partagé (reset à la page 1 quand filtres/onglet changent)
  // NB : l’export CSV reste alimenté par les listes filtrées complètes.
  const journalPg = useTablePagination(filtered, {
    resetKey: [query, actionFilter, tab].join("|"),
  });
  const sensiblesPg = useTablePagination(filteredSensitive, {
    resetKey: [query, actionFilter, tab].join("|"),
  });

  /* ---- Agrégat « Par type » ---- */
  const byType = useMemo(() => {
    const map = new Map<
      AuditAction,
      { nb: number; derniere: string; auteurs: Map<string, number> }
    >();
    for (const e of audit) {
      const cur = map.get(e.action) ?? {
        nb: 0,
        derniere: e.date,
        auteurs: new Map<string, number>(),
      };
      cur.nb += 1;
      cur.auteurs.set(e.auteur, (cur.auteurs.get(e.auteur) ?? 0) + 1);
      map.set(e.action, cur);
    }
    return [...map.entries()]
      .map(([action, v]) => {
        let topAuteur = "—";
        let topNb = 0;
        for (const [auteur, nb] of v.auteurs) {
          if (nb > topNb) {
            topAuteur = auteur;
            topNb = nb;
          }
        }
        return { action, nb: v.nb, derniere: v.derniere, topAuteur, topNb };
      })
      .sort((a, b) => b.nb - a.nb);
  }, [audit]);

  const typesPg = useTablePagination(byType, {
    resetKey: tab,
  });

  const selected = audit.find((e) => e.id === selParam) ?? null;

  /* ---- Export CSV des entrées affichées ---- */
  const exportRows =
    tab === "sensibles" ? filteredSensitive : filtered;

  const exportCsv = () => {
    const esc = (v: string) =>
      v.includes(";") || v.includes('"') || v.includes("\n")
        ? `"${v.replace(/"/g, '""')}"`
        : v;
    const header = "Date;Auteur;Rôle;Action;Objet;Détail";
    const rows = exportRows.map((e) =>
      [e.date, e.auteur, e.role, e.action, e.objet, e.detail]
        .map(esc)
        .join(";")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tbm-journal-audit.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export CSV généré",
      description: `${exportRows.length} entrée${exportRows.length > 1 ? "s" : ""} du journal exportée${exportRows.length > 1 ? "s" : ""} (date, auteur, rôle, action, objet, détail).`,
    });
  };

  const filtersBar = (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tbm-text-muted)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher (auteur, objet, détail)…"
          aria-label="Rechercher dans le journal"
          className="h-10 rounded-xl border-[var(--tbm-border)] bg-white pl-9 text-[12.5px] text-[var(--tbm-text)] placeholder:text-[var(--tbm-text-muted)] focus-visible:ring-[#9BE000] shadow-xs"
        />
      </div>
      <Select value={actionFilter} onValueChange={setActionFilter}>
        <SelectTrigger
          aria-label="Filtrer par type d’action"
          className="h-10 w-[180px] rounded-xl border-[var(--tbm-border)] bg-white text-[12.5px] text-[var(--tbm-text)] shadow-xs hover:border-neutral-300"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-[var(--tbm-border)]">
          <SelectItem value="all" className="rounded-lg text-[13px]">
            Toutes les actions
          </SelectItem>
          {ACTION_KEYS.map((a) => (
            <SelectItem key={a} value={a} className="rounded-lg text-[13px]">
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="ml-auto text-[12px] font-medium text-[var(--tbm-text-muted)]">
        {tab === "sensibles"
          ? `${filteredSensitive.length} entrée${filteredSensitive.length > 1 ? "s" : ""} sensible${filteredSensitive.length > 1 ? "s" : ""}`
          : `${filtered.length} entrée${filtered.length > 1 ? "s" : ""}`}
      </span>
    </div>
  );

  return (
    <div>
      {/* ---- En-tête ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#003B2D] text-[#9BE000] shadow-sm">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-[var(--tbm-text)] sm:text-[22px]">
              Journal d’audit
            </h2>
            <p className="text-[12px] text-[var(--tbm-text-muted)]">
              A06 — Qui a fait quoi, quand : remboursements, changements de prix, annulations… Les actions des autres modules s’affichent ici en direct.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          className="h-9 gap-1.5 rounded-xl border-[var(--tbm-border)] bg-white px-4 text-[12.5px] font-medium text-[var(--tbm-text)] shadow-xs hover:bg-[var(--tbm-background)]"
        >
          <Download className="h-4 w-4 text-[var(--tbm-text-muted)]" />
          Export CSV
        </Button>
      </div>

      {/* ---- Indicateurs ---- */}
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MiniKpi
          icon={ScrollText}
          label="Entrées au journal"
          value={String(kpis.total)}
          hint="toutes actions confondues"
          tone="bg-[#003B2D]/10 text-[#003B2D]"
        />
        <MiniKpi
          icon={ShieldAlert}
          label="Actions sensibles"
          value={String(kpis.sensibles)}
          hint="remboursement, litige, utilisateur, reversement…"
          tone="bg-rose-500/10 text-rose-600"
        />
        <MiniKpi
          icon={Clock3}
          label="Actions « À l’instant »"
          value={String(kpis.instant)}
          hint="réalisées pendant votre session"
          tone={kpis.instant > 0 ? "bg-[#003B2D]/10 text-[#003B2D]" : "bg-neutral-100 text-neutral-500"}
        />
        <MiniKpi
          icon={Users}
          label="Auteurs distincts"
          value={String(kpis.auteurs)}
          hint="membres du staff ayant agi au moins une fois"
          tone="bg-sky-500/10 text-sky-600"
        />
      </div>

      {/* ---- Onglets (synchronisés ?tab=) ---- */}
      <Tabs value={tab} onValueChange={(v) => setTabParam(v)}>
        <TabsList className="mt-5 h-auto p-1 rounded-xl border border-[var(--tbm-border)] bg-white/70 shadow-xs inline-flex gap-1 overflow-x-auto ff-scrollbar">
          <TabsTrigger
            value="journal"
            className="h-9 gap-2 rounded-lg px-4 text-[12.5px] font-semibold text-[var(--tbm-text-muted)] data-[state=active]:bg-[#003B2D] data-[state=active]:text-white shadow-none data-[state=active]:shadow-xs transition-colors"
          >
            <ScrollText className="h-3.5 w-3.5" />
            Journal complet
          </TabsTrigger>
          <TabsTrigger
            value="sensibles"
            className="h-9 gap-2 rounded-lg px-4 text-[12.5px] font-semibold text-[var(--tbm-text-muted)] data-[state=active]:bg-[#003B2D] data-[state=active]:text-white shadow-none data-[state=active]:shadow-xs transition-colors"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Actions sensibles
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9.5px] font-bold text-white">
              {kpis.sensibles}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="types"
            className="h-9 gap-2 rounded-lg px-4 text-[12.5px] font-semibold text-[var(--tbm-text-muted)] data-[state=active]:bg-[#003B2D] data-[state=active]:text-white shadow-none data-[state=active]:shadow-xs transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            Par type
          </TabsTrigger>
        </TabsList>

        {/* ============ Onglet Journal complet ============ */}
        <TabsContent value="journal" className="mt-4 space-y-3">
          {filtersBar}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-2xl border border-[var(--tbm-border)] bg-white shadow-xs"
          >
            <AuditTable
              entries={journalPg.pageItems}
              onSelect={setSelParam}
              emptyLabel="Aucune entrée du journal ne correspond à ces filtres."
            />
            <TablePagination
              page={journalPg.page}
              pageCount={journalPg.pageCount}
              onPageChange={journalPg.setPage}
              total={journalPg.total}
              from={journalPg.from}
              to={journalPg.to}
              pageSize={journalPg.pageSize}
              onPageSizeChange={journalPg.setPageSize}
              entity="entrée d’audit"
              entityPlural="entrées d’audit"
            />
          </motion.section>
        </TabsContent>

        {/* ============ Onglet Actions sensibles ============ */}
        <TabsContent value="sensibles" className="mt-4 space-y-3">
          {filtersBar}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-2xl border border-[var(--tbm-border)] bg-white shadow-xs"
          >
            <AuditTable
              entries={sensiblesPg.pageItems}
              onSelect={setSelParam}
              emptyLabel="Aucune action sensible ne correspond à ces filtres."
            />
            <TablePagination
              page={sensiblesPg.page}
              pageCount={sensiblesPg.pageCount}
              onPageChange={sensiblesPg.setPage}
              total={sensiblesPg.total}
              from={sensiblesPg.from}
              to={sensiblesPg.to}
              pageSize={sensiblesPg.pageSize}
              onPageSizeChange={sensiblesPg.setPageSize}
              entity="action"
            />
          </motion.section>
        </TabsContent>

        {/* ============ Onglet Par type ============ */}
        <TabsContent value="types" className="mt-4">
          <p className="mb-3 text-[12px] text-[var(--tbm-text-muted)]">
            Agrégat de toutes les entrées du journal, trié par nombre
            d’occurrences. Cliquez sur une ligne pour voir ces entrées dans le
            journal complet.
          </p>
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-2xl border border-[var(--tbm-border)] bg-white shadow-xs"
          >
            <div className="ff-scrollbar overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[var(--tbm-border)] bg-[#F3F7F5]/80 hover:bg-transparent">
                    <TableHead className="h-11 bg-transparent pl-5 text-xs font-semibold text-[var(--tbm-text)]">
                      Type d’action
                    </TableHead>
                    <TableHead className="h-11 bg-transparent text-right text-xs font-semibold text-[var(--tbm-text)]">
                      Entrées
                    </TableHead>
                    <TableHead className="h-11 bg-transparent text-xs font-semibold text-[var(--tbm-text)]">
                      Dernière occurrence
                    </TableHead>
                    <TableHead className="hidden h-11 bg-transparent text-xs font-semibold text-[var(--tbm-text)] sm:table-cell">
                      Auteur le plus fréquent
                    </TableHead>
                    <TableHead className="h-11 bg-transparent pr-5 text-right text-xs font-semibold text-[var(--tbm-text)]">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typesPg.pageItems.map((t) => {
                    const topInitials = t.topAuteur
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "DF";
                    return (
                      <TableRow
                        key={t.action}
                        onClick={() => {
                          setActionFilter(t.action);
                          setTabParam("journal");
                        }}
                        className="cursor-pointer border-b border-[var(--tbm-border)] transition-colors hover:bg-[#F3F7F5]/60"
                      >
                        <TableCell className="py-3.5 pl-5">
                          <ActionBadge action={t.action} />
                        </TableCell>
                        <TableCell className="text-right text-[13px] font-bold tabular-nums text-[var(--tbm-text)]">
                          {t.nb}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-[12px] tabular-nums text-[var(--tbm-text-muted)]">
                          {t.derniere}
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap text-[12.5px] font-medium text-[var(--tbm-text)] sm:table-cell">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#003B2D]/10 text-[10px] font-bold text-[#003B2D]">
                              {topInitials}
                            </span>
                            <span>{t.topAuteur}</span>
                            <span className="ml-1 text-[11px] font-normal text-[var(--tbm-text-muted)]">
                              ({t.topNb} entrée{t.topNb > 1 ? "s" : ""})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-5">
                          <div className="flex justify-end">
                            <ActionIconButton
                              icon={Eye}
                              label={`Voir les entrées « ${t.action} » dans le journal`}
                              tone="neutral"
                              onClick={() => {
                                setActionFilter(t.action);
                                setTabParam("journal");
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {byType.length === 0 && (
                    <EmptyRow
                      colSpan={5}
                      label="Le journal est vide pour le moment."
                    />
                  )}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              page={typesPg.page}
              pageCount={typesPg.pageCount}
              onPageChange={typesPg.setPage}
              total={typesPg.total}
              from={typesPg.from}
              to={typesPg.to}
              pageSize={typesPg.pageSize}
              onPageSizeChange={typesPg.setPageSize}
              entity="catégorie"
              entityPlural="catégories"
            />
          </motion.section>
        </TabsContent>
      </Tabs>

      {/* ===================== Fiche entrée ===================== */}
      <Sheet
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelParam("");
        }}
      >
        <SheetContent
          side="right"
          className="ff-scrollbar w-full gap-0 overflow-y-auto p-0 sm:max-w-[480px]"
        >
          {selected && (
            <>
              <div className="border-b border-[var(--tbm-border)] px-5 pb-4 pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <ActionBadge action={selected.action} />
                  <span className="rounded-lg bg-[var(--tbm-background)] px-2 py-0.5 font-mono text-[10.5px] font-semibold text-[var(--tbm-text-muted)]">
                    {selected.id}
                  </span>
                  {selected.date.includes("À l'instant") && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[#003B2D]/10 px-2 py-0.5 text-[11px] font-semibold text-[#003B2D]">
                      <Clock3 className="h-3 w-3" />
                      Session en cours
                    </span>
                  )}
                </div>
                <SheetTitle className="mt-3 text-[15.5px] font-bold tracking-tight text-neutral-900">
                  {selected.objet}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Entrée d’audit {selected.id} — {selected.action} par{" "}
                  {selected.auteur}.
                </SheetDescription>
                <p className="mt-0.5 text-[12px] tabular-nums text-neutral-400">
                  {selected.date}
                </p>
              </div>

              <div className="space-y-5 px-5 pb-8 pt-4">
                <section className="space-y-2">
                  <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                    Auteur de l’action
                  </h4>
                  <InfoRow
                    label="Auteur"
                    value={<span className="font-semibold">{selected.auteur}</span>}
                  />
                  <InfoRow label="Rôle" value={selected.role} />
                </section>

                <section className="space-y-2">
                  <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                    Détail de l’action
                  </h4>
                  <InfoRow label="Action" value={<ActionBadge action={selected.action} />} />
                  <InfoRow label="Objet" value={selected.objet} />
                  <div className="rounded-xl border border-neutral-200/70 px-4 py-3.5">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      Détail complet
                    </p>
                    <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-neutral-700">
                      {selected.detail}
                    </p>
                  </div>
                </section>

                <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50/70 p-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-[11.5px] leading-relaxed text-emerald-700">
                    Traçabilité complète des actions sensibles — A06 : chaque
                    remboursement, changement de prix, annulation ou
                    modification de compte est horodaté et signé (auteur +
                    rôle), sans exception.
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
