"use client";

import { useMemo, useState } from "react";

/** Taille de page par défaut — source unique de vérité. */
export const DEFAULT_PAGE_SIZE = 10;

/** Choix proposés dans le sélecteur « lignes par page ». */
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

/**
 * Pagination de liste — hook générique réutilisé par toutes les tables du
 * back-office (DRY). Bonnes pratiques appliquées :
 *
 * 1. `pageItems` : tranche mémoïsée de la liste (aucun rendu hors page) ;
 * 2. clamp automatique : si la liste rétrécit (filtres, actions métier), la
 *    page courante est ramenée dans l'intervalle — jamais de page vide ;
 * 3. `resetKey` déclaratif : la page revient à 1 dès que la signature des
 *    filtres / de l'onglet change (à passer par la page) ;
 * 4. changement de taille de page → retour à la page 1 (comportement attendu) ;
 * 5. `from` / `to` prêts pour l'étiquette « 1–10 sur 47 transactions ».
 *
 * Les ajustements (2) et (3) se font **pendant le rendu** — pattern React
 * officiel « updating state during render » (react.dev) — et non dans un
 * effet : pas de rendu en cascade, aucune fenêtre où une page invalide est
 * affichée.
 *
 * La page n'est PAS synchronisée à l'URL : seuls ?page=, ?tab= et ?sel= sont
 * deep-linkables (convention projet) — la pagination est un état d'interface
 * éphémère, réinitialisé au changement de filtre via `resetKey`.
 */
export function useTablePagination<T>(
  items: readonly T[],
  options: {
    /** Taille de page initiale (défaut : DEFAULT_PAGE_SIZE). */
    initialPageSize?: number;
    /**
     * Signature des filtres actifs (ex. `[search, statut, tab].join("|")`).
     * Dès qu'elle change, la pagination revient à la page 1.
     */
    resetKey?: string;
  } = {}
) {
  const { initialPageSize = DEFAULT_PAGE_SIZE, resetKey } = options;

  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Ajustement pendant le rendu (pattern React officiel, pas d'effet) :
  // - la signature des filtres a changé → retour page 1 ;
  // - la liste a rétréci → page ramenée dans l'intervalle valide.
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPageState(1);
  } else if (page > pageCount) {
    setPageState(pageCount);
  }

  /** Change de page (valeur bornée automatiquement). */
  const setPage = (p: number) =>
    setPageState(Math.min(Math.max(1, p), pageCount));

  /** Change la taille de page et revient en page 1. */
  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPageState(1);
  };

  // 1. Tranche affichée, mémoïsée.
  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  // 5. Bornes pour l'étiquette de plage.
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    pageCount,
    pageItems,
    from,
    to,
    hasNext: page < pageCount,
    hasPrev: page > 1,
  } as const;
}

export type PageToken = number | "ellipsis";

/**
 * Numéros de page à afficher, avec ellipses (« 1 … 4 5 6 … 12 »).
 * Fenêtre glissante autour de la page courante ; les bornes 1 et count sont
 * toujours visibles ; un écart d'une seule page est affiché plutôt qu'ellipsé.
 */
export function pageSequence(
  current: number,
  count: number,
  window = 1
): PageToken[] {
  // Petite pagination : toutes les pages, aucune ellipse.
  if (count <= 5 + window * 2) {
    return Array.from({ length: count }, (_, i) => i + 1);
  }
  const set = new Set<number>(
    [1, count, current - window, current, current + window].filter(
      (p) => p >= 1 && p <= count
    )
  );
  const sorted = [...set].sort((a, b) => a - b);
  const out: PageToken[] = [];
  let prev = 0;
  for (const p of sorted) {
    const gap = p - prev;
    if (gap === 2) out.push(prev + 1); // une seule page manquée → affichée
    else if (gap > 2) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}
