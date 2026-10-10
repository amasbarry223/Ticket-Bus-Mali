"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  LifeBuoy,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/auth-store";
import {
  DEMO_ACCOUNTS,
  ROLE_LABEL,
  type StaffRole,
} from "@/components/tbm/data";
import { LogoTbm } from "@/components/tbm/logo";
import { cn } from "@/lib/utils";

/**
 * Écran de connexion TBM — container centré au milieu de l’écran,
 * contenant le logo et le formulaire de connexion (RBAC, frontend only).
 */
export function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [role, setRole] = useState<StaffRole>("admin");
  const [email, setEmail] = useState(DEMO_ACCOUNTS.admin.email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickRole = (next: StaffRole) => {
    setRole(next);
    setEmail(DEMO_ACCOUNTS[next].email);
    setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Veuillez renseigner votre e-mail et votre mot de passe.");
      return;
    }

    setLoading(true);
    // Simulation d’une vérification côté serveur (aucun backend).
    window.setTimeout(() => {
      const account = DEMO_ACCOUNTS[role];
      login({ name: account.name, email: email.trim(), role });
      setLoading(false);
    }, 700);
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white px-4 py-10">
      {/* Filigrane discret */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-coral-50/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-neutral-100/80 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[420px]"
      >
        <div className="ff-card overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
          {/* Liseré tricolore — clin d’œil au drapeau malien */}
          <div className="flex h-1.5 w-full">
            <span className="h-full flex-1 bg-emerald-500" />
            <span className="h-full flex-1 bg-amber-400" />
            <span className="h-full flex-1 bg-red-500" />
          </div>

          <div className="px-7 pb-7 pt-8 sm:px-9">
            {/* Logo + titre */}
            <div className="flex flex-col items-center text-center">
              <LogoTbm className="h-14 w-14 rounded-2xl" />
              <h1 className="mt-4 text-[22px] font-bold tracking-tight text-neutral-900">
                TBM — Ticket Bus Mali
              </h1>
              <p className="mt-1 text-[13px] text-neutral-500">
                Back-office · Réservation et paiement de tickets inter-régions
              </p>
            </div>

            {/* Sélecteur de rôle (RBAC) */}
            <div className="mt-7">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Profil de connexion
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {(Object.keys(DEMO_ACCOUNTS) as StaffRole[]).map((r) => {
                  const selected = role === r;
                  const Icon = r === "admin" ? ShieldCheck : LifeBuoy;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => pickRole(r)}
                      aria-pressed={selected}
                      className={cn(
                        "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all duration-200",
                        selected
                          ? "border-coral-400 bg-coral-50/70 ring-2 ring-coral-100"
                          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px]",
                          selected ? "text-coral-500" : "text-neutral-400"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[12.5px] font-semibold leading-tight",
                          selected ? "text-neutral-900" : "text-neutral-500"
                        )}
                      >
                        {ROLE_LABEL[r]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="tbm-email" className="text-[13px] text-neutral-700">
                  Adresse e-mail
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="tbm-email"
                    type="email"
                    autoComplete="email"
                    placeholder="prenom.nom@tbm.ml"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 rounded-xl border-neutral-200 bg-white pl-9 text-[13.5px] focus-visible:ring-coral-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tbm-password" className="text-[13px] text-neutral-700">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="tbm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 rounded-xl border-neutral-200 bg-white pl-9 pr-10 text-[13.5px] focus-visible:ring-coral-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-600"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-full gap-2 rounded-xl bg-coral-500 text-[13.5px] font-semibold text-white shadow-md shadow-coral-500/30 transition-all hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-500/40 active:scale-[0.99] disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Se connecter
                  </>
                )}
              </Button>

              <p className="text-center text-[11.5px] leading-relaxed text-neutral-400">
                Démo frontend — cliquez sur un profil puis connectez-vous
                <br />
                (mot de passe de démo : <span className="font-semibold text-neutral-500">tbm2026</span>).
              </p>
            </form>
          </div>

          {/* Pied de carte — contacts TBM (cahier des charges §1.4) */}
          <div className="border-t border-neutral-100 bg-neutral-50/60 px-7 py-3 text-center text-[11px] leading-relaxed text-neutral-400 sm:px-9">
            contact.tbm@gmail.com · +223 76 79 40 79 · Bamako, Mali — v0.1 MVP
          </div>
        </div>
      </motion.div>
    </div>
  );
}
