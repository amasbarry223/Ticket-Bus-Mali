import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-coral-400 via-coral-500 to-coral-600 text-white shadow-md shadow-coral-500/30",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[58%] w-[58%]">
        <path
          d="M4.6 15.6c3.2 0 3.8-6 7.3-6 2.6 0 2.4 3.5 5 3.5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="17.7" cy="6.9" r="1.8" fill="currentColor" />
      </svg>
    </span>
  );
}
