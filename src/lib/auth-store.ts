"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StaffUser } from "@/components/tbm/data";

interface AuthState {
  user: StaffUser | null;
  login: (user: StaffUser) => void;
  logout: () => void;
}

// Supprimer l'ancien cache localStorage qui connectait automatiquement un compte de test
if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem("tbm-auth");
  } catch {}
}

/**
 * Authentification du back-office TBM :
 * Par défaut, `user` est à `null`. L'utilisateur DOIT obligatoirement
 * s'authentifier via l'écran de connexion avant d'ouvrir le tableau de bord.
 * La session est conservée uniquement pendant la session active du navigateur (sessionStorage).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => {
        set({ user: null });
        if (typeof window !== "undefined") {
          try {
            window.sessionStorage.removeItem("tbm-auth-session");
          } catch {}
        }
      },
    }),
    {
      name: "tbm-auth-session",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.sessionStorage
          : ({
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            } as unknown as Storage)
      ),
    }
  )
);
