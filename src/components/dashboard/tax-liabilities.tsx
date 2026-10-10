"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { taxes, type TaxTone } from "./data";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<TaxTone, string> = {
  strong: "bg-coral-500",
  medium: "bg-coral-400",
  soft: "bg-coral-300",
};

const PERIODS = ["Monthly", "Quarterly", "Yearly"];

export function TaxLiabilities({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "ff-card rounded-2xl border border-neutral-200/70 bg-white p-5",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-neutral-900">
            Tax Liabilities
          </h3>
          <p className="mt-2 text-[26px] font-bold leading-none tracking-tight text-neutral-900">
            32.872,00
          </p>
        </div>
        <Select defaultValue="Yearly">
          <SelectTrigger
            aria-label="Tax period"
            className="h-8 w-[108px] rounded-lg border-none bg-transparent px-2.5 text-[13px] font-medium text-neutral-600 shadow-none hover:bg-neutral-100 focus:ring-0 focus:ring-offset-0 [&>svg]:size-4 [&>svg]:text-neutral-400"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-[120px] rounded-xl border-neutral-100">
            {PERIODS.map((period) => (
              <SelectItem
                key={period}
                value={period}
                className="rounded-lg text-[13px]"
              >
                {period}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8 space-y-6">
        {taxes.map((tax, index) => (
          <div key={tax.label} className="group">
            <div
              className="h-2 overflow-hidden rounded-full bg-rose-100/70"
              role="progressbar"
              aria-valuenow={tax.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={tax.label}
            >
              <div
                className={cn(
                  "ff-progress-fill h-full rounded-full transition-colors",
                  TONE_CLASSES[tax.tone]
                )}
                style={{
                  width: `${tax.percent}%`,
                  animationDelay: `${0.25 + index * 0.15}s`,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 transition-colors group-hover:text-neutral-800">
                {tax.label}
              </span>
              <span className="text-xs font-semibold tabular-nums text-neutral-400">
                {tax.percent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
