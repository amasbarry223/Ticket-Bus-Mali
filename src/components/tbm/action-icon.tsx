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
    "border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700",
  coral:
    "border-coral-200 text-coral-500 hover:bg-coral-50 hover:text-coral-600",
  emerald: "border-emerald-200 text-emerald-600 hover:bg-emerald-50",
  amber: "border-amber-200 text-amber-600 hover:bg-amber-50",
  rose: "border-rose-200 text-rose-600 hover:bg-rose-50",
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
        "h-8 w-8 shrink-0 rounded-lg p-0 transition-colors",
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
