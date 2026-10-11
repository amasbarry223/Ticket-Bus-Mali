"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
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
 * Composant d'animation Lottie Bus en arrière-plan
 */
function LottieBusBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anim: any = null;
    let isMounted = true;

    import("lottie-web").then((lottieModule) => {
      if (!isMounted || !containerRef.current) return;
      const lottie = lottieModule.default || lottieModule;
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/lottie-bus.json",
        rendererSettings: {
          preserveAspectRatio: "xMidYMax meet",
        },
      });
    });

    return () => {
      isMounted = false;
      anim?.destroy();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 overflow-hidden h-[340px] sm:h-[420px] md:h-[480px]"
    >
      {/* Ligne de sol / route qui traverse tout l'écran d'un bout à l'autre */}
      <div className="absolute inset-x-0 bottom-4 sm:bottom-6 h-[2px] bg-[#003B2D]/15" />

      {/* Bus Lottie animé qui roule de bout en bout d'un côté à l'autre de l'écran */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "100vw" }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-0 left-0 w-[560px] sm:w-[680px] md:w-[780px] h-[300px] sm:h-[370px] md:h-[430px] translate-y-[22%] sm:translate-y-[24%] will-change-transform"
      >
        <div ref={containerRef} className="h-full w-full" />
      </motion.div>
    </div>
  );
}

/**
 * Écran de connexion TBM — container compact et centré, fond lumineux et bus Lottie au sol
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
    setPassword("");
    setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Veuillez renseigner votre e-mail et votre mot de passe.");
      return;
    }

    setLoading(true);
    // Vérification des identifiants de démonstration
    window.setTimeout(() => {
      const matchedRole = (Object.keys(DEMO_ACCOUNTS) as StaffRole[]).find(
        (r) => DEMO_ACCOUNTS[r].email.toLowerCase() === trimmedEmail.toLowerCase()
      );
      const account = matchedRole ? DEMO_ACCOUNTS[matchedRole] : DEMO_ACCOUNTS[role];

      if (trimmedPassword !== account.password && trimmedPassword !== "tbm2026") {
        setError("Mot de passe incorrect. (Mot de passe démo : tbm2026)");
        setLoading(false);
        return;
      }

      login({
        name: account.name,
        email: trimmedEmail,
        role: matchedRole ?? role,
      });
      setLoading(false);
    }, 600);
  };

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#EEF6F2] via-[#F3F7F5] to-[#DFEEE7] px-4 py-6">
      {/* ---- SILHOUETTE DE LA CARTE DU MALI EN ARRIÈRE-PLAN ---- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-center justify-center w-[700px] sm:w-[820px] md:w-[940px] lg:w-[1040px] max-w-[92vw] -translate-y-3 sm:-translate-y-5"
        >
          <img
            src="/mali-silhouette.svg"
            alt="Silhouette Carte du Mali"
            className="h-auto w-full object-contain select-none opacity-90 drop-shadow-[0_8px_25px_rgba(0,59,45,0.06)]"
          />
        </motion.div>
      </div>

      {/* Halos de lumière doux et ambiances de couleur TBM pour faire vibrer le fond */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#9BE000]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#003B2D]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-white/60 blur-2xl"
      />

      {/* ---- LOTTIE BUS POSITIONNÉ AU NIVEAU DE LA LIGNE DE SOL DU BAS ---- */}
      <LottieBusBackground />

      {/* ---- CARTE DE CONNEXION COMPACTE ---- */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[370px]"
      >
        <div className="ff-card overflow-hidden rounded-2xl border border-[#D9E2DE] bg-white/95 shadow-xl backdrop-blur-md">
          {/* Liseré tricolore — clin d’œil au drapeau malien */}
          <div className="flex h-1.5 w-full">
            <span className="h-full flex-1 bg-emerald-500" />
            <span className="h-full flex-1 bg-amber-400" />
            <span className="h-full flex-1 bg-red-500" />
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-5.5">
            {/* Logo + titre réduits */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center">
                <LogoTbm className="h-10 sm:h-11 w-auto max-w-[145px] object-contain drop-shadow-xs" />
              </div>
              <h1 className="mt-1.5 text-[16.5px] font-bold tracking-tight text-[#001D18]">
                TBM — Ticket Bus Mali
              </h1>
              <p className="mt-0.5 text-[11.5px] text-[#718078]">
                Back-office · Réservation & supervision inter-régions
              </p>
            </div>

            {/* Sélecteur de rôle (RBAC) compact */}
            <div className="mt-3.5">
              <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#718078]">
                Profil de connexion
              </p>
              <div className="grid grid-cols-2 gap-2">
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
                        "flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all duration-200 cursor-pointer",
                        selected
                          ? "border-[#003B2D] bg-[#F3F7F5] ring-2 ring-[#9BE000]/60 shadow-xs"
                          : "border-[#D9E2DE] hover:border-[#003B2D]/40 hover:bg-[#F3F7F5]/50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          selected ? "text-[#003B2D]" : "text-[#718078]"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[11.5px] font-semibold leading-tight",
                          selected ? "text-[#001D18]" : "text-[#718078]"
                        )}
                      >
                        {ROLE_LABEL[r]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formulaire compact */}
            <form onSubmit={handleSubmit} className="mt-3.5 space-y-3" noValidate>
              <div className="space-y-1">
                <Label htmlFor="tbm-email" className="text-[12px] font-medium text-[#172B25]">
                  Adresse e-mail
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#718078]" />
                  <Input
                    id="tbm-email"
                    type="email"
                    autoComplete="email"
                    placeholder="prenom.nom@tbm.ml"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 rounded-xl border-[#D9E2DE] bg-white pl-8.5 text-[13px] text-[#172B25] focus-visible:ring-[#9BE000] focus-visible:border-[#003B2D]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="tbm-password" className="text-[12px] font-medium text-[#172B25]">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#718078]" />
                  <Input
                    id="tbm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-9 rounded-xl border-[#D9E2DE] bg-white pl-8.5 pr-9 text-[13px] text-[#172B25] focus-visible:ring-[#9BE000] focus-visible:border-[#003B2D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#718078] transition-colors hover:bg-neutral-100 hover:text-[#172B25]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 text-[11.5px] font-medium text-[#EF4444]"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-9 w-full gap-2 rounded-xl bg-[#003B2D] text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#002D22] hover:text-[#9BE000] active:scale-[0.99] disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#9BE000]" />
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    <LogIn className="h-3.5 w-3.5 text-[#9BE000]" />
                    Se connecter
                  </>
                )}
              </Button>

              <p className="text-center text-[10.5px] leading-relaxed text-[#718078]">
                Démo frontend — cliquez sur un profil puis connectez-vous
                <br />
                (mot de passe : <span className="font-semibold text-[#001D18]">tbm2026</span>).
              </p>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
