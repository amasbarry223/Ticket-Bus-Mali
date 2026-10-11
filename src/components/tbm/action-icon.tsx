"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "coral"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "violet";

const TONES: Record<Tone, string> = {
  neutral:
    "border-[var(--tbm-border)] text-[var(--tbm-text-muted)] hover:bg-[#F3F7F5] hover:text-[var(--tbm-text)]",
  coral:
    "border-[var(--tbm-border)] text-[#003B2D] hover:bg-[#003B2D]/10 hover:text-[#003B2D]",
  emerald: "border-emerald-200 text-[var(--tbm-success)] hover:bg-emerald-50",
  amber: "border-amber-200 text-[var(--tbm-warning)] hover:bg-amber-50",
  rose: "border-rose-200 text-[var(--tbm-danger)] hover:bg-rose-50",
  sky: "border-sky-200 text-sky-600 hover:bg-sky-50",
  violet: "border-violet-200 text-violet-600 hover:bg-violet-50",
};

/**
 * Bouton d'action des colonnes « Actions » : icône seule, tooltip explicite
 * et label sr-only (accessibilité). Les actions stoppent la propagation du
 * clic pour ne pas ouvrir la fiche de la ligne. Utilisable aussi désactivé
 * (verrouillé) — le tooltip reste affiché pour expliquer la restriction.
 */
export function ActionIconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  tone = "neutral",
  className,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  tone?: Tone;
  className?: string;
}) {
  const btn = (
    <Button
      type="button"
      variant="outline"
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick?.(e);
      }}
      className={cn(
        "h-8 w-8 shrink-0 rounded-full p-0 transition-colors border",
        TONES[tone],
        disabled && "cursor-not-allowed opacity-45",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabled ? (
          <span className="inline-flex cursor-not-allowed">{btn}</span>
        ) : (
          btn
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11.5px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
