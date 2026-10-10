"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Search, Undo2, XCircle } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useTbmStore } from "@/lib/tbm-store";
import {
  formatFcfa,
  REFUND_STATUS_META,
  type Refund,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";

/**
 * A03 — Remboursements manuels avec justification obligatoire et trace :
 * chaque décision alimente le journal d’audit.
 */
export function RefundsPage() {
  const user = useAuthStore((s) => s.user);
  const refunds = useTbmStore((s) => s.refunds);
  const processRefund = useTbmStore((s) => s.processRefund);
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [target, setTarget] = useState<Refund | null>(null);
  const [mode, setMode] = useState<"traiter" | "refuser">("traiter");
  const [justification, setJustification] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return refunds.filter((r) => {
      const matchQuery =
        q === "" ||
        r.id.toLowerCase().includes(q) ||
        r.passager.toLowerCase().includes(q) ||
        r.transaction.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" || r.statut === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [refunds, query, statusFilter]);

  const pending = refunds.filter((r) => r.statut === "en_attente");
  const totalTraite = refunds
    .filter((r) => r.statut === "traite")
    .reduce((s, r) => s + r.montant, 0);

  const openDialog = (refund: Refund, m: "traiter" | "refuser") => {
    setTarget(refund);
    setMode(m);
    setJustification("");
    setError(null);
  };

  const confirm = () => {
    if (justification.trim().length < 10) {
      setError("Justification requise (10 caractères minimum) — elle sera tracée au journal d’audit.");
      return;
    }
    if (!target) return;
    processRefund(
      target.id,
      justification.trim(),
      user?.name ?? "Agent TBM",
      mode === "refuser"
    );
    toast({
      title: mode === "traiter" ? "Remboursement validé" : "Remboursement refusé",
      description: `${target.id} — décision tracée au journal d’audit (A06).`,
    });
    setTarget(null);
  };

  return (
    <div>
      <div>
        <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
          Remboursements
        </h2>
        <p className="mt-0.5 text-[12.5px] text-neutral-400">
          A03 — Remboursements manuels avec justification et trace.
        </p>
      </div>

      {/* Résumé */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className="ff-card flex items-center gap-3.5 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Clock className="h-[18px] w-[18px]" />
          </span>
          <span>
            <span className="block text-[12px] font-medium text-amber-700/80">En attente de traitement</span>
            <span className="block text-[15.5px] font-bold tracking-tight text-neutral-900">
              {pending.length} demande{pending.length > 1 ? "s" : ""}
            </span>
          </span>
        </div>
        <div className="ff-card flex items-center gap-3.5 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-[18px] w-[18px]" />
          </span>
          <span>
            <span className="block text-[12px] font-medium text-emerald-700/80">Total remboursé (traités)</span>
            <span className="block text-[15.5px] font-bold tracking-tight text-neutral-900">
              {formatFcfa(totalTraite)}
            </span>
          </span>
        </div>
        <div className="ff-card flex items-center gap-3.5 rounded-2xl border border-neutral-200/70 bg-white p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
            <Undo2 className="h-[18px] w-[18px]" />
          </span>
          <span>
            <span className="block text-[12px] font-medium text-neutral-400">Demandes au total</span>
            <span className="block text-[15.5px] font-bold tracking-tight text-neutral-900">
              {refunds.length}
            </span>
          </span>
        </div>
      </motion.div>

      {/* Filtres */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (réf., passager, transaction)…"
            aria-label="Rechercher un remboursement"
            className="h-9 rounded-xl border-neutral-200 bg-white pl-9 text-[13px] focus-visible:ring-coral-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            aria-label="Filtrer par statut"
            className="h-9 w-[150px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
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
      </div>

      {/* Table */}
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
                <TableHead className="h-11 bg-neutral-50/60 text-right text-xs font-medium text-neutral-400">Montant</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Statut</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="border-neutral-100 align-top transition-colors hover:bg-neutral-50/70">
                  <TableCell className="py-3.5 pl-5">
                    <span className="block text-[13px] font-semibold tabular-nums text-neutral-700">{r.id}</span>
                    <span className="block text-[11px] text-neutral-400">{r.transaction} · {r.demande}</span>
                  </TableCell>
                  <TableCell className="pt-3.5 text-[12.5px] text-neutral-600">{r.passager}</TableCell>
                  <TableCell className="max-w-[260px] pt-3.5">
                    <span className="block truncate text-[12.5px] text-neutral-500" title={r.motif}>
                      {r.motif}
                    </span>
                    {r.justification && (
                      <span className="mt-0.5 block truncate text-[11px] italic text-neutral-400" title={r.justification}>
                        « {r.justification} » — {r.traitePar}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="pt-3.5 text-right text-[13px] font-semibold tabular-nums text-neutral-800">
                    {formatFcfa(r.montant)}
                  </TableCell>
                  <TableCell className="pt-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                        REFUND_STATUS_META[r.statut].className
                      )}
                    >
                      {REFUND_STATUS_META[r.statut].label}
                    </span>
                  </TableCell>
                  <TableCell className="pr-5 pt-3 text-right">
                    {r.statut === "en_attente" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => openDialog(r, "traiter")}
                          className="h-8 rounded-lg bg-emerald-500 px-2.5 text-[12px] font-medium text-white shadow-sm hover:bg-emerald-600"
                        >
                          Traiter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(r, "refuser")}
                          className="h-8 rounded-lg border-neutral-200 px-2.5 text-[12px] font-medium text-rose-500 shadow-none hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        >
                          Refuser
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11.5px] text-neutral-300">Clôturé</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-[13px] text-neutral-400">
                    Aucun remboursement ne correspond à ces filtres.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.section>

      {/* Dialogue de traitement / refus */}
      <Dialog open={target != null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="rounded-2xl sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[16px]">
              {mode === "traiter" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Valider le remboursement {target?.id}
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-rose-500" />
                  Refuser le remboursement {target?.id}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] leading-relaxed">
              {target && (
                <>
                  {target.passager} — {formatFcfa(target.montant)} · Motif : {target.motif}.
                  {mode === "traiter" && " Le montant sera reversé vers le compte mobile money d’origine (P06)."}
                </>
              )}
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
              placeholder="Ex. : départ annulé par la compagnie, remboursement intégral conforme au RG6…"
              className="rounded-xl border-neutral-200 text-[13px] focus-visible:ring-coral-200"
            />
            {error && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-600">
                {error}
              </p>
            )}
            <p className="text-[11.5px] text-neutral-400">
              La justification sera enregistrée au journal d’audit avec votre nom (RG — trace obligatoire).
            </p>
          </div>
          <DialogFooter className="gap-2 pt-1">
            <Button
              variant="outline"
              onClick={() => setTarget(null)}
              className="h-9 rounded-xl border-neutral-200 text-[13px]"
            >
              Annuler
            </Button>
            <Button
              onClick={confirm}
              className={cn(
                "h-9 rounded-xl text-[13px] font-medium text-white shadow-md active:scale-[0.98]",
                mode === "traiter"
                  ? "bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600"
                  : "bg-rose-500 shadow-rose-500/30 hover:bg-rose-600"
              )}
            >
              {mode === "traiter" ? "Valider le remboursement" : "Confirmer le refus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
