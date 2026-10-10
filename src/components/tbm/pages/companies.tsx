"use client";

import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  BadgePercent,
  Ban,
  Building2,
  Bus,
  CheckCircle2,
  EllipsisVertical,
  Eye,
  Hourglass,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Route,
  Search,
  Ticket,
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
  DropdownMenuSeparator,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
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
import { useAuthStore } from "@/lib/auth-store";
import { useTbmStore } from "@/lib/tbm-store";
import {
  BUS_STATUS_META,
  cities,
  COMPANY_STATUS_META,
  companyBuses,
  companyDepartures,
  companyEvents,
  companyInitials,
  companyLines,
  companyLogoColor,
  DEFAULT_SALES_PARAMS,
  DEPARTURE_STATUS_META,
  formatFcfa,
  formatNumber,
  type Company,
  type CompanyStatus,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";

/* ======================= Formulaire (créer / modifier) ====================== */

interface CompanyForm {
  nom: string;
  ville: string;
  contact: string;
  telephone: string;
  adresse: string;
  commission: string;
  venteEnLigne: boolean;
  venteGuichet: boolean;
  reservationJours: string;
  annulationGratuite: string;
}

const emptyForm: CompanyForm = {
  nom: "",
  ville: "",
  contact: "",
  telephone: "",
  adresse: "",
  commission: "10",
  venteEnLigne: true,
  venteGuichet: true,
  reservationJours: "30",
  annulationGratuite: "24",
};

function formFromCompany(c: Company): CompanyForm {
  return {
    nom: c.nom,
    ville: c.ville,
    contact: c.contact,
    telephone: c.telephone,
    adresse: c.adresse,
    commission: String(c.commission),
    venteEnLigne: c.params.venteEnLigne,
    venteGuichet: c.params.venteGuichet,
    reservationJours: String(c.params.reservationJours),
    annulationGratuite: String(c.params.annulationGratuite),
  };
}

function CompanyFormFields({
  form,
  set,
  prefix,
}: {
  form: CompanyForm;
  set: (patch: Partial<CompanyForm>) => void;
  prefix: string;
}) {
  const inputCls =
    "h-9.5 rounded-xl border-neutral-200 focus-visible:ring-coral-200";
  return (
    <div className="space-y-3.5">
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-nom`} className="text-[13px]">
          Nom de la compagnie
        </Label>
        <Input
          id={`${prefix}-nom`}
          value={form.nom}
          onChange={(e) => set({ nom: e.target.value })}
          placeholder="Ex. : Niger Transit"
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[13px]">Ville principale</Label>
          <Select value={form.ville} onValueChange={(v) => set({ ville: v })}>
            <SelectTrigger className="h-9.5 w-full rounded-xl border-neutral-200 focus:ring-coral-200">
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-neutral-100">
              {cities.map((c) => (
                <SelectItem
                  key={c.id}
                  value={c.nom}
                  className="rounded-lg text-[13px]"
                >
                  {c.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-com`} className="text-[13px]">
            Commission (%)
          </Label>
          <Input
            id={`${prefix}-com`}
            type="number"
            min={0}
            max={50}
            value={form.commission}
            onChange={(e) => set({ commission: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-mail`} className="text-[13px]">
            E-mail de contact
          </Label>
          <Input
            id={`${prefix}-mail`}
            type="email"
            value={form.contact}
            onChange={(e) => set({ contact: e.target.value })}
            placeholder="contact@compagnie.ml"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-tel`} className="text-[13px]">
            Téléphone
          </Label>
          <Input
            id={`${prefix}-tel`}
            type="tel"
            value={form.telephone}
            onChange={(e) => set({ telephone: e.target.value })}
            placeholder="+223 76 00 00 00"
            className={inputCls}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-adr`} className="text-[13px]">
          Adresse (siège ou gare)
        </Label>
        <Input
          id={`${prefix}-adr`}
          value={form.adresse}
          onChange={(e) => set({ adresse: e.target.value })}
          placeholder="Ex. : Rue 224, Hamdallaye ACI 2000"
          className={inputCls}
        />
      </div>

      {/* Paramètres de vente */}
      <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-3.5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
          Paramètres de vente
        </p>
        <div className="mt-3 grid gap-2.5">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-neutral-200/70">
            <Label
              htmlFor={`${prefix}-ligne`}
              className="cursor-pointer text-[12.5px] font-medium text-neutral-700"
            >
              Vente en ligne
              <span className="block text-[11px] font-normal text-neutral-400">
                Orange Money · Moov Money
              </span>
            </Label>
            <Switch
              id={`${prefix}-ligne`}
              checked={form.venteEnLigne}
              onCheckedChange={(v) => set({ venteEnLigne: v })}
              className="data-[state=checked]:bg-coral-500"
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-neutral-200/70">
            <Label
              htmlFor={`${prefix}-guichet`}
              className="cursor-pointer text-[12.5px] font-medium text-neutral-700"
            >
              Vente au guichet
              <span className="block text-[11px] font-normal text-neutral-400">
                Points de vente physiques
              </span>
            </Label>
            <Switch
              id={`${prefix}-guichet`}
              checked={form.venteGuichet}
              onCheckedChange={(v) => set({ venteGuichet: v })}
              className="data-[state=checked]:bg-coral-500"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`${prefix}-resa`} className="text-[12.5px]">
                Réservation à l’avance (jours)
              </Label>
              <Input
                id={`${prefix}-resa`}
                type="number"
                min={1}
                max={90}
                value={form.reservationJours}
                onChange={(e) => set({ reservationJours: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${prefix}-annul`} className="text-[12.5px]">
                Annulation sans frais (heures)
              </Label>
              <Input
                id={`${prefix}-annul`}
                type="number"
                min={0}
                max={72}
                value={form.annulationGratuite}
                onChange={(e) => set({ annulationGratuite: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================= Pièces présentationnelles ======================= */

function CompanyAvatar({
  company,
  className,
}: {
  company: Company;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl font-bold ring-1",
        companyLogoColor(company.id),
        className ?? "h-9 w-9 text-[12.5px]"
      )}
    >
      {companyInitials(company.nom)}
    </span>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-neutral-50/70 px-3 py-2.5 ring-1 ring-neutral-200/60">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
      <span className="min-w-0">
        <span className="block text-[10.5px] font-medium uppercase tracking-wide text-neutral-400">
          {label}
        </span>
        <span className="block truncate text-[12.5px] font-medium text-neutral-700">
          {value}
        </span>
      </span>
    </div>
  );
}

function ParamRow({
  label,
  hint,
  active,
  value,
}: {
  label: string;
  hint?: string;
  active?: boolean;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
      <span>
        <span className="block text-[12.5px] font-medium text-neutral-700">
          {label}
        </span>
        {hint && (
          <span className="block text-[11px] text-neutral-400">{hint}</span>
        )}
      </span>
      {active !== undefined ? (
        <span
          className={cn(
            "flex items-center gap-1.5 text-[11.5px] font-semibold",
            active ? "text-emerald-600" : "text-neutral-400"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              active ? "bg-emerald-500" : "bg-neutral-300"
            )}
          />
          {active ? "Activé" : "Désactivé"}
        </span>
      ) : (
        <span className="text-[12px] font-semibold tabular-nums text-neutral-600">
          {value}
        </span>
      )}
    </div>
  );
}

function EmptyHint({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-200 py-6 text-center">
      <Icon className="h-5 w-5 text-neutral-300" />
      <p className="px-4 text-[12px] text-neutral-400">{text}</p>
    </div>
  );
}

function MiniKpi({
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
  tone: "coral" | "amber" | "emerald" | "neutral";
  index: number;
}) {
  const tones: Record<string, string> = {
    coral: "group-hover:bg-coral-50 group-hover:text-coral-500",
    amber: "group-hover:bg-amber-50 group-hover:text-amber-600",
    emerald: "group-hover:bg-emerald-50 group-hover:text-emerald-600",
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

function SheetSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
      {children}
    </h4>
  );
}

/* ================================ Page A01 ================================ */

/**
 * A01 — Compagnies de transport : liste des partenaires, création,
 * modification, activation/suspension, coordonnées & logo, paramètres
 * commerciaux, historique (activités + incidents) et consultation
 * des bus, lignes et départs.
 */
export function CompaniesPage() {
  const user = useAuthStore((s) => s.user);
  const companies = useTbmStore((s) => s.companies);
  const setCompanyStatus = useTbmStore((s) => s.setCompanyStatus);
  const addCompany = useTbmStore((s) => s.addCompany);
  const updateCompany = useTbmStore((s) => s.updateCompany);
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CompanyForm>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CompanyForm>(emptyForm);
  const [editError, setEditError] = useState<string | null>(null);

  const selected = companies.find((c) => c.id === selectedId) ?? null;
  const editing = companies.find((c) => c.id === editingId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((c) => {
      const matchQuery =
        q === "" ||
        c.nom.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        c.telephone.toLowerCase().includes(q) ||
        c.ville.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" || c.statut === (statusFilter as CompanyStatus);
      return matchQuery && matchStatus;
    });
  }, [companies, query, statusFilter]);

  const kpis = useMemo(() => {
    const actives = companies.filter((c) => c.statut === "active").length;
    const attente = companies.filter((c) => c.statut === "attente").length;
    const suspendues = companies.filter((c) => c.statut === "suspendue").length;
    const total = companies.length;
    const commissionMoy = total
      ? Math.round(companies.reduce((a, c) => a + c.commission, 0) / total)
      : 0;
    const tickets = companies.reduce((a, c) => a + c.ticketsMois, 0);
    return { actives, attente, suspendues, total, commissionMoy, tickets };
  }, [companies]);

  const detail = useMemo(() => {
    const buses = selected
      ? companyBuses.filter((b) => b.compagnie === selected.id)
      : [];
    const lignes = selected
      ? companyLines.filter((l) => l.compagnie === selected.id)
      : [];
    const departs = selected
      ? companyDepartures.filter(
          (d) => d.compagnie === selected.id && d.statut !== "termine"
        )
      : [];
    const events = selected
      ? companyEvents.filter((e) => e.compagnie === selected.id)
      : [];
    return { buses, lignes, departs, events };
  }, [selected]);

  const changeStatus = (c: Company, statut: CompanyStatus) => {
    setCompanyStatus(c.id, statut, user?.name ?? "Admin");
    const label = COMPANY_STATUS_META[statut].label.toLowerCase();
    toast({
      title: "Compagnie mise à jour",
      description: `« ${c.nom} » est passée à « ${label} » — action enregistrée au journal d’audit.`,
    });
  };

  const openEdit = (c: Company) => {
    setEditForm(formFromCompany(c));
    setEditError(null);
    setEditingId(c.id);
  };

  const submitCreate = (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (
      !createForm.nom.trim() ||
      !createForm.ville.trim() ||
      !createForm.contact.trim() ||
      !createForm.telephone.trim()
    ) {
      setCreateError("Nom, ville, e-mail et téléphone sont obligatoires.");
      return;
    }
    const clamp = (v: number, lo: number, hi: number) =>
      Math.min(Math.max(v, lo), hi);
    const commission = clamp(Number(createForm.commission) || 0, 0, 50);
    addCompany(
      {
        id: `CPG-${String(companies.length + 1).padStart(3, "0")}`,
        nom: createForm.nom.trim(),
        contact: createForm.contact.trim(),
        telephone: createForm.telephone.trim(),
        adresse: createForm.adresse.trim(),
        ville: createForm.ville,
        commission,
        ticketsMois: 0,
        statut: "attente",
        params: {
          venteEnLigne: createForm.venteEnLigne,
          venteGuichet: createForm.venteGuichet,
          reservationJours: clamp(
            Math.round(Number(createForm.reservationJours) || 30),
            1,
            90
          ),
          annulationGratuite: clamp(
            Math.round(Number(createForm.annulationGratuite) || 24),
            0,
            72
          ),
        },
      },
      user?.name ?? "Admin"
    );
    setCreateOpen(false);
    setCreateForm(emptyForm);
    toast({
      title: "Compagnie créée",
      description:
        "Elle est en attente de validation et visible dans la liste.",
    });
  };

  const submitEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);
    if (
      !editForm.nom.trim() ||
      !editForm.ville.trim() ||
      !editForm.contact.trim() ||
      !editForm.telephone.trim()
    ) {
      setEditError("Nom, ville, e-mail et téléphone sont obligatoires.");
      return;
    }
    const clamp = (v: number, lo: number, hi: number) =>
      Math.min(Math.max(v, lo), hi);
    updateCompany(
      editing.id,
      {
        nom: editForm.nom.trim(),
        contact: editForm.contact.trim(),
        telephone: editForm.telephone.trim(),
        adresse: editForm.adresse.trim(),
        ville: editForm.ville,
        commission: clamp(Number(editForm.commission) || 0, 0, 50),
        params: {
          venteEnLigne: editForm.venteEnLigne,
          venteGuichet: editForm.venteGuichet,
          reservationJours: clamp(
            Math.round(Number(editForm.reservationJours) || 30),
            1,
            90
          ),
          annulationGratuite: clamp(
            Math.round(Number(editForm.annulationGratuite) || 24),
            0,
            72
          ),
        },
      },
      user?.name ?? "Admin"
    );
    setEditingId(null);
    toast({
      title: "Fiche mise à jour",
      description: `Les informations de « ${editForm.nom.trim()} » ont été enregistrées et tracées au journal.`,
    });
  };

  return (
    <div>
      {/* ---- En-tête + action ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            Compagnies de transport
          </h2>
          <p className="mt-0.5 text-[12.5px] text-neutral-400">
            A01 — Compagnies partenaires : fiches, paramètres commerciaux,
            flotte et suivi des incidents.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 gap-1.5 rounded-lg bg-coral-500 px-3.5 text-[13px] font-medium text-white shadow-md shadow-coral-500/30 transition-all hover:bg-coral-600 active:scale-[0.98]">
              <Plus className="h-4 w-4" />
              Nouvelle compagnie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="text-[16px]">
                Nouvelle compagnie
              </DialogTitle>
              <DialogDescription className="text-[12.5px]">
                La compagnie est créée en « attente » jusqu’à activation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitCreate} className="space-y-3.5" noValidate>
              <CompanyFormFields
                form={createForm}
                set={(patch) => setCreateForm((f) => ({ ...f, ...patch }))}
                prefix="c-new"
              />
              {createError && (
                <p
                  role="alert"
                  className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-600"
                >
                  {createError}
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

      {/* ---- Indicateurs ---- */}
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MiniKpi
          index={0}
          label="Partenaires actifs"
          value={`${kpis.actives} / ${kpis.total}`}
          hint="compagnies autorisées à vendre"
          icon={Building2}
          tone="coral"
        />
        <MiniKpi
          index={1}
          label="En attente de validation"
          value={String(kpis.attente)}
          hint={
            kpis.suspendues > 0
              ? `${kpis.suspendues} suspendue${kpis.suspendues > 1 ? "s" : ""} actuellement`
              : "aucune suspension en cours"
          }
          icon={Hourglass}
          tone="amber"
        />
        <MiniKpi
          index={2}
          label="Commission moyenne"
          value={`${kpis.commissionMoy} %`}
          hint="toutes compagnies confondues"
          icon={BadgePercent}
          tone="emerald"
        />
        <MiniKpi
          index={3}
          label="Tickets ce mois"
          value={formatNumber(kpis.tickets)}
          hint="cumul des compagnies"
          icon={Ticket}
          tone="neutral"
        />
      </div>

      {/* ---- Filtres ---- */}
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
            <SelectItem value="all" className="rounded-lg text-[13px]">
              Tous les statuts
            </SelectItem>
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

      {/* ---- Liste des compagnies partenaires ---- */}
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
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                  Coordonnées
                </TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                  Ville
                </TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-right text-xs font-medium text-neutral-400">
                  Commission
                </TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-right text-xs font-medium text-neutral-400">
                  Tickets / mois
                </TableHead>
                <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400">
                  Statut
                </TableHead>
                <TableHead className="h-11 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="cursor-pointer border-neutral-100 transition-colors hover:bg-neutral-50/70"
                >
                  <TableCell className="py-3.5 pl-5">
                    <div className="flex items-center gap-3">
                      <CompanyAvatar company={c} />
                      <span>
                        <span className="block text-[13px] font-semibold text-neutral-800">
                          {c.nom}
                        </span>
                        <span className="block text-[11px] text-neutral-400">
                          {c.id}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate text-[12.5px] text-neutral-600">
                      {c.contact}
                    </span>
                    <span className="block text-[11px] tabular-nums text-neutral-400">
                      {c.telephone}
                    </span>
                  </TableCell>
                  <TableCell className="text-[12.5px] text-neutral-500">
                    {c.ville}
                  </TableCell>
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
                    <span
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex"
                    >
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
                        <DropdownMenuContent
                          align="end"
                          className="w-52 rounded-xl border-neutral-100"
                        >
                          <DropdownMenuItem
                            onClick={() => setSelectedId(c.id)}
                            className="gap-2 rounded-lg text-neutral-700 focus:bg-neutral-100 focus:text-neutral-900"
                          >
                            <Eye className="h-4 w-4" />
                            Voir la fiche
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEdit(c)}
                            className="gap-2 rounded-lg text-neutral-700 focus:bg-neutral-100 focus:text-neutral-900"
                          >
                            <Pencil className="h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-neutral-100" />
                          {c.statut !== "active" && (
                            <DropdownMenuItem
                              onClick={() => changeStatus(c, "active")}
                              className="gap-2 rounded-lg text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Activer
                            </DropdownMenuItem>
                          )}
                          {c.statut !== "suspendue" && (
                            <DropdownMenuItem
                              onClick={() => changeStatus(c, "suspendue")}
                              className="gap-2 rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                            >
                              <Ban className="h-4 w-4" />
                              Suspendre
                            </DropdownMenuItem>
                          )}
                          {c.statut !== "attente" && (
                            <DropdownMenuItem
                              onClick={() => changeStatus(c, "attente")}
                              className="gap-2 rounded-lg text-amber-600 focus:bg-amber-50 focus:text-amber-600"
                            >
                              <Hourglass className="h-4 w-4" />
                              Remettre en attente
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-[13px] text-neutral-400"
                  >
                    Aucune compagnie ne correspond à votre recherche.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.section>

      {/* ---- Fiche détail ---- */}
      <Sheet
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
      >
        <SheetContent
          side="right"
          className="ff-scrollbar w-full gap-0 overflow-y-auto p-0 sm:max-w-[620px]"
        >
          {selected && (
            <>
              <div className="border-b border-neutral-100 px-5 pb-4 pt-5">
                <div className="flex items-start gap-3.5">
                  <CompanyAvatar
                    company={selected}
                    className="h-12 w-12 text-[15px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <SheetTitle className="truncate text-[16px] font-bold tracking-tight text-neutral-900">
                        {selected.nom}
                      </SheetTitle>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                          COMPANY_STATUS_META[selected.statut].className
                        )}
                      >
                        {COMPANY_STATUS_META[selected.statut].label}
                      </span>
                    </div>
                    <SheetDescription className="sr-only">
                      Fiche détaillée de la compagnie {selected.nom}.
                    </SheetDescription>
                    <p className="mt-0.5 text-[12px] text-neutral-400">
                      {selected.id} · {selected.ville}
                    </p>
                  </div>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {selected.statut !== "active" && (
                    <Button
                      size="sm"
                      onClick={() => changeStatus(selected, "active")}
                      className="h-8 gap-1.5 rounded-lg border-emerald-200 bg-emerald-50 text-[12.5px] font-medium text-emerald-700 shadow-none hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Activer
                    </Button>
                  )}
                  {selected.statut === "active" && (
                    <Button
                      size="sm"
                      onClick={() => changeStatus(selected, "suspendue")}
                      className="h-8 gap-1.5 rounded-lg border-rose-200 bg-rose-50 text-[12.5px] font-medium text-rose-700 shadow-none hover:bg-rose-100"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Suspendre
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => openEdit(selected)}
                    className="h-8 gap-1.5 rounded-lg bg-coral-500 text-[12.5px] font-medium text-white shadow-md shadow-coral-500/25 hover:bg-coral-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier la fiche
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="apercu" className="px-5 pb-8 pt-4">
                <TabsList className="h-9 rounded-xl bg-neutral-100 p-1">
                  <TabsTrigger
                    value="apercu"
                    className="h-7 rounded-lg text-[12.5px]"
                  >
                    Aperçu
                  </TabsTrigger>
                  <TabsTrigger
                    value="flotte"
                    className="h-7 rounded-lg text-[12.5px]"
                  >
                    Flotte &amp; lignes
                  </TabsTrigger>
                  <TabsTrigger
                    value="activite"
                    className="h-7 rounded-lg text-[12.5px]"
                  >
                    Activité
                  </TabsTrigger>
                </TabsList>

                {/* --------- Aperçu : coordonnées & commercial --------- */}
                <TabsContent value="apercu" className="mt-4 space-y-5">
                  <section>
                    <SheetSectionTitle>Coordonnées</SheetSectionTitle>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <DetailRow
                        icon={Mail}
                        label="E-mail"
                        value={selected.contact}
                      />
                      <DetailRow
                        icon={Phone}
                        label="Téléphone"
                        value={selected.telephone || "—"}
                      />
                      <DetailRow
                        icon={MapPin}
                        label="Adresse"
                        value={selected.adresse || "—"}
                      />
                      <DetailRow
                        icon={Building2}
                        label="Ville principale"
                        value={selected.ville}
                      />
                    </div>
                  </section>

                  <section>
                    <SheetSectionTitle>
                      Informations commerciales
                    </SheetSectionTitle>
                    <div className="mt-2 grid grid-cols-2 divide-neutral-100 rounded-2xl border border-neutral-200/70 sm:grid-cols-2">
                      <div className="p-4">
                        <p className="text-[11.5px] text-neutral-400">
                          Taux de commission
                        </p>
                        <p className="mt-1 text-[22px] font-bold leading-none text-neutral-900">
                          {selected.commission}
                          <span className="ml-0.5 text-[13px] font-semibold text-neutral-400">
                            %
                          </span>
                        </p>
                      </div>
                      <div className="border-l border-neutral-100 p-4">
                        <p className="text-[11.5px] text-neutral-400">
                          Tickets vendus (mois)
                        </p>
                        <p className="mt-1 text-[22px] font-bold leading-none tabular-nums text-neutral-900">
                          {formatNumber(selected.ticketsMois)}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <SheetSectionTitle>Paramètres de vente</SheetSectionTitle>
                    <div className="mt-2 divide-y divide-neutral-100 rounded-2xl border border-neutral-200/70">
                      <ParamRow
                        label="Vente en ligne"
                        hint="Orange Money · Moov Money"
                        active={selected.params.venteEnLigne}
                      />
                      <ParamRow
                        label="Vente au guichet"
                        hint="Points de vente physiques"
                        active={selected.params.venteGuichet}
                      />
                      <ParamRow
                        label="Réservation à l’avance"
                        value={`${selected.params.reservationJours} jours`}
                      />
                      <ParamRow
                        label="Annulation sans frais"
                        value={`${selected.params.annulationGratuite} h avant départ`}
                      />
                    </div>
                  </section>
                </TabsContent>

                {/* --------- Flotte, lignes & départs --------- */}
                <TabsContent value="flotte" className="mt-4 space-y-5">
                  <section>
                    <SheetSectionTitle>
                      Bus de la compagnie ({detail.buses.length})
                    </SheetSectionTitle>
                    <div className="mt-2 space-y-2">
                      {detail.buses.length === 0 && (
                        <EmptyHint
                          icon={Bus}
                          text="Aucun bus enregistré pour cette compagnie."
                        />
                      )}
                      {detail.buses.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center gap-3 rounded-xl border border-neutral-200/70 px-3.5 py-2.5"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                            <Bus className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-semibold text-neutral-800">
                              {b.immatriculation}
                            </span>
                            <span className="block truncate text-[11px] text-neutral-400">
                              {b.modele} · chauffeur {b.chauffeur}
                            </span>
                          </span>
                          <span className="hidden text-[11.5px] tabular-nums text-neutral-500 sm:block">
                            {b.places} places
                          </span>
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10.5px] font-semibold",
                              BUS_STATUS_META[b.statut].className
                            )}
                          >
                            {BUS_STATUS_META[b.statut].label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <SheetSectionTitle>
                      Lignes exploitées ({detail.lignes.length})
                    </SheetSectionTitle>
                    <div className="mt-2 space-y-2">
                      {detail.lignes.length === 0 && (
                        <EmptyHint
                          icon={Route}
                          text="Aucune ligne enregistrée pour cette compagnie."
                        />
                      )}
                      {detail.lignes.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center gap-3 rounded-xl border border-neutral-200/70 px-3.5 py-2.5"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
                            <Route className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-semibold text-neutral-800">
                              {l.depart} → {l.arrivee}
                            </span>
                            <span className="block truncate text-[11px] text-neutral-400">
                              {l.duree} · {l.frequence}
                            </span>
                          </span>
                          <span className="shrink-0 text-[12px] font-semibold tabular-nums text-neutral-700">
                            {formatFcfa(l.prix)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <SheetSectionTitle>
                      Prochains départs ({detail.departs.length})
                    </SheetSectionTitle>
                    <div className="mt-2 space-y-2">
                      {detail.departs.length === 0 && (
                        <EmptyHint
                          icon={Hourglass}
                          text="Aucun départ programmé pour cette compagnie."
                        />
                      )}
                      {detail.departs.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center gap-3 rounded-xl border border-neutral-200/70 px-3.5 py-2.5"
                        >
                          <span className="w-[52px] shrink-0">
                            <span className="block text-[13px] font-bold leading-none tabular-nums text-neutral-900">
                              {d.heure}
                            </span>
                            <span className="mt-0.5 block text-[10.5px] text-neutral-400">
                              {d.jour}
                            </span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-semibold text-neutral-800">
                              {d.trajet}
                            </span>
                            <span className="block truncate text-[11px] text-neutral-400">
                              {d.bus} · {d.placesDispo}/{d.placesTotal} places
                              libres
                            </span>
                          </span>
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10.5px] font-semibold",
                              DEPARTURE_STATUS_META[d.statut].className
                            )}
                          >
                            {DEPARTURE_STATUS_META[d.statut].label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </TabsContent>

                {/* --------- Historique activités & incidents --------- */}
                <TabsContent value="activite" className="mt-4">
                  {detail.events.length === 0 ? (
                    <EmptyHint
                      icon={Pencil}
                      text="Aucune activité ni incident enregistré pour cette compagnie."
                    />
                  ) : (
                    <ol className="relative ml-1.5 space-y-0 border-l border-neutral-200 pl-5">
                      {detail.events.map((e) => (
                        <li key={e.id} className="relative pb-5 last:pb-0">
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute -left-[25.5px] top-1 h-2.5 w-2.5 rounded-full ring-4",
                              e.type === "incident"
                                ? "bg-rose-500 ring-rose-100"
                                : "bg-coral-400 ring-coral-100"
                            )}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[12.5px] font-semibold text-neutral-800">
                              {e.titre}
                            </p>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                                e.type === "incident"
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-neutral-100 text-neutral-500"
                              )}
                            >
                              {e.type === "incident" ? "Incident" : "Activité"}
                            </span>
                            <span className="ml-auto text-[11px] tabular-nums text-neutral-400">
                              {e.date}
                            </span>
                          </div>
                          <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-500">
                            {e.detail}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ---- Modification d'une compagnie ---- */}
      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) setEditingId(null);
        }}
      >
        <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-[16px]">
              Modifier la compagnie
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              {editing
                ? `${editing.id} · les changements sont enregistrés au journal d’audit.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-3.5" noValidate>
            <CompanyFormFields
              form={editForm}
              set={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
              prefix="c-edit"
            />
            {editError && (
              <p
                role="alert"
                className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-600"
              >
                {editError}
              </p>
            )}
            <DialogFooter className="gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingId(null)}
                className="h-9 rounded-xl border-neutral-200 text-[13px]"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="h-9 rounded-xl bg-coral-500 text-[13px] font-medium text-white shadow-md shadow-coral-500/30 hover:bg-coral-600"
              >
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
