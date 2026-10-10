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
    "h-8 w-8 rounded-lg p-0 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {/* Étiquette de plage */}
      <p className="text-[11.5px] text-neutral-500" aria-live="polite">
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
              className="h-8 w-[102px] shrink-0 rounded-xl border-neutral-200 text-[11.5px] text-neutral-600"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)} className="text-[12px]">
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
              className={cn(navBtn, "border-neutral-200")}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Page précédente</span>
            </Button>
            <p className="min-w-[72px] text-center text-[11.5px] tabular-nums text-neutral-500">
              Page {page} / {pageCount}
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Page suivante"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
              className={cn(navBtn, "border-neutral-200")}
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
            <PaginationContent className="gap-1">
              <PaginationItem>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Page précédente"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  className={cn(navBtn, "border-neutral-200")}
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
                      className="flex h-8 w-6 items-center justify-center text-neutral-300"
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
                        "h-8 min-w-8 rounded-lg px-1.5 text-[12px] font-semibold tabular-nums transition-colors",
                        t === page
                          ? "border-coral-500 bg-coral-500 text-white hover:bg-coral-500 hover:text-white"
                          : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
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
                  className={cn(navBtn, "border-neutral-200")}
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
