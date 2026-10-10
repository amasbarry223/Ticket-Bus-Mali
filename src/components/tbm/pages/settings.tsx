"use client";

import { useMemo, useState, type ElementType, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Coins,
  Files,
  History,
  Info,
  Percent,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Timer,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useParamState, validParam } from "@/lib/use-param-state";
import {
  ENCAISSEMENT_MODE_META,
  SETTINGS_CONSUMERS,
  type EncaissementMode,
  type Settings,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";

const TABS = ["vente", "commissions", "securite", "historique"] as const;

function MiniKpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ElementType;
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
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium text-neutral-400">{label}</span>
        <span className="block truncate text-[15.5px] font-bold tracking-tight text-neutral-900">
          {value}
        </span>
        <span className="block truncate text-[11px] text-neutral-400">{hint}</span>
      </span>
    </motion.div>
  );
}

const nf = new Intl.NumberFormat("fr-FR");

/**
 * A04 — Paramétrage : le hub des règles métier consommées par les autres
 * modules (RG1, RG5, RG7, RG9, modèle d'encaissement A11, plafond support A03).
 * Toute modification est tracée au journal d'audit (A06).
 */
export function SettingsPage() {
  const settings = useTbmStore((s) => s.settings);
  const saveSettings = useTbmStore((s) => s.saveSettings);
  const companies = useTbmStore((s) => s.companies);
  const audit = useTbmStore((s) => s.audit);
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const [tabParam, setTabParam] = useParamState("tab", "vente");
  const tab = validParam(tabParam, TABS, "vente");
  const [form, setForm] = useState<Settings>(settings);
  const [errors, setErrors] = useState<string | null>(null);
  const [searchHist, setSearchHist] = useState("");

  const dirty = JSON.stringify(form) !== JSON.stringify(settings);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const lastSave = useMemo(
    () => audit.find((e) => e.action === "Paramétrage"),
    [audit]
  );

  const history = useMemo(() => {
    const q = searchHist.trim().toLowerCase();
    return audit
      .filter((e) => e.action === "Paramétrage" || e.action === "Notification")
      .filter(
        (e) =>
          q === "" ||
          e.auteur.toLowerCase().includes(q) ||
          e.objet.toLowerCase().includes(q) ||
          e.detail.toLowerCase().includes(q)
      );
  }, [audit, searchHist]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (
      form.fraisValeur < 0 ||
      form.commissionDefaut < 0 ||
      form.commissionDefaut > 50 ||
      form.blocageMinutes < 1 ||
      form.blocageMinutes > 60 ||
      form.plafondSupportFcfa < 500 ||
      form.plafondSupportFcfa > 100000
    ) {
      setErrors(
        "Valeurs invalides : commission 0–50 %, blocage 1–60 min, plafond support 500–100 000 FCFA."
      );
      return;
    }
    setErrors(null);
    saveSettings(form, user?.name ?? "Admin");
    toast({
      title: "Paramètres enregistrés",
      description:
        "Les règles s'appliquent immédiatement aux modules concernés — modification tracée au journal d'audit.",
    });
  };

  const encaissementCards: {
    key: EncaissementMode;
    label: string;
    desc: string;
  }[] = [
    {
      key: "plateforme",
      label: "TBM encaisse, puis reverse",
      desc: "Les paiements voyageurs transitent par TBM. La commission est déduite au reversement (A11) — modèle actif au lancement, exécution finalisée manuellement.",
    },
    {
      key: "compagnie",
      label: "Les compagnies encaissent",
      desc: "Les opérateurs encaissent directement. La commission TBM est facturée (note de frais) et suivie au décompte — le module A11 est conçu pour les deux modèles.",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            Paramétrage
          </h2>
          <p className="mt-0.5 text-[12.5px] text-neutral-400">
            A04 — Règles métier centrales, consommées en direct par les modules
            Vente, Remboursements, Reversements.
            {lastSave && (
              <span className="ml-1.5 text-neutral-500">
                Dernier enregistrement : {lastSave.date} · {lastSave.auteur}.
              </span>
            )}
          </p>
        </div>
        <Button
          type="submit"
          form="settings-form"
          disabled={!dirty}
          className={cn(
            "h-9 gap-1.5 rounded-xl bg-coral-500 px-4 text-[13px] font-medium text-white shadow-md shadow-coral-500/30 transition-all hover:bg-coral-600 active:scale-[0.98]",
            !dirty && "opacity-50"
          )}
        >
          <Save className="h-4 w-4" />
          {dirty ? "Enregistrer les paramètres" : "Aucune modification"}
        </Button>
      </div>

      {/* Récap des valeurs actives */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi
          icon={Coins}
          label="Frais de service (RG7)"
          value={
            settings.fraisMode === "fixe"
              ? `${nf.format(settings.fraisValeur)} FCFA`
              : `${settings.fraisValeur} %`
          }
          hint="affichés au voyageur avant paiement"
          tone="bg-coral-50 text-coral-500"
        />
        <MiniKpi
          icon={Percent}
          label="Commission par défaut (RG9)"
          value={`${settings.commissionDefaut} %`}
          hint="compagnies sans taux contractuel"
          tone="bg-violet-50 text-violet-600"
        />
        <MiniKpi
          icon={Timer}
          label="Blocage des places (RG1)"
          value={`${settings.blocageMinutes} min`}
          hint="puis remise en vente automatique"
          tone="bg-amber-50 text-amber-600"
        />
        <MiniKpi
          icon={ShieldCheck}
          label="Plafond support (A03)"
          value={`${nf.format(settings.plafondSupportFcfa)} FCFA`}
          hint="remboursements traitables sans admin"
          tone="bg-emerald-50 text-emerald-600"
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={setTabParam}
        className="mt-5"
      >
        <TabsList className="h-10 w-full justify-start gap-1 overflow-x-auto rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-1 ff-scrollbar sm:w-auto">
          <TabsTrigger
            value="vente"
            className="gap-1.5 rounded-lg px-3.5 text-[12.5px] data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Wallet className="h-3.5 w-3.5" /> Vente &amp; réservation
          </TabsTrigger>
          <TabsTrigger
            value="commissions"
            className="gap-1.5 rounded-lg px-3.5 text-[12.5px] data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Percent className="h-3.5 w-3.5" /> Commissions &amp; reversements
          </TabsTrigger>
          <TabsTrigger
            value="securite"
            className="gap-1.5 rounded-lg px-3.5 text-[12.5px] data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Sécurité &amp; comptes
          </TabsTrigger>
          <TabsTrigger
            value="historique"
            className="gap-1.5 rounded-lg px-3.5 text-[12.5px] data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <History className="h-3.5 w-3.5" /> Historique
          </TabsTrigger>
        </TabsList>

        <form id="settings-form" onSubmit={handleSave} noValidate>
          {/* ---------- Vente & réservation ---------- */}
          <TabsContent value="vente" className="mt-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="ff-card rounded-2xl border border-neutral-200/70 bg-white p-5"
              >
                <h3 className="text-[14.5px] font-semibold text-neutral-900">
                  Frais de service TBM
                </h3>
                <p className="mt-1 flex items-start gap-1.5 text-[12px] leading-snug text-neutral-400">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  RG7 — montant fixe ou pourcentage ; affichés au voyageur avant
                  le paiement.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {(
                    [
                      { key: "fixe", label: "Montant fixe", hint: "FCFA / ticket" },
                      { key: "pourcentage", label: "Pourcentage", hint: "% du billet" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => set("fraisMode", opt.key)}
                      aria-pressed={form.fraisMode === opt.key}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all duration-200",
                        form.fraisMode === opt.key
                          ? "border-coral-400 bg-coral-50/70 ring-2 ring-coral-100"
                          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                      )}
                    >
                      <span className="block text-[13px] font-semibold text-neutral-800">
                        {opt.label}
                      </span>
                      <span className="block text-[11.5px] text-neutral-400">{opt.hint}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-3.5 space-y-1.5">
                  <Label htmlFor="frais-valeur" className="text-[13px]">
                    {form.fraisMode === "fixe" ? "Montant (FCFA)" : "Taux (%)"}
                  </Label>
                  <Input
                    id="frais-valeur"
                    type="number"
                    min={0}
                    value={form.fraisValeur}
                    onChange={(e) => set("fraisValeur", Number(e.target.value))}
                    className="h-9.5 rounded-xl border-neutral-200 focus-visible:ring-coral-200"
                  />
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="ff-card rounded-2xl border border-neutral-200/70 bg-white p-5"
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="blocage" className="text-[13px]">
                      Blocage des places pendant le paiement
                    </Label>
                    <div className="relative">
                      <Input
                        id="blocage"
                        type="number"
                        min={1}
                        max={60}
                        value={form.blocageMinutes}
                        onChange={(e) => set("blocageMinutes", Number(e.target.value))}
                        className="h-9.5 rounded-xl border-neutral-200 pr-16 focus-visible:ring-coral-200"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-neutral-400">
                        minutes
                      </span>
                    </div>
                    <p className="text-[11.5px] text-neutral-400">
                      RG1 — passé ce délai sans confirmation serveur, les places
                      sont remises en vente (consommé par Réservations A10 et
                      Transactions A02).
                    </p>
                  </div>
                  <div className="h-px bg-neutral-100" />
                  <div>
                    <h4 className="text-[13px] font-semibold text-neutral-800">
                      Politique d&apos;annulation par défaut (RG5)
                    </h4>
                    <p className="mt-0.5 text-[11.5px] text-neutral-400">
                      Paliers de remboursement selon le délai avant le départ —
                      modifiable par compagnie dans sa fiche.
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {(
                        [
                          { key: "annulationPlus24h", label: "Plus de 24 h" },
                          { key: "annulation24a6h", label: "Entre 24 h et 6 h" },
                          { key: "annulationMoins6h", label: "Moins de 6 h (RG10)" },
                        ] as const
                      ).map((palier) => (
                        <div key={palier.key} className="space-y-1.5">
                          <Label htmlFor={palier.key} className="text-[12px]">
                            {palier.label}
                          </Label>
                          <div className="relative">
                            <Input
                              id={palier.key}
                              type="number"
                              min={0}
                              max={100}
                              value={form[palier.key]}
                              onChange={(e) => set(palier.key, Number(e.target.value))}
                              className="h-9.5 rounded-xl border-neutral-200 pr-9 focus-visible:ring-coral-200"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-neutral-400">
                              %
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.section>
            </div>
          </TabsContent>

          {/* ---------- Commissions & reversements ---------- */}
          <TabsContent value="commissions" className="mt-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="ff-card rounded-2xl border border-neutral-200/70 bg-white p-5"
              >
                <h3 className="text-[14.5px] font-semibold text-neutral-900">
                  Commission par défaut (RG9)
                </h3>
                <p className="mt-1 text-[12px] leading-snug text-neutral-400">
                  Prélevée sur le prix côté compagnie, déduite du reversement
                  (A11). Les compagnies à taux contractuel gardent leur taux
                  propre — géré dans la fiche de chaque compagnie (A01).
                </p>
                <div className="mt-4 space-y-1.5">
                  <Label htmlFor="commission" className="text-[13px]">
                    Taux par défaut
                  </Label>
                  <div className="relative">
                    <Input
                      id="commission"
                      type="number"
                      min={0}
                      max={50}
                      value={form.commissionDefaut}
                      onChange={(e) => set("commissionDefaut", Number(e.target.value))}
                      className="h-9.5 rounded-xl border-neutral-200 pr-9 focus-visible:ring-coral-200"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-neutral-400">
                      %
                    </span>
                  </div>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="ff-card rounded-2xl border border-neutral-200/70 bg-white p-5"
              >
                <h3 className="text-[14.5px] font-semibold text-neutral-900">
                  Modèle d&apos;encaissement TBM
                </h3>
                <p className="mt-1 text-[12px] leading-snug text-neutral-400">
                  Contrainte de conception A11 : le module reversements est
                  conçu pour les deux modèles, même si les opérations sont
                  finalisées manuellement au lancement.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2.5">
                  {encaissementCards.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => set("encaissementMode", opt.key)}
                      aria-pressed={form.encaissementMode === opt.key}
                      className={cn(
                        "rounded-xl border p-3.5 text-left transition-all duration-200",
                        form.encaissementMode === opt.key
                          ? "border-coral-400 bg-coral-50/70 ring-2 ring-coral-100"
                          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold text-neutral-800">
                          {opt.label}
                        </span>
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10.5px] font-semibold",
                            opt.key === "plateforme"
                              ? "bg-coral-100 text-coral-600"
                              : "bg-neutral-100 text-neutral-500"
                          )}
                        >
                          {opt.key === form.encaissementMode ? "Actif" : "Disponible"}
                        </span>
                      </span>
                      <span className="mt-1 block text-[11.5px] leading-snug text-neutral-400">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="ff-card overflow-hidden rounded-2xl border border-neutral-200/70 bg-white xl:col-span-2"
              >
                <div className="flex items-center justify-between px-5 pt-4">
                  <div>
                    <h3 className="text-[14.5px] font-semibold text-neutral-900">
                      Taux contractuels par compagnie
                    </h3>
                    <p className="mt-0.5 text-[12px] text-neutral-400">
                      Lecture seule — modifiable dans la fiche de chaque
                      compagnie (module Compagnies, A01).
                    </p>
                  </div>
                  <Building2 className="h-4 w-4 text-neutral-300" />
                </div>
                <div className="ff-scrollbar mt-3 max-h-64 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                        <TableHead className="h-10 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400 backdrop-blur">
                          Compagnie
                        </TableHead>
                        <TableHead className="h-10 bg-neutral-50/60 text-xs font-medium text-neutral-400 backdrop-blur">
                          Commission
                        </TableHead>
                        <TableHead className="h-10 bg-neutral-50/60 text-xs font-medium text-neutral-400 backdrop-blur">
                          Origine
                        </TableHead>
                        <TableHead className="h-10 bg-neutral-50/60 pr-5 text-right text-xs font-medium text-neutral-400 backdrop-blur">
                          Tickets / mois
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((c) => (
                        <TableRow key={c.id} className="border-neutral-100 hover:bg-neutral-50/70">
                          <TableCell className="py-3 pl-5 text-[12.5px] font-semibold text-neutral-700">
                            {c.nom}
                          </TableCell>
                          <TableCell className="text-[12.5px] font-bold tabular-nums text-coral-600">
                            {c.commission} %
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold",
                                c.commission === form.commissionDefaut
                                  ? "bg-neutral-100 text-neutral-500"
                                  : "bg-violet-50 text-violet-600"
                              )}
                            >
                              {c.commission === form.commissionDefaut
                                ? "Taux par défaut"
                                : "Contractuel"}
                            </span>
                          </TableCell>
                          <TableCell className="pr-5 text-right text-[12.5px] tabular-nums text-neutral-500">
                            {nf.format(c.ticketsMois)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.section>
            </div>
          </TabsContent>

          {/* ---------- Sécurité & comptes ---------- */}
          <TabsContent value="securite" className="mt-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="ff-card rounded-2xl border border-neutral-200/70 bg-white p-5"
              >
                <h3 className="text-[14.5px] font-semibold text-neutral-900">
                  Plafond de traitement du support
                </h3>
                <p className="mt-1 text-[12px] leading-snug text-neutral-400">
                  A03 — au-delà de ce montant, la validation et le versement
                  d&apos;un remboursement sont réservés à l&apos;administration.
                  Modifié ici, le plafond s&apos;applique immédiatement au
                  module Remboursements &amp; litiges.
                </p>
                <div className="mt-4 space-y-1.5">
                  <Label htmlFor="plafond" className="text-[13px]">
                    Plafond par dossier (FCFA)
                  </Label>
                  <Input
                    id="plafond"
                    type="number"
                    min={500}
                    max={100000}
                    step={500}
                    value={form.plafondSupportFcfa}
                    onChange={(e) => set("plafondSupportFcfa", Number(e.target.value))}
                    className="h-9.5 rounded-xl border-neutral-200 focus-visible:ring-coral-200"
                  />
                  <p className="text-[11.5px] text-neutral-400">
                    Valeur actuelle appliquée : {nf.format(settings.plafondSupportFcfa)} FCFA.
                  </p>
                </div>
                <div className="mt-4 rounded-xl bg-violet-50/70 p-3.5 text-[12px] leading-relaxed text-violet-700 ring-1 ring-violet-100">
                  <ShieldCheck className="mb-1 h-4 w-4" />
                  Isolation multi-tenant (A05) : un agent d&apos;une compagnie ne
                  voit jamais les données d&apos;une autre compagnie — contrainte
                  plateforme, non modifiable.
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="ff-card overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
              >
                <div className="flex items-center justify-between px-5 pt-4">
                  <div>
                    <h3 className="text-[14.5px] font-semibold text-neutral-900">
                      Paramètres consommés par les modules
                    </h3>
                    <p className="mt-0.5 text-[12px] text-neutral-400">
                      Chaque règle est appliquée en direct, sans redéploiement.
                    </p>
                  </div>
                  <Settings2 className="h-4 w-4 text-neutral-300" />
                </div>
                <ul className="ff-scrollbar mt-3 max-h-72 space-y-2 overflow-auto px-5 pb-5">
                  {SETTINGS_CONSUMERS.map((s) => (
                    <li
                      key={s.key}
                      className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-semibold text-neutral-700">
                          {s.usage}
                        </span>
                        <span className="whitespace-nowrap rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-500 ring-1 ring-neutral-200">
                          {s.module}
                        </span>
                      </div>
                      <span className="mt-1 block text-[11.5px] text-neutral-400">
                        Clé <code className="rounded bg-white px-1 py-0.5 font-mono text-[10.5px] text-coral-600">{s.key}</code>
                        {" · "}valeur active :{" "}
                        {s.key === "encaissementMode"
                          ? ENCAISSEMENT_MODE_META[settings.encaissementMode].label
                          : s.key === "fraisValeur"
                            ? settings.fraisMode === "fixe"
                              ? `${nf.format(settings.fraisValeur)} FCFA/ticket`
                              : `${settings.fraisValeur} %`
                            : s.key === "plafondSupportFcfa"
                              ? `${nf.format(settings.plafondSupportFcfa)} FCFA`
                              : `${settings[s.key]}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.section>
            </div>
          </TabsContent>

          {errors && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-medium text-rose-600"
            >
              {errors}
            </p>
          )}

          {/* ---------- Historique ---------- */}
          <TabsContent value="historique" className="mt-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={searchHist}
                  onChange={(e) => setSearchHist(e.target.value)}
                  placeholder="Rechercher (auteur, objet, détail)…"
                  aria-label="Rechercher dans l'historique des modifications"
                  className="h-9 rounded-xl border-neutral-200 bg-white pl-9 text-[13px] focus-visible:ring-coral-200"
                />
              </div>
              <span className="ml-auto text-[12px] text-neutral-400">
                {history.length} entrée{history.length > 1 ? "s" : ""} — modifications
                de paramétrage et notifications ciblées
              </span>
            </div>
            <section className="ff-card mt-3 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white">
              <div className="ff-scrollbar max-h-[520px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="border-b border-neutral-100 hover:bg-transparent">
                      <TableHead className="h-11 bg-neutral-50/60 pl-5 text-xs font-medium text-neutral-400 backdrop-blur">
                        Date
                      </TableHead>
                      <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 backdrop-blur">
                        Auteur
                      </TableHead>
                      <TableHead className="h-11 bg-neutral-50/60 text-xs font-medium text-neutral-400 backdrop-blur">
                        Action
                      </TableHead>
                      <TableHead className="h-11 bg-neutral-50/60 pr-5 text-xs font-medium text-neutral-400 backdrop-blur">
                        Détail
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((e) => (
                      <TableRow
                        key={e.id}
                        className="border-neutral-100 transition-colors hover:bg-neutral-50/70"
                      >
                        <TableCell className="whitespace-nowrap py-3.5 pl-5 text-[12px] tabular-nums text-neutral-400">
                          {e.date}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="block text-[12.5px] font-semibold text-neutral-700">
                            {e.auteur}
                          </span>
                          <span className="block text-[11px] text-neutral-400">{e.role}</span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold",
                              e.action === "Paramétrage"
                                ? "bg-sky-50 text-sky-600"
                                : "bg-fuchsia-50 text-fuchsia-600"
                            )}
                          >
                            {e.action === "Paramétrage" ? (
                              <Files className="h-3 w-3" />
                            ) : (
                              <Timer className="h-3 w-3" />
                            )}
                            {e.action}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[420px] pr-5">
                          <span className="block text-[12.5px] font-medium text-neutral-700">
                            {e.objet}
                          </span>
                          <span className="block text-[12px] leading-snug text-neutral-500">
                            {e.detail}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {history.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-10 text-center text-[13px] text-neutral-400"
                        >
                          Aucune modification de paramétrage ne correspond à cette recherche.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  );
}
