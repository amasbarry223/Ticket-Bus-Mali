"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Download,
  Scale,
  Search,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  formatFcfa,
  OPERATORS,
  PAYMENT_STATUS_META,
  transactions,
  type PaymentStatus,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";

/**
 * A02 — Supervision des transactions et rapprochement avec les
 * relevés des opérateurs (P03 : en attente, réussi, échoué, expiré, remboursé).
 */
export function TransactionsPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [operator, setOperator] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchQuery =
        q === "" ||
        t.id.toLowerCase().includes(q) ||
        t.compagnie.toLowerCase().includes(q);
      const matchOperator = operator === "all" || t.operateur === operator;
      const matchStatus = status === "all" || t.statut === (status as PaymentStatus);
      return matchQuery && matchOperator && matchStatus;
    });
  }, [query, operator, status]);

  /* Rapprochement (P05) : enregistré côté TBM vs relevé opérateurs (mock). */
  const recorded = useMemo(
    () =>
      transactions
        .filter((t) => t.statut === "reussi")
        .reduce((sum, t) => sum + t.montant, 0),
    []
  );
  const operatorStatement = recorded; // Concordance parfaite en démo
  const pending = useMemo(
    () => transactions.filter((t) => t.statut === "en_attente").length,
    []
  );
  const ecarts = operatorStatement - recorded;

  const exportCsv = () => {
    const header = "Reference;Date;Compagnie;Operateur;Montant (FCFA);Statut";
    const rows = filtered.map((t) =>
      [t.id, t.date, t.compagnie, t.operateur, t.montant, PAYMENT_STATUS_META[t.statut].label].join(";")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tbm-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export CSV généré",
      description: `${filtered.length} transaction(s) exportée(s) (relevé C09).`,
    });
  };

  const summary = [
    {
      label: "Enregistré côté TBM",
      value: formatFcfa(recorded),
      icon: ArrowLeftRight,
      tone: "bg-neutral-100 text-neutral-500",
    },
    {
      label: "Relevé opérateurs",
      value: formatFcfa(operatorStatement),
      icon: Download,
      tone: "bg-neutral-100 text-neutral-500",
    },
    {
      label: "Écart de rapprochement",
      value: formatFcfa(ecarts),
      icon: Scale,
      tone: "bg-emerald-50 text-emerald-600",
      ok: true,
    },
    {
      label: "Paiements en attente",
      value: `${pending} transaction${pending > 1 ? "s" : ""}`,
      icon: Clock,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            Transactions
          </h2>
          <p className="mt-0.5 text-[12.5px] text-neutral-400">
            A02 — Supervision et rapprochement avec les relevés Orange Money / Moov Money.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          className="h-9 gap-1.5 rounded-lg border-neutral-200 bg-white px-3.5 text-[13px] font-medium text-neutral-600 shadow-none hover:border-neutral-300 hover:text-neutral-800"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Bandeau rapprochement */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {summary.map((s) => (
          <div
            key={s.label}
            className="ff-card flex items-center gap-3.5 rounded-2xl border border-neutral-200/70 bg-white p-4"
          >
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", s.tone)}>
              {s.ok ? <CheckCircle2 className="h-[18px] w-[18px]" /> : <s.icon className="h-[18px] w-[18px]" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-medium text-neutral-400">
                {s.label}
              </span>
              <span className="block truncate text-[15.5px] font-bold tracking-tight text-neutral-900">
                {s.value}
              </span>
            </span>
          </div>
        ))}
      </motion.div>

      {/* Filtres */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (référence, compagnie)…"
            aria-label="Rechercher une transaction"
            className="h-9 rounded-xl border-neutral-200 bg-white pl-9 text-[13px] focus-visible:ring-coral-200"
          />
        </div>
        <Select value={operator} onValueChange={setOperator}>
          <SelectTrigger
            aria-label="Filtrer par opérateur"
            className="h-9 w-[160px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-neutral-100">
            <SelectItem value="all" className="rounded-lg text-[13px]">Tous opérateurs</SelectItem>
            {OPERATORS.map((o) => (
              <SelectItem key={o} value={o} className="rounded-lg text-[13px]">
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger
            aria-label="Filtrer par statut"
            className="h-9 w-[150px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-neutral-100">
            <SelectItem value="all" className="rounded-lg text-[13px]">Tous statuts</SelectItem>
            {Object.entries(PAYMENT_STATUS_META).map(([key, meta]) => (
              <SelectItem key={key} value={key} className="rounded-lg text-[13px]">
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-[12px] text-neutral-400">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
        </span>
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
                <TableHead className="h-11 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400">Référence</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Date</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Compagnie</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Opérateur</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-right text-xs font-medium text-neutral-400">Montant</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 pr-5 text-xs font-medium text-neutral-400">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="border-neutral-100 transition-colors hover:bg-neutral-50/70">
                  <TableCell className="py-3.5 pl-5 text-[13px] font-semibold tabular-nums text-neutral-700">
                    {t.id}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-neutral-400">{t.date}</TableCell>
                  <TableCell className="text-[12.5px] text-neutral-600">{t.compagnie}</TableCell>
                  <TableCell className="text-[12.5px] text-neutral-500">{t.operateur}</TableCell>
                  <TableCell className="text-right text-[13px] font-semibold tabular-nums text-neutral-800">
                    {formatFcfa(t.montant)}
                  </TableCell>
                  <TableCell className="pr-5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                        PAYMENT_STATUS_META[t.statut].className
                      )}
                    >
                      {PAYMENT_STATUS_META[t.statut].label}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-[13px] text-neutral-400">
                    Aucune transaction ne correspond à ces filtres.
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
