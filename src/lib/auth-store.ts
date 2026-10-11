"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StaffUser } from "@/components/tbm/data";

interface AuthState {
  user: StaffUser | null;
  login: (user: StaffUser) => void;
  logout: () => void;
}

/**
 * Authentification du back-office :
 * Par défaut, initialise le compte administrateur « Daouda FOMBA »
 * pour un accès direct au tableau de bord.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: {
        name: "Daouda FOMBA",
        email: "admin@ticketbusmali.ml",
        role: "admin",
      },
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: "tbm-auth" }
  )
);
