"use client";

import { useCallback, useEffect, useState } from "react";

function readParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

/**
 * État d'interface synchronisé avec un paramètre de l'URL (?clé=valeur).
 * Deep-linking frontend : onglet, sélection, filtre principal.
 * Hydration-safe : premier rendu = valeur par défaut, puis resynchronisation
 * côté client (popstate inclus).
 */
export function useParamState(key: string, fallback: string) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    const sync = () => {
      const v = readParam(key);
      setValue(v ?? fallback);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [key, fallback]);

  const set = useCallback(
    (v: string) => {
      setValue(v);
      if (typeof window === "undefined") return;
      const raw = readParam(key);
      if (!raw && v === fallback) return; // URL propre tant que l'état est neutre
      const url = new URL(window.location.href);
      if (v === fallback) url.searchParams.delete(key);
      else url.searchParams.set(key, v);
      window.history.replaceState(null, "", url.toString());
    },
    [key, fallback]
  );

  return [value, set] as const;
}

/** Réinitialise les paramètres secondaires (onglet, sélection) d'une page. */
export function clearSecondaryParams() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const k of ["tab", "sel"]) {
    if (url.searchParams.has(k)) {
      url.searchParams.delete(k);
      changed = true;
    }
  }
  if (changed) window.history.replaceState(null, "", url.toString());
}

/**
 * Valeur de paramètre validée : retombe sur `fallback` si la valeur
 * lue dans l'URL n'appartient pas à la liste autorisée (ex. onglet
 * issu d'une autre page).
 */
export function validParam(raw: string | null | undefined, allowed: readonly string[], fallback: string) {
  return raw && allowed.includes(raw) ? raw : fallback;
}
