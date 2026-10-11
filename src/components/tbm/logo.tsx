"use client";

import { cn } from "@/lib/utils";

/**
 * Logo officiel TBM — Ticket Bus Mali en format PNG transparent (sans fond noir, non-converti en SVG).
 */
export function LogoTbm({ className }: { className?: string }) {
  return (
    <img
      src="/tbm-logo-clean.png"
      alt="TBM - Ticket Bus Mali"
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}


