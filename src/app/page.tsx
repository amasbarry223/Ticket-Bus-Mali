"use client";

import { useSyncExternalStore } from "react";
import { LogoTbm } from "@/components/tbm/logo";
import { LoginScreen } from "@/components/tbm/login-screen";
import { TbmShell } from "@/components/tbm/shell";
import { useAuthStore } from "@/lib/auth-store";

// Subscribe no-op + snapshots distincts serveur/client :
// pattern d’hydratation sûr sans setState dans un effet.
const emptySubscribe = () => () => {};

/**
 * Racine de l’application TBM (frontend only) :
 * - session absente → écran de connexion (container centré, logo + formulaire)
 * - session présente → back-office plein écran (sidebar + top-bar + layout)
 */
export default function TbmBackOfficeRoot() {
  const user = useAuthStore((s) => s.user);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <LogoTbm className="h-12 w-12 animate-pulse" />
      </div>
    );
  }

  return user ? <TbmShell /> : <LoginScreen />;
}
