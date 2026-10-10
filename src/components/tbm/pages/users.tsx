"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Ban, CircleCheck, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useTbmStore } from "@/lib/tbm-store";
import type { BackofficeUser } from "@/components/tbm/data";
import { cn } from "@/lib/utils";

const ROLE_TONE: Record<BackofficeUser["role"], string> = {
  "Administrateur TBM": "bg-coral-50 text-coral-600",
  "Support TBM": "bg-sky-50 text-sky-600",
  "Gestionnaire de compagnie": "bg-violet-100 text-violet-600",
  "Agent de guichet": "bg-amber-50 text-amber-600",
  Contrôleur: "bg-emerald-50 text-emerald-600",
};

/**
 * A05 — Gestion des utilisateurs et des comptes bloqués.
 * Un Administrateur TBM ne peut pas être bloqué (protection RBAC).
 */
export function UsersPage() {
  const user = useAuthStore((s) => s.user);
  const users = useTbmStore((s) => s.users);
  const toggleUserBlock = useTbmStore((s) => s.toggleUserBlock);
  const { toast } = useToast();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return users;
    return users.filter(
      (u) =>
        u.nom.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.compagnie ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const handleToggle = (u: BackofficeUser) => {
    toggleUserBlock(u.id, user?.name ?? "Admin");
    toast({
      title: u.bloque ? "Compte débloqué" : "Compte bloqué",
      description: `${u.nom} — action tracée au journal d’audit.`,
    });
  };

  return (
    <div>
      <div>
        <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
          Utilisateurs
        </h2>
        <p className="mt-0.5 text-[12.5px] text-neutral-400">
          A05 — Gestion des utilisateurs et des comptes bloqués.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (nom, e-mail, rôle, compagnie)…"
            aria-label="Rechercher un utilisateur"
            className="h-9 rounded-xl border-neutral-200 bg-white pl-9 text-[13px] focus-visible:ring-coral-200"
          />
        </div>
        <span className="ml-auto text-[12px] text-neutral-400">
          {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}
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
                <TableHead className="h-11 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400">Utilisateur</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Rôle</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Compagnie</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Statut</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const isAdmin = u.role === "Administrateur TBM";
                const isSelf = u.email === user?.email;
                return (
                  <TableRow key={u.id} className="border-neutral-100 transition-colors hover:bg-neutral-50/70">
                    <TableCell className="py-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[12px] font-bold text-neutral-500">
                          {u.nom.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold text-neutral-800">
                            {u.nom}
                            {isSelf && (
                              <span className="ml-1.5 rounded bg-neutral-100 px-1 py-0.5 text-[10px] font-medium text-neutral-400">
                                vous
                              </span>
                            )}
                          </span>
                          <span className="block truncate text-[11.5px] text-neutral-400">{u.email}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                          ROLE_TONE[u.role]
                        )}
                      >
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-neutral-500">
                      {u.compagnie ?? <span className="text-neutral-300">—</span>}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                          u.bloque ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        )}
                      >
                        {u.bloque ? <Ban className="h-3 w-3" /> : <CircleCheck className="h-3 w-3" />}
                        {u.bloque ? "Bloqué" : "Actif"}
                      </span>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {isAdmin || isSelf ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11.5px] text-neutral-300"
                          title="Un administrateur TBM ne peut pas être bloqué"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Protégé
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggle(u)}
                          className={cn(
                            "h-8 rounded-lg border px-2.5 text-[12px] font-medium shadow-none",
                            u.bloque
                              ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              : "border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                          )}
                        >
                          {u.bloque ? "Débloquer" : "Bloquer"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </motion.section>
    </div>
  );
}
