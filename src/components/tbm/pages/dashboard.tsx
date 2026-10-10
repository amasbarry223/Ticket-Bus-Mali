"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgePercent,
  Building2,
  CheckCircle2,
  Ticket,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatFcfa,
  formatNumber,
  globalStats,
  PAYMENT_STATUS_META,
  salesSeries,
  topCompanies,
  transactions,
} from "@/components/tbm/data";
import { cn } from "@/lib/utils";

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: { day: string; ventes: number } }[];
}) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const point = payload[0].payload;
  return (
    <div className="min-w-[150px] rounded-xl border border-neutral-100 bg-white px-3.5 py-3 shadow-xl shadow-neutral-900/10">
      <p className="text-xs font-semibold text-neutral-800">{point.day}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-full bg-coral-500" />
        <span className="text-neutral-400">Ventes</span>
        <span className="ml-auto font-semibold tabular-nums text-neutral-800">
          {formatFcfa(point.ventes)}
        </span>
      </div>
    </div>
  );
}

interface KpiProps {
  label: string;
  value: string;
  delta?: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  index: number;
}

function Kpi({ label, value, delta, hint, icon: Icon, index }: KpiProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group ff-card rounded-2xl border border-neutral-200/70 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-neutral-900/5"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-[13.5px] font-medium text-neutral-500">{label}</h3>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 transition-colors duration-300 group-hover:bg-coral-50 group-hover:text-coral-500">
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-[24px] font-bold leading-none tracking-tight text-neutral-900">
        {value}
      </p>
      <div className="mt-3.5 flex items-center gap-2">
        {delta && (
          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600">
            {delta}
          </span>
        )}
        <span className="text-xs text-neutral-400">{hint}</span>
      </div>
    </motion.article>
  );
}

/**
 * Tableau de bord — statistiques globales (A08) :
 * ventes, conversion, compagnies actives.
 */
export function DashboardPage() {
  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          index={0}
          label="Ventes aujourd’hui"
          value={formatFcfa(globalStats.ventesAujourdhui)}
          delta={globalStats.deltaVentes}
          hint="vs hier"
          icon={Wallet}
        />
        <Kpi
          index={1}
          label="Tickets vendus (mois)"
          value={formatNumber(globalStats.ticketsMois)}
          delta={globalStats.deltaTickets}
          hint="toutes compagnies"
          icon={Ticket}
        />
        <Kpi
          index={2}
          label="Compagnies actives"
          value={`${globalStats.compagniesActives} / ${globalStats.compagniesTotal}`}
          hint="sur la plateforme"
          icon={Building2}
        />
        <Kpi
          index={3}
          label="Taux de conversion"
          value={`${globalStats.conversion} %`}
          delta={globalStats.deltaConversion}
          hint="recherches → paiement"
          icon={BadgePercent}
        />
      </div>

      {/* Graphique + top compagnies */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="ff-card rounded-2xl border border-neutral-200/70 bg-white p-5 xl:col-span-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-neutral-900">
                Ventes des 14 derniers jours
              </h3>
              <TrendingUp className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            </div>
            <span className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-500">
              Montants en FCFA
            </span>
          </div>
          <div className="mt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesSeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="tbmSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0655c" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#f0655c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f1f3" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={46}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  tickFormatter={(v: number) =>
                    v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`
                  }
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#d4d4d8", strokeDasharray: "4 4" }} />
                <Area
                  type="monotone"
                  dataKey="ventes"
                  stroke="#f0655c"
                  strokeWidth={2.2}
                  fill="url(#tbmSales)"
                  activeDot={{ r: 4, fill: "#fff", stroke: "#f0655c", strokeWidth: 2.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="ff-card rounded-2xl border border-neutral-200/70 bg-white p-5 xl:col-span-4"
        >
          <h3 className="text-[15px] font-semibold text-neutral-900">
            Compagnies actives
          </h3>
          <p className="mt-0.5 text-[12px] text-neutral-400">
            Part des ventes aujourd’hui
          </p>
          <ul className="mt-4 space-y-4">
            {topCompanies.map((c, i) => (
              <li key={c.nom}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-neutral-700">{c.nom}</span>
                  <span className="font-semibold tabular-nums text-neutral-500">
                    {formatFcfa(c.ventes)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={cn(
                      "ff-progress-fill h-full rounded-full",
                      i === 0 ? "bg-coral-500" : i === 1 ? "bg-coral-400" : i === 2 ? "bg-coral-300" : "bg-coral-200"
                    )}
                    style={{ width: `${c.part}%`, animationDelay: `${0.3 + i * 0.12}s` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-2.5 text-[12px] font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Rapprochement du jour concordant (P05)
          </div>
        </motion.section>
      </div>

      {/* Dernières transactions */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="ff-card mt-4 rounded-2xl border border-neutral-200/70 bg-white p-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-neutral-900">
            Dernières transactions
          </h3>
          <span className="flex items-center gap-1 text-xs font-medium text-neutral-400">
            Supervision A02
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
        <ul className="mt-3 divide-y divide-neutral-100">
          {transactions.slice(0, 6).map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="w-24 shrink-0 text-[12.5px] font-semibold tabular-nums text-neutral-700">
                {t.id}
              </span>
              <span className="hidden w-28 shrink-0 text-[12.5px] text-neutral-400 sm:block">
                {t.date}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-neutral-600">
                {t.compagnie}
                <span className="text-neutral-300"> · </span>
                <span className="text-neutral-400">{t.operateur}</span>
              </span>
              <span className="text-[12.5px] font-semibold tabular-nums text-neutral-800">
                {formatFcfa(t.montant)}
              </span>
              <span
                className={cn(
                  "w-[86px] rounded-md px-2 py-0.5 text-center text-[11px] font-semibold",
                  PAYMENT_STATUS_META[t.statut].className
                )}
              >
                {PAYMENT_STATUS_META[t.statut].label}
              </span>
            </li>
          ))}
        </ul>
      </motion.section>
    </div>
  );
}
