"use client";

import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Ban,
  Building2,
  CheckCircle2,
  EllipsisVertical,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useTbmStore } from "@/lib/tbm-store";
import {
  cities,
  COMPANY_STATUS_META,
  formatNumber,
  type CompanyStatus,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";

/**
 * A01 — Gestion des compagnies : création, activation, suspension,
 * paramètres commerciaux (commission).
 */
export function CompaniesPage() {
  const user = useAuthStore((s) => s.user);
  const companies = useTbmStore((s) => s.companies);
  const setCompanyStatus = useTbmStore((s) => s.setCompanyStatus);
  const addCompany = useTbmStore((s) => s.addCompany);
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", ville: "", contact: "", commission: "10" });
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((c) => {
      const matchQuery =
        q === "" ||
        c.nom.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        c.ville.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" || c.statut === (statusFilter as CompanyStatus);
      return matchQuery && matchStatus;
    });
  }, [companies, query, statusFilter]);

  const changeStatus = (id: string, statut: CompanyStatus) => {
    setCompanyStatus(id, statut, user?.name ?? "Admin");
    const label = COMPANY_STATUS_META[statut].label.toLowerCase();
    toast({
      title: "Compagnie mise à jour",
      description: `Le statut a été passé à « ${label} » — action enregistrée au journal d’audit.`,
    });
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.nom.trim() || !form.ville.trim() || !form.contact.trim()) {
      setFormError("Nom, ville et contact sont obligatoires.");
      return;
    }
    const commission = Math.min(Math.max(Number(form.commission) || 0, 0), 50);
    addCompany(
      {
        id: `CPG-${String(companies.length + 1).padStart(3, "0")}`,
        nom: form.nom.trim(),
        contact: form.contact.trim(),
        ville: form.ville,
        commission,
        ticketsMois: 0,
        statut: "attente",
      },
      user?.name ?? "Admin"
    );
    setCreateOpen(false);
    setForm({ nom: "", ville: "", contact: "", commission: "10" });
    toast({
      title: "Compagnie créée",
      description: "Elle est en attente de validation et visible dans la liste.",
    });
  };

  return (
    <div>
      {/* En-tête + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            Compagnies
          </h2>
          <p className="mt-0.5 text-[12.5px] text-neutral-400">
            A01 — Création, activation, suspension et paramètres commerciaux.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 gap-1.5 rounded-lg bg-coral-500 px-3.5 text-[13px] font-medium text-white shadow-md shadow-coral-500/30 transition-all hover:bg-coral-600 active:scale-[0.98]">
              <Plus className="h-4 w-4" />
              Nouvelle compagnie
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="text-[16px]">Nouvelle compagnie</DialogTitle>
              <DialogDescription className="text-[12.5px]">
                La compagnie est créée en « attente » jusqu’à activation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3.5" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="c-nom" className="text-[13px]">Nom de la compagnie</Label>
                <Input
                  id="c-nom"
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex. : Niger Transit"
                  className="h-9.5 rounded-xl border-neutral-200 focus-visible:ring-coral-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Ville principale</Label>
                  <Select
                    value={form.ville}
                    onValueChange={(v) => setForm((f) => ({ ...f, ville: v }))}
                  >
                    <SelectTrigger className="h-9.5 w-full rounded-xl border-neutral-200 focus:ring-coral-200">
                      <SelectValue placeholder="Choisir…" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-neutral-100">
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.nom} className="rounded-lg text-[13px]">
                          {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-com" className="text-[13px]">Commission (%)</Label>
                  <Input
                    id="c-com"
                    type="number"
                    min={0}
                    max={50}
                    value={form.commission}
                    onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))}
                    className="h-9.5 rounded-xl border-neutral-200 focus-visible:ring-coral-200"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-contact" className="text-[13px]">E-mail de contact</Label>
                <Input
                  id="c-contact"
                  type="email"
                  value={form.contact}
                  onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                  placeholder="contact@compagnie.ml"
                  className="h-9.5 rounded-xl border-neutral-200 focus-visible:ring-coral-200"
                />
              </div>
              {formError && (
                <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-600">
                  {formError}
                </p>
              )}
              <DialogFooter className="gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  className="h-9 rounded-xl border-neutral-200 text-[13px]"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="h-9 rounded-xl bg-coral-500 text-[13px] font-medium text-white shadow-md shadow-coral-500/30 hover:bg-coral-600"
                >
                  Créer la compagnie
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (nom, contact, ville)…"
            aria-label="Rechercher une compagnie"
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
            <SelectItem value="all" className="rounded-lg text-[13px]">Tous les statuts</SelectItem>
            {Object.entries(COMPANY_STATUS_META).map(([key, meta]) => (
              <SelectItem key={key} value={key} className="rounded-lg text-[13px]">
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-[12px] text-neutral-400">
          {filtered.length} compagnie{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
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
                  Compagnie
                </TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Contact</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Ville</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-right text-xs font-medium text-neutral-400">Commission</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-right text-xs font-medium text-neutral-400">Tickets / mois</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">Statut</TableHead>
                <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="border-neutral-100 transition-colors hover:bg-neutral-50/70">
                  <TableCell className="py-3.5 pl-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-500">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-[13px] font-semibold text-neutral-800">{c.nom}</span>
                        <span className="block text-[11px] text-neutral-400">{c.id}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12.5px] text-neutral-500">{c.contact}</TableCell>
                  <TableCell className="text-[12.5px] text-neutral-500">{c.ville}</TableCell>
                  <TableCell className="text-right text-[12.5px] font-semibold tabular-nums text-neutral-700">
                    {c.commission} %
                  </TableCell>
                  <TableCell className="text-right text-[12.5px] font-semibold tabular-nums text-neutral-700">
                    {formatNumber(c.ticketsMois)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                        COMPANY_STATUS_META[c.statut].className
                      )}
                    >
                      {COMPANY_STATUS_META[c.statut].label}
                    </span>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions pour ${c.nom}`}
                          className="h-8 w-8 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                        >
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl border-neutral-100">
                        {c.statut !== "active" && (
                          <DropdownMenuItem
                            onClick={() => changeStatus(c.id, "active")}
                            className="gap-2 rounded-lg text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Activer
                          </DropdownMenuItem>
                        )}
                        {c.statut !== "suspendue" && (
                          <DropdownMenuItem
                            onClick={() => changeStatus(c.id, "suspendue")}
                            className="gap-2 rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                          >
                            <Ban className="h-4 w-4" />
                            Suspendre
                          </DropdownMenuItem>
                        )}
                        {c.statut !== "attente" && (
                          <DropdownMenuItem
                            onClick={() => changeStatus(c.id, "attente")}
                            className="gap-2 rounded-lg text-amber-600 focus:bg-amber-50 focus:text-amber-600"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                            Remettre en attente
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-[13px] text-neutral-400">
                    Aucune compagnie ne correspond à votre recherche.
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
