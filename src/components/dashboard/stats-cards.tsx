"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  HandCoins,
  Info,
  PiggyBank,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { kpis, type KpiIcon } from "./data";
import { cn } from "@/lib/utils";

const ICONS: Record<KpiIcon, LucideIcon> = {
  wallet: Wallet,
  piggy: PiggyBank,
  coins: HandCoins,
  card: CreditCard,
};

export function StatsCards({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {kpis.map((kpi, index) => {
        const Icon = ICONS[kpi.icon];
        const isUp = kpi.trend === "up";
        return (
          <motion.article
            key={kpi.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.05 + index * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group ff-card rounded-2xl border border-neutral-200/70 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-neutral-900/5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[13.5px] font-medium text-neutral-500">
                  {kpi.label}
                </h3>
                <Info className="h-3.5 w-3.5 text-neutral-300" aria-hidden="true" />
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 transition-colors duration-300 group-hover:bg-coral-50 group-hover:text-coral-500">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
            </div>

            <p className="mt-3 text-[26px] font-bold leading-none tracking-tight text-neutral-900">
              {kpi.value}
              <span className="text-lg font-medium text-neutral-300">
                {kpi.cents}
              </span>
            </p>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                    isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                  )}
                >
                  {kpi.delta}
                </span>
                <span className="text-xs text-neutral-400">From last month</span>
              </div>
              <ArrowRight
                className="h-4 w-4 text-neutral-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-coral-500"
                aria-hidden="true"
              />
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
