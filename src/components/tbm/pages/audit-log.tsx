"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ScrollText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTbmStore } from "@/lib/tbm-store";
import {
  AUDIT_ACTION_META,
  type AuditAction,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";

const ACTION_KEYS = Object.keys(AUDIT_ACTION_META) as AuditAction[];

/**
 * A06 — Journal d’audit : qui a fait quoi, quand
 * (remboursements, changements de prix, annulations…).
 * Les actions réalisées dans les autres pages s’affichent ici en direct.
 */
export function AuditLogPage() {
  const audit = useTbmStore((s) => s.audit);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

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

  return (
    <div>
      <div>
        <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
          Journal d’audit
        </h2>
        <p className="mt-0.5 text-[12.5px] text-neutral-400">
          A06 — Qui a fait quoi, quand : remboursements, changements de prix, annulations…
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (auteur, objet, détail)…"
            aria-label="Rechercher dans le journal"
            className="h-9 rounded-xl border-neutral-200 bg-white pl-9 text-[13px] focus-visible:ring-coral-200"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger
            aria-label="Filtrer par type d’action"
            className="h-9 w-[170px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-neutral-100">
            <SelectItem value="all" className="rounded-lg text-[13px]">Toutes les actions</SelectItem>
            {ACTION_KEYS.map((a) => (
              <SelectItem key={a} value={a} className="rounded-lg text-[13px]">
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-[12px] text-neutral-400">
          {filtered.length} entrée{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="ff-card mt-3 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
      >
        <div className="ff-scrollbar max-h-[560px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                <TableHead className="h-11 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400 backdrop-blur">Date</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 backdrop-blur">Auteur</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 backdrop-blur">Action</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 backdrop-blur">Objet</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 pr-5 text-xs font-medium text-neutral-400 backdrop-blur">Détail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id} className="border-neutral-100 transition-colors hover:bg-neutral-50/70">
                  <TableCell className="whitespace-nowrap py-3.5 pl-5 text-[12px] tabular-nums text-neutral-400">
                    {e.date}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="block text-[12.5px] font-semibold text-neutral-700">{e.auteur}</span>
                    <span className="block text-[11px] text-neutral-400">{e.role}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold",
                        AUDIT_ACTION_META[e.action].className
                      )}
                    >
                      <ScrollText className="h-3 w-3" />
                      {e.action}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-[12.5px] font-medium text-neutral-700">
                    {e.objet}
                  </TableCell>
                  <TableCell className="max-w-[340px] pr-5">
                    <span className="block text-[12.5px] leading-snug text-neutral-500">
                      {e.detail}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-[13px] text-neutral-400">
                    Aucune entrée du journal ne correspond à ces filtres.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.section>
    </div>
  );
}
