"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  ArrowRight,
  BadgePercent,
  BarChart3,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  HelpCircle,
  MapPin,
  MoreVertical,
  Plus,
  RotateCcw,
  Settings,
  Ticket,
  TrendingUp,
  Users,
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
import { formatFcfa } from "@/components/tbm/data";
import { TablePagination } from "@/components/tbm/table-pagination";
import { type SectionId } from "@/components/tbm/sidebar";
import { cn } from "@/lib/utils";

// Données du graphique correspondant au screenshot
const CHART_DATA = [
  { day: "23/09", ventes: 750000 },
  { day: "24/09", ventes: 820000 },
  { day: "25/09", ventes: 860000 },
  { day: "26/09", ventes: 1120000 },
  { day: "27/09", ventes: 1250000 },
  { day: "28/09", ventes: 1040000 },
  { day: "29/09", ventes: 720000 },
  { day: "30/09", ventes: 920000 },
  { day: "01/10", ventes: 1110000 },
  { day: "02/10", ventes: 1260000 },
  { day: "03/10", ventes: 1140000 },
  { day: "04/10", ventes: 1350000 },
  { day: "05/10", ventes: 1280000 },
  { day: "06/10", ventes: 1245000 },
];

// 4 Compagnies actives avec part des ventes
const TOP_COMPANIES = [
  {
    nom: "Bamako Express",
    ventes: 406200,
    part: 85,
    tag: "BE",
    iconBg: "bg-emerald-500",
  },
  {
    nom: "Djoliba Transport",
    ventes: 341800,
    part: 72,
    tag: "DT",
    iconBg: "bg-red-500",
  },
  {
    nom: "Sahel Bus",
    ventes: 228500,
    part: 50,
    tag: "SB",
    iconBg: "bg-amber-500",
  },
  {
    nom: "Sikasso Voyage",
    ventes: 188500,
    part: 42,
    tag: "SV",
    iconBg: "bg-blue-600",
  },
];

// Dernières transactions fidèles au screenshot
const LATEST_TRANSACTIONS = [
  {
    id: "TXN-10252",
    date: "Aujourd'hui 06:15",
    compagnie: "Bamako Express",
    methode: "Orange Money",
    type: "Paiement",
    montant: 10500,
    statut: "reussi",
    statutLabel: "Réussi",
  },
  {
    id: "TXN-10251",
    date: "Aujourd'hui 09:58",
    compagnie: "Bamako Express",
    methode: "Moov Money",
    type: "Paiement",
    montant: 9000,
    statut: "en_attente",
    statutLabel: "En attente",
  },
  {
    id: "TXN-10250",
    date: "Aujourd'hui 10:22",
    compagnie: "Sikasso Voyage",
    methode: "Moov Money",
    type: "Paiement",
    montant: 9000,
    statut: "en_attente",
    statutLabel: "En attente",
  },
  {
    id: "TXN-10249",
    date: "Aujourd'hui 10:31",
    compagnie: "Bamako Express",
    methode: "Orange Money",
    type: "Paiement",
    montant: 15000,
    statut: "expire",
    statutLabel: "Expiré",
  },
  {
    id: "TXN-10248",
    date: "Aujourd'hui 11:20",
    compagnie: "Sahel Bus",
    methode: "Orange Money",
    type: "Paiement",
    montant: 17500,
    statut: "rembourse",
    statutLabel: "Remboursé",
  },
  {
    id: "TXN-10247",
    date: "Hier 08:12",
    compagnie: "Kayes Lines",
    methode: "Moov Money",
    type: "Paiement",
    montant: 9250,
    statut: "reussi",
    statutLabel: "Réussi",
  },
];

function CustomChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: { day: string; ventes: number } }[];
}) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 shadow-xl">
      <p className="text-xs font-semibold text-neutral-800">{point.day}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-full bg-[#3ca408]" />
        <span className="text-neutral-500">Ventes :</span>
        <span className="font-bold tabular-nums text-neutral-900">
          {formatFcfa(point.ventes)}
        </span>
      </div>
    </div>
  );
}

// Mini Sparkline SVG composable
function MiniSparkline({ color }: { color: "green" | "blue" }) {
  const strokeColor = color === "green" ? "#5ec81c" : "#00a8ff";
  return (
    <svg className="h-8 w-16 shrink-0" viewBox="0 0 64 32" fill="none">
      <path
        d="M2 24 C 12 28, 18 10, 28 18 C 38 26, 46 8, 62 4"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashboardPage({
  onNavigate,
}: {
  onNavigate?: (id: SectionId) => void;
} = {}) {
  const [dateFilter, setDateFilter] = useState("23/09/2025 → 06/10/2025");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalTxns = LATEST_TRANSACTIONS.length;
  const paginatedTransactions = LATEST_TRANSACTIONS.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      {/* ========================================================
          1. HERO BANNER : "Tableau de bord" avec Bus & Slogan
         ======================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#031d14] via-[#052c1e] to-[#073827] shadow-sm"
      >
        {/* Image de fond découpée ou superposition si présente */}
        <div
          className="absolute inset-0 bg-cover bg-right bg-no-repeat opacity-45 mix-blend-luminosity"
          style={{ backgroundImage: `url('/hero-banner.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#031d14] via-[#031d14]/90 to-transparent" />

        <div className="relative flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6 lg:p-7">
          <div className="max-w-xl">
            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl lg:text-[26px]">
              Tableau de bord
            </h1>
            <p className="mt-1 text-xs font-normal text-emerald-100/80 sm:text-sm">
              Suivez en temps réel l'activité de votre plateforme TBM.
            </p>
          </div>

          {/* Côté droit avec image du bus et slogan */}
          <div className="flex items-center gap-4 self-end sm:self-center">
            {/* Visual Bus TBM */}
            <div className="hidden items-center md:flex">
              <img
                src="/hero-bus.png"
                alt="Bus TBM"
                className="h-16 w-auto max-w-[280px] object-contain drop-shadow-md"
              />
            </div>
            {/* Slogan en vert lime / doré italique */}
            <div className="text-right leading-tight">
              <p className="font-serif italic text-xs font-semibold text-[#bcf236] sm:text-sm">
                Plus proche,
              </p>
              <p className="font-serif italic text-xs font-semibold text-[#bcf236] sm:text-sm">
                plus simple,
              </p>
              <p className="font-serif italic text-xs font-semibold text-[#bcf236] sm:text-sm">
                plus de voyages !
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ========================================================
          2. KPI CARDS : 4 cartes en ligne avec icônes colorées
         ======================================================== */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Ventes aujourd'hui */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="flex items-center justify-between rounded-2xl border border-[var(--tbm-border)] bg-white p-4 shadow-xs"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#003B2D] text-[#9BE000] shadow-xs">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-[var(--tbm-text-muted)]">
                  Ventes aujourd'hui
                </p>
                <p className="text-lg font-black tracking-tight text-[var(--tbm-text)] sm:text-xl">
                  1 245 000 FCFA
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 pl-1 text-[11px]">
              <span className="flex items-center rounded-md bg-[#9BE000]/20 px-1.5 py-0.5 font-bold text-[#003B2D]">
                ↑ +12 %
              </span>
              <span className="text-[var(--tbm-text-muted)]">vs hier</span>
            </div>
          </div>
          <MiniSparkline color="green" />
        </motion.div>

        {/* Tickets vendus (mois) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="flex items-center justify-between rounded-2xl border border-[var(--tbm-border)] bg-white p-4 shadow-xs"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#003B2D] text-white shadow-xs">
                <Ticket className="h-5 w-5 rotate-45 text-[#9BE000]" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-[var(--tbm-text-muted)]">
                  Tickets vendus (mois)
                </p>
                <p className="text-lg font-black tracking-tight text-[var(--tbm-text)] sm:text-xl">
                  3 412
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 pl-1 text-[11px]">
              <span className="flex items-center rounded-md bg-[#9BE000]/20 px-1.5 py-0.5 font-bold text-[#003B2D]">
                ↑ +8,4 %
              </span>
              <span className="text-[var(--tbm-text-muted)]">toutes compagnies</span>
            </div>
          </div>
          <MiniSparkline color="blue" />
        </motion.div>

        {/* Compagnies actives */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="flex items-center justify-between rounded-2xl border border-[var(--tbm-border)] bg-white p-4 shadow-xs"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#001D18] text-[#9BE000] shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-[var(--tbm-text-muted)]">
                  Compagnies actives
                </p>
                <p className="text-lg font-black tracking-tight text-[var(--tbm-text)] sm:text-xl">
                  4 / 6
                </p>
              </div>
            </div>
            <div className="mt-2.5 pl-1 text-[11px] text-[var(--tbm-text-muted)]">
              sur la plateforme
            </div>
          </div>
          <MiniSparkline color="blue" />
        </motion.div>

        {/* Taux de conversion */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="flex items-center justify-between rounded-2xl border border-[var(--tbm-border)] bg-white p-4 shadow-xs"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--tbm-warning)] text-white shadow-xs">
                <BadgePercent className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-[var(--tbm-text-muted)]">
                  Taux de conversion
                </p>
                <p className="text-lg font-black tracking-tight text-[var(--tbm-text)] sm:text-xl">
                  62 %
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 pl-1 text-[11px]">
              <span className="flex items-center rounded-md bg-[#9BE000]/20 px-1.5 py-0.5 font-bold text-[#003B2D]">
                ↑ +3 pts
              </span>
              <span className="text-[var(--tbm-text-muted)]">recherches → paiement</span>
            </div>
          </div>
          <MiniSparkline color="green" />
        </motion.div>
      </div>

      {/* ========================================================
          3. ROW 2 : VENTES 14 DERNIERS JOURS + COMPAGNIES ACTIVES
         ======================================================== */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Graphique des ventes (8 cols) */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl border border-[var(--tbm-border)] bg-white p-5 shadow-xs xl:col-span-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#003B2D] text-[#9BE000] shadow-xs">
                <TrendingUp className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-[var(--tbm-text)] sm:text-base">
                Ventes des 14 derniers jours <span className="text-[#003B2D]">↗</span>
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-lg bg-neutral-100 px-3 py-1 font-medium text-neutral-600">
                Montants en FCFA
              </span>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 font-medium text-neutral-700 hover:border-neutral-300"
              >
                <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                <span>{dateFilter}</span>
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              </button>
            </div>
          </div>

          <div className="mt-4 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={CHART_DATA}
                margin={{ top: 12, right: 12, bottom: 0, left: -10 }}
              >
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5ec81c" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#5ec81c" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f0f2f1" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8c9b92", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tick={{ fill: "#8c9b92", fontSize: 11 }}
                  ticks={[0, 350000, 700000, 1100000, 1400000]}
                  tickFormatter={(v: number) => {
                    if (v === 0) return "0";
                    if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(".", ",")}M`;
                    return `${Math.round(v / 1000)}k`;
                  }}
                />
                <Tooltip
                  content={<CustomChartTooltip />}
                  cursor={{ stroke: "#a0b5a6", strokeDasharray: "3 3" }}
                />
                <Area
                  type="monotone"
                  dataKey="ventes"
                  stroke="#3ca408"
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                  dot={{ r: 3, fill: "#3ca408", strokeWidth: 0 }}
                  activeDot={{
                    r: 5,
                    fill: "#fff",
                    stroke: "#3ca408",
                    strokeWidth: 2.5,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Compagnies actives (4 cols) */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm xl:col-span-4"
        >
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eaf8e2] text-[#3ca408]">
                <Building2 className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Compagnies actives
                </h3>
                <p className="text-[11.5px] text-neutral-400">
                  Part des ventes aujourd'hui
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3.5">
              {TOP_COMPANIES.map((comp) => (
                <div key={comp.nom} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold text-white shadow-xs",
                          comp.iconBg
                        )}
                      >
                        {comp.tag}
                      </span>
                      <span className="font-semibold text-neutral-800">
                        {comp.nom}
                      </span>
                    </div>
                    <span className="font-bold tabular-nums text-neutral-700">
                      {formatFcfa(comp.ventes)}
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-[#3ca408] transition-all duration-500"
                      style={{ width: `${comp.part}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rapprochement concordant P05 */}
          <div className="mt-5 flex items-center justify-between rounded-xl bg-[#eaf8e6] px-3.5 py-2.5 text-xs font-semibold text-[#2b8214]">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3ca408] text-white">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </span>
              <span>Rapprochement du jour concordant (P05)</span>
            </div>
            <ChevronRight className="h-4 w-4 text-[#2b8214]" />
          </div>
        </motion.section>
      </div>

      {/* ========================================================
          4. ROW 3 : DERNIÈRES TRANSACTIONS + GÉREZ VOS VENTES
         ======================================================== */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Dernières transactions (8 cols) */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="rounded-2xl border border-[var(--tbm-border)] bg-white p-5 shadow-xs xl:col-span-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#003B2D] text-[#9BE000] shadow-xs">
                  <Ticket className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[var(--tbm-text)] sm:text-base">
                    Dernières transactions
                  </h3>
                  <p className="text-[11px] text-[var(--tbm-text-muted)]">
                    Flux des réservations en temps réel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.("transactions")}
                className="flex items-center gap-1 text-xs font-bold text-[#003B2D] hover:text-[#001D18] hover:underline cursor-pointer"
              >
                Voir tout <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--tbm-border)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3F7F5]/80">
                  <tr className="border-b border-[var(--tbm-border)] text-[11px] font-semibold text-[var(--tbm-text-muted)]">
                    <th className="py-2.5 px-3">N° Transaction</th>
                    <th className="py-2.5 px-3">Date & Heure</th>
                    <th className="py-2.5 px-3">Compagnie / Ligne</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Montant</th>
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 px-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--tbm-border)]">
                  {paginatedTransactions.map((txn) => (
                    <tr key={txn.id} className="transition-colors hover:bg-[#F3F7F5]/60">
                      <td className="py-3 px-3 font-bold text-[var(--tbm-text)]">
                        {txn.id}
                      </td>
                      <td className="py-3 px-3 text-[var(--tbm-text-muted)] whitespace-nowrap">
                        {txn.date}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[var(--tbm-text)]">
                          {txn.compagnie}
                        </span>
                        <span className="text-[var(--tbm-text-muted)]"> · {txn.methode}</span>
                      </td>
                      <td className="py-3 px-3 text-[var(--tbm-text-muted)]">{txn.type}</td>
                      <td className="py-3 px-3 font-bold text-[var(--tbm-text)] whitespace-nowrap">
                        {formatFcfa(txn.montant)}
                      </td>
                      <td className="py-3 px-3">
                        {txn.statut === "reussi" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                            <Check className="h-3 w-3 stroke-[3]" />
                            {txn.statutLabel}
                          </span>
                        )}
                        {txn.statut === "en_attente" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                            <Clock className="h-3 w-3" />
                            {txn.statutLabel}
                          </span>
                        )}
                        {txn.statut === "expire" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                            {txn.statutLabel}
                          </span>
                        )}
                        {txn.statut === "rembourse" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
                            <RotateCcw className="h-3 w-3" />
                            {txn.statutLabel}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          aria-label="Actions transaction"
                          onClick={() => onNavigate?.("transactions")}
                          className="rounded-lg p-1 text-[var(--tbm-text-muted)] hover:bg-[#F3F7F5] hover:text-[var(--tbm-text)] transition-colors cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[var(--tbm-border)]">
            <TablePagination
              page={currentPage}
              pageCount={Math.max(1, Math.ceil(totalTxns / pageSize))}
              total={totalTxns}
              from={(currentPage - 1) * pageSize + 1}
              to={Math.min(totalTxns, currentPage * pageSize)}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              entity="transaction"
              entityPlural="transactions"
            />
          </div>
        </motion.section>

        {/* Gérez vos ventes (4 cols) */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#003B2D] bg-[#001D18] p-5 sm:p-6 text-white shadow-sm xl:col-span-4"
        >
          {/* Illustration bus en haut à droite */}
          <div className="absolute right-3 top-3 opacity-90 pointer-events-none">
            <img
              src="/mini-bus.png"
              alt="Mini bus TBM"
              className="h-14 w-auto object-contain"
            />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Gérez vos ventes</h3>
            <p className="mt-1 text-xs sm:text-[13px] font-normal text-[#8ea698]">
              et suivez vos compagnies en toute simplicité.
            </p>

            {/* Grille des 6 boutons d'actions AGRANDIS */}
            <div className="mt-6 grid grid-cols-2 gap-3.5 sm:gap-4">
              {/* 1. Ajouter une compagnie */}
              <button
                type="button"
                onClick={() => onNavigate?.("companies")}
                className="group flex min-h-[72px] sm:min-h-[80px] items-center gap-3 rounded-2xl border border-[#003B2D] bg-[#002f24] p-3.5 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00513e] hover:bg-[#003B2D] hover:shadow-lg hover:shadow-black/25 cursor-pointer"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#9BE000] text-[#001D18] shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <Plus className="h-6 w-6 stroke-[3]" />
                </span>
                <span className="text-xs sm:text-[13.5px] font-bold text-white leading-tight group-hover:text-[#9BE000] transition-colors">
                  Ajouter une compagnie
                </span>
              </button>

              {/* 2. Nouvelle transaction */}
              <button
                type="button"
                onClick={() => onNavigate?.("transactions")}
                className="group flex min-h-[72px] sm:min-h-[80px] items-center gap-3 rounded-2xl border border-[#003B2D] bg-[#002f24] p-3.5 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00513e] hover:bg-[#003B2D] hover:shadow-lg hover:shadow-black/25 cursor-pointer"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#9BE000] text-[#001D18] shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <ArrowLeftRight className="h-5 w-5 stroke-[2.5]" />
                </span>
                <span className="text-xs sm:text-[13.5px] font-bold text-white leading-tight group-hover:text-[#9BE000] transition-colors">
                  Nouvelle transaction
                </span>
              </button>

              {/* 3. Voir les gares */}
              <button
                type="button"
                onClick={() => onNavigate?.("cities")}
                className="group flex min-h-[72px] sm:min-h-[80px] items-center gap-3 rounded-2xl border border-[#003B2D] bg-[#002f24] p-3.5 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00513e] hover:bg-[#003B2D] hover:shadow-lg hover:shadow-black/25 cursor-pointer"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#9BE000] text-[#001D18] shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <MapPin className="h-5 w-5 stroke-[2.5]" />
                </span>
                <span className="text-xs sm:text-[13.5px] font-bold text-white leading-tight group-hover:text-[#9BE000] transition-colors">
                  Voir les gares
                </span>
              </button>

              {/* 4. Générer un rapport */}
              <button
                type="button"
                onClick={() => onNavigate?.("audit")}
                className="group flex min-h-[72px] sm:min-h-[80px] items-center gap-3 rounded-2xl border border-[#003B2D] bg-[#002f24] p-3.5 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00513e] hover:bg-[#003B2D] hover:shadow-lg hover:shadow-black/25 cursor-pointer"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#9BE000] text-[#001D18] shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <BarChart3 className="h-5 w-5 stroke-[2.5]" />
                </span>
                <span className="text-xs sm:text-[13.5px] font-bold text-white leading-tight group-hover:text-[#9BE000] transition-colors">
                  Générer un rapport
                </span>
              </button>

              {/* 5. Paramètres */}
              <button
                type="button"
                onClick={() => onNavigate?.("settings")}
                className="group flex min-h-[72px] sm:min-h-[80px] items-center gap-3 rounded-2xl border border-[#003B2D] bg-[#002f24] p-3.5 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00513e] hover:bg-[#003B2D] hover:shadow-lg hover:shadow-black/25 cursor-pointer"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#9BE000] text-[#001D18] shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <Settings className="h-5 w-5 stroke-[2.5]" />
                </span>
                <span className="text-xs sm:text-[13.5px] font-bold text-white leading-tight group-hover:text-[#9BE000] transition-colors">
                  Paramètres
                </span>
              </button>

              {/* 6. Aide */}
              <button
                type="button"
                onClick={() => alert("Centre d'assistance TBM — Pour toute assistance, contactez le support au +223 70 00 00 00.")}
                className="group flex min-h-[72px] sm:min-h-[80px] items-center gap-3 rounded-2xl border border-[#003B2D] bg-[#002f24] p-3.5 sm:p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00513e] hover:bg-[#003B2D] hover:shadow-lg hover:shadow-black/25 cursor-pointer"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#9BE000] text-[#001D18] shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <HelpCircle className="h-5 w-5 stroke-[2.5]" />
                </span>
                <span className="text-xs sm:text-[13.5px] font-bold text-white leading-tight group-hover:text-[#9BE000] transition-colors">
                  Aide
                </span>
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
