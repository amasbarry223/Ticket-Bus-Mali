import { cn } from "@/lib/utils";

/**
 * Logo TBM — Ticket Bus Mali.
 * Icône de bus dans un carré arrondi corail.
 */
export function LogoTbm({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-coral-400 via-coral-500 to-coral-600 text-white shadow-md shadow-coral-500/30",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%]">
        {/* Carrosserie du bus */}
        <rect
          x="3.2"
          y="4.4"
          width="17.6"
          height="12.4"
          rx="2.6"
          stroke="currentColor"
          strokeWidth="2.1"
        />
        {/* Pare-brise */}
        <path d="M6.6 8h10.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
        {/* Roues */}
        <circle cx="7.6" cy="19.2" r="1.7" fill="currentColor" />
        <circle cx="16.4" cy="19.2" r="1.7" fill="currentColor" />
      </svg>
    </span>
  );
}

/**
 * Bloc logo + nom, utilisé sur l’écran de connexion et la sidebar.
 */
export function LogoTbmFull({
  className,
  subtitle,
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoTbm className="h-10 w-10" />
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight tracking-tight text-neutral-900">
          TBM <span className="text-coral-500">·</span> Back-office
        </p>
        <p className="truncate text-[11.5px] font-medium text-neutral-400">
          {subtitle ?? "Ticket Bus Mali"}
        </p>
      </div>
    </div>
  );
}
