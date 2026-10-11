"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { PAGE_SIZE_OPTIONS, pageSequence } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";

/**
 * Pied de liste paginée — composant unique partagé par toutes les tables du
 * back-office (DRY). Construit sur les primitives shadcn/ui « pagination »,
 * mais en <button> (action, pas un lien — meilleure sémantique clavier).
 *
 * - Étiquette de plage : « 1–10 sur 47 transactions » ;
 * - Sélecteur « lignes par page » (10 / 20 / 50) ;
 * - Numéros de page avec ellipses, page courante en corail (aria-current) ;
 * - Mobile : les numéros laissent place à « Page X / Y » (compact) ;
 * - Invisible si la liste est vide (les pages gèrent leurs empty states) ;
 * - Une seule page → contrôles de navigation masqués, plage conservée.
 */
export function TablePagination({
  page,
  pageCount,
  onPageChange,
  total,
  from,
  to,
  pageSize,
  onPageSizeChange,
  entity,
  entityPlural,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  total: number;
  from: number;
  to: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  /** Nom de l'entité au singulier (ex. « transaction »). */
  entity: string;
  /** Pluriel explicite si différent de « entity + s ». */
  entityPlural?: string;
  /** Choix « lignes par page » (défaut : PAGE_SIZE_OPTIONS). */
  pageSizeOptions?: readonly number[];
  className?: string;
}) {
  // Liste vide : aucun rendu (empty state géré par la page hôte).
  if (total === 0) return null;

  const label = `${from}–${to} sur ${total} ${
    total > 1 ? (entityPlural ?? `${entity}s`) : entity
  }`;
  const tokens = pageSequence(page, pageCount);
  const singlePage = pageCount <= 1;

  const navBtn =
    "h-8.5 w-8.5 rounded-xl border border-[var(--tbm-border)] bg-white p-0 text-[var(--tbm-text)] transition-colors hover:bg-[#F3F7F5] hover:text-[#003B2D] hover:border-[#003B2D]/40 disabled:opacity-40 disabled:pointer-events-none shadow-xs";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-[var(--tbm-border)] bg-[#F3F7F5]/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6",
        className
      )}
    >
      {/* Étiquette de plage */}
      <p className="text-[12px] font-medium text-[var(--tbm-text-muted)]" aria-live="polite">
        {label}
      </p>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* Lignes par page */}
        <div className="flex items-center gap-2">
          <span className="sr-only">Lignes par page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger
              aria-label="Lignes par page"
              className="h-8.5 w-[112px] shrink-0 rounded-xl border-[var(--tbm-border)] bg-white text-[12px] font-medium text-[var(--tbm-text)] shadow-xs hover:border-[#003B2D]/40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[var(--tbm-border)]">
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)} className="rounded-lg text-[12px]">
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile compact : précédent / « Page X / Y » / suivant */}
        {!singlePage && (
          <nav
            aria-label="Pagination compacte"
            className="flex items-center gap-2 sm:hidden"
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Page précédente"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className={navBtn}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Page précédente</span>
            </Button>
            <p className="min-w-[72px] text-center text-[12px] font-medium tabular-nums text-[var(--tbm-text)]">
              Page {page} / {pageCount}
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Page suivante"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
              className={navBtn}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Page suivante</span>
            </Button>
          </nav>
        )}

        {/* Navigation numérotée (masquée en dessous de sm et sur page unique) */}
        {!singlePage && (
          <Pagination
            aria-label="Pagination de la liste"
            className="mx-0 hidden w-auto justify-end sm:flex"
          >
            <PaginationContent className="gap-1.5">
              <PaginationItem>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Page précédente"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  className={navBtn}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Page précédente</span>
                </Button>
              </PaginationItem>

              {tokens.map((t, i) => (
                <PaginationItem key={`${t}-${i}`}>
                  {t === "ellipsis" ? (
                    <span
                      aria-hidden
                      className="flex h-8.5 w-6 items-center justify-center text-[var(--tbm-text-muted)]"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Pages supplémentaires</span>
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      aria-current={t === page ? "page" : undefined}
                      aria-label={
                        t === page
                          ? `Page actuelle ${t}`
                          : `Aller à la page ${t}`
                      }
                      onClick={() => onPageChange(t)}
                      className={cn(
                        "h-8.5 min-w-8.5 rounded-xl px-2 text-[12px] font-semibold tabular-nums transition-colors shadow-xs",
                        t === page
                          ? "border-[#003B2D] bg-[#003B2D] text-[#9BE000] hover:bg-[#002D22] hover:text-[#9BE000]"
                          : "border-[var(--tbm-border)] bg-white text-[var(--tbm-text)] hover:bg-[#F3F7F5] hover:text-[#003B2D] hover:border-[#003B2D]/40"
                      )}
                    >
                      {t}
                    </Button>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Page suivante"
                  disabled={page >= pageCount}
                  onClick={() => onPageChange(page + 1)}
                  className={navBtn}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Page suivante</span>
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
