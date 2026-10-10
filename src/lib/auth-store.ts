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
 * Authentification de démonstration (frontend only) :
 * la session est conservée dans le localStorage, aucun appel réseau.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: "tbm-auth" }
  )
);
