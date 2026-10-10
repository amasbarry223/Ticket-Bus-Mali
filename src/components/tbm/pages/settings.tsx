"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Info, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useTbmStore } from "@/lib/tbm-store";
import type { Settings } from "@/components/tbm/data";
import { cn } from "@/lib/utils";

/**
 * A04 — Paramétrage : frais de service (RG7), commission,
 * délai de blocage des places (RG1), politique d’annulation par défaut (RG5).
 */
export function SettingsPage() {
  const settings = useTbmStore((s) => s.settings);
  const saveSettings = useTbmStore((s) => s.saveSettings);
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const [form, setForm] = useState<Settings>(settings);
  const [errors, setErrors] = useState<string | null>(null);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (
      form.fraisValeur < 0 ||
      form.commissionDefaut < 0 ||
      form.commissionDefaut > 50 ||
      form.blocageMinutes < 1 ||
      form.blocageMinutes > 60
    ) {
      setErrors(
        "Valeurs invalides : commission entre 0 et 50 %, blocage entre 1 et 60 minutes."
      );
      return;
    }
    setErrors(null);
    saveSettings(form, user?.name ?? "Admin");
    toast({
      title: "Paramètres enregistrés",
      description: "Les nouvelles règles s’appliquent aux prochaines ventes — tracé au journal d’audit.",
    });
  };

  return (
    <div>
      <div>
        <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
          Paramétrage
        </h2>
        <p className="mt-0.5 text-[12.5px] text-neutral-400">
          A04 — Frais de service, commission, délais de blocage, politique d’annulation par défaut.
        </p>
      </div>

      <form onSubmit={handleSave} noValidate>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Frais de service */}
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
              RG7 — montant fixe ou pourcentage ; affichés au voyageur avant le paiement.
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

          {/* Commission + blocage */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card rounded-2xl border border-neutral-200/70 bg-white p-5"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="commission" className="text-[13px]">
                  Commission par défaut (compagnies)
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
                <p className="text-[11.5px] text-neutral-400">
                  Prélevée sur le prix côté compagnie, déduite du reversment (RG9).
                </p>
              </div>

              <div className="h-px bg-neutral-100" />

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
                  RG1 — passé ce délai sans confirmation, les places sont remises en vente.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Politique d’annulation */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card rounded-2xl border border-neutral-200/70 bg-white p-5 xl:col-span-2"
          >
            <h3 className="text-[14.5px] font-semibold text-neutral-900">
              Politique d’annulation par défaut
            </h3>
            <p className="mt-1 text-[12px] text-neutral-400">
              RG5 — paliers de remboursement selon le délai avant le départ (modifiable par compagnie).
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(
                [
                  { key: "annulationPlus24h", label: "Plus de 24 h", hint: "ex. : 100 % remboursé" },
                  { key: "annulation24a6h", label: "Entre 24 h et 6 h", hint: "ex. : 50 % remboursé" },
                  { key: "annulationMoins6h", label: "Moins de 6 h", hint: "ex. : 0 % (RG10)" },
                ] as const
              ).map((palier) => (
                <div key={palier.key} className="space-y-1.5">
                  <Label htmlFor={palier.key} className="text-[13px]">
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
                  <p className="text-[11px] text-neutral-400">{palier.hint}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {errors && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-medium text-rose-600">
            {errors}
          </p>
        )}

        <div className="mt-4 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setForm(settings)}
            className="h-9 rounded-xl border-neutral-200 text-[13px] font-medium"
          >
            Réinitialiser
          </Button>
          <Button
            type="submit"
            className="h-9 gap-1.5 rounded-xl bg-coral-500 px-4 text-[13px] font-medium text-white shadow-md shadow-coral-500/30 transition-all hover:bg-coral-600 active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            Enregistrer les paramètres
          </Button>
        </div>
      </form>
    </div>
  );
}
