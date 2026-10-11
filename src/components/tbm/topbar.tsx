"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowLeftRight,
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  LogOut,
  MapPin,
  Menu,
  Percent,
  Route,
  ScrollText,
  Settings,
  Sun,
  Ticket,
  Undo2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuthStore } from "@/lib/auth-store";
import { ROLE_LABEL, type StaffRole } from "@/components/tbm/data";
import { type SectionId } from "@/components/tbm/sidebar";
import { cn } from "@/lib/utils";

interface SectionHeaderMeta {
  group: "PILOTAGE" | "ADMINISTRATION";
  title: string;
  badge?: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
}

const SECTION_HEADER_MAP: Record<Exclude<SectionId, "dashboard">, SectionHeaderMeta> = {
  companies: {
    group: "PILOTAGE",
    title: "Compagnies",
    subtitle: "Gestion des transporteurs, flotte et paramètres commerciaux",
    icon: Building2,
  },
  transactions: {
    group: "PILOTAGE",
    title: "Transactions",
    badge: "2",
    subtitle: "Flux de paiements et réconciliation mobile money",
    icon: ArrowLeftRight,
  },
  refunds: {
    group: "PILOTAGE",
    title: "Remboursements",
    badge: "4",
    subtitle: "Demandes d’arbitrage et annulations de billets",
    icon: Undo2,
  },
  settlements: {
    group: "PILOTAGE",
    title: "Reversements",
    badge: "5",
    subtitle: "Règlements périodiques et commissions transporteurs",
    icon: Percent,
  },
  cities: {
    group: "PILOTAGE",
    title: "Villes & Gares",
    subtitle: "Réseau urbain, gares routières et points d’embarquement",
    icon: MapPin,
  },
  lines: {
    group: "PILOTAGE",
    title: "Lignes & Départs",
    subtitle: "Trajets interurbains, escales et programmation des départs",
    icon: Route,
  },
  reservations: {
    group: "PILOTAGE",
    title: "Réservations",
    badge: "2",
    subtitle: "Billetterie, passagers et statuts d’embarquement",
    icon: Ticket,
  },
  users: {
    group: "ADMINISTRATION",
    title: "Utilisateurs",
    badge: "2",
    subtitle: "Comptes d’accès, permissions et rôles du personnel",
    icon: Users,
  },
  audit: {
    group: "ADMINISTRATION",
    title: "Journal d’audit",
    subtitle: "Traçabilité chronologique des actions et sécurité",
    icon: ScrollText,
  },
  settings: {
    group: "ADMINISTRATION",
    title: "Paramétrage",
    subtitle: "Configuration générale, commissions et intégrations",
    icon: Settings,
  },
};

const NOTIFICATIONS = [
  {
    id: 1,
    title: "Rappel de rapprochement",
    detail: "Relevés Orange Money / Moov Money du jour à confirmer (P05).",
    tone: "bg-amber-400",
    time: "il y a 25 min",
  },
  {
    id: 2,
    title: "2 remboursements en attente",
    detail: "RMB-030 et RMB-031 attendent une validation.",
    tone: "bg-purple-400",
    time: "il y a 2 h",
  },
  {
    id: 3,
    title: "Compagnie en attente",
    detail: "Sikasso Voyage attend une activation (A01).",
    tone: "bg-[#5ec81c]",
    time: "hier",
  },
];

interface TopbarProps {
  active: SectionId;
  onOpenMenu: () => void;
}

export function TbmTopbar({ active, onOpenMenu }: TopbarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const role: StaffRole = user?.role ?? "admin";
  const [currentTime, setCurrentTime] = useState({
    dateStr: "Mercredi 10 Juin 2025",
    timeStr: "16:24",
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      };
      const formatted = now.toLocaleDateString("fr-FR", options);
      const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime({
        dateStr: capitalized,
        timeStr: `${hours}:${minutes}`,
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const displayName = user?.name ?? "Daouda FOMBA";
  const initials =
    displayName
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "DF";

  const isDarkDashboard = active === "dashboard";
  const sectionMeta = active !== "dashboard" ? SECTION_HEADER_MAP[active] : null;
  const SectionIcon = sectionMeta?.icon;

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between px-4 transition-colors duration-200 sm:px-6",
        isDarkDashboard
          ? "border-b border-[#003B2D]/50 bg-[#001D18] text-white"
          : "border-b border-[var(--tbm-border)] bg-white/95 backdrop-blur-sm text-[var(--tbm-text)] shadow-xs"
      )}
    >
      {/* Salutation / Menu gauche / En-tête contextuel */}
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenMenu}
          aria-label="Ouvrir le menu"
          className={cn(
            "h-9 w-9 shrink-0 rounded-lg lg:hidden",
            isDarkDashboard
              ? "border-[#003B2D] bg-[#002a20] text-white hover:bg-[#003B2D]"
              : "border-[var(--tbm-border)] bg-white text-[var(--tbm-text)] hover:bg-[#F3F7F5]"
          )}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {isDarkDashboard && (
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#003B2D] text-[#9BE000]">
              <Sun className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold leading-tight text-white sm:text-base">
                Bonjour, {displayName}
              </h2>
              <p className="text-[11px] font-normal leading-tight text-[#718078]">
                {ROLE_LABEL[role] ?? "Administrateur TBM"}
              </p>
            </div>
          </div>
        )}

        {/* Refonte Header pour toutes les pages PILOTAGE & ADMINISTRATION */}
        {!isDarkDashboard && sectionMeta && SectionIcon && (
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            {/* Badge icône du module */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#003B2D] text-[#9BE000] shadow-xs">
              <SectionIcon className="h-4 w-4 stroke-[2.2]" />
            </div>

            {/* Titre, catégorie & sous-titre */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="inline-flex shrink-0 items-center rounded-md bg-[#003B2D]/8 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#003B2D]">
                  {sectionMeta.group}
                </span>
                <span className="hidden text-xs text-neutral-300 sm:inline">/</span>
                <h1 className="truncate text-sm font-bold text-[#001D18] sm:text-[15px]">
                  {sectionMeta.title}
                </h1>
                {sectionMeta.badge && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#9BE000] px-2 py-0.5 text-[11px] font-black text-[#001D18] shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#003B2D] animate-pulse" />
                    {sectionMeta.badge}
                  </span>
                )}
              </div>
              <p className="hidden truncate text-[11px] text-[var(--tbm-text-muted)] md:block max-w-[320px] lg:max-w-md">
                {sectionMeta.subtitle}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Éléments à droite */}
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
        {/* Date & Heure */}
        <div
          className={cn(
            "hidden items-center gap-2.5 rounded-xl border px-3.5 py-1.5 text-xs sm:flex shadow-xs",
            isDarkDashboard
              ? "border-[#003B2D] bg-[#002a20] text-[#d1ded6]"
              : "border-[var(--tbm-border)] bg-white text-[var(--tbm-text)]"
          )}
        >
          <Calendar
            className={cn(
              "h-4 w-4",
              isDarkDashboard ? "text-[#9BE000]" : "text-[#003B2D]"
            )}
          />
          <div className="text-left leading-tight">
            <span className="block font-medium">{currentTime.dateStr}</span>
            <span
              className={cn(
                "block text-[11px]",
                isDarkDashboard ? "text-[#718078]" : "text-[var(--tbm-text-muted)]"
              )}
            >
              {currentTime.timeStr}
            </span>
          </div>
        </div>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Notifications (${NOTIFICATIONS.length})`}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center transition-colors shadow-xs",
                isDarkDashboard
                  ? "rounded-xl border border-[#003B2D] bg-[#002a20] text-[#c2d3c9] hover:bg-[#003B2D] hover:text-white"
                  : "rounded-xl border border-[var(--tbm-border)] bg-white text-[var(--tbm-text)] hover:bg-[#F3F7F5]"
              )}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--tbm-danger)] px-1 text-[10px] font-black text-white shadow-sm">
                {NOTIFICATIONS.length}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 rounded-2xl border-[var(--tbm-border)] bg-white p-0 text-[var(--tbm-text)] shadow-2xl"
          >
            <div className="border-b border-[var(--tbm-border)] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--tbm-text)]">
                Notifications
              </p>
            </div>
            <ul className="max-h-72 divide-y divide-neutral-100 overflow-y-auto ff-scrollbar">
              {NOTIFICATIONS.map((n) => (
                <li
                  key={n.id}
                  className="flex gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
                >
                  <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", n.tone)} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--tbm-text)]">{n.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-[var(--tbm-text-muted)]">{n.detail}</p>
                    <p className="mt-1 text-[10px] text-[var(--tbm-text-muted)]">{n.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        {/* Profil utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Menu profil"
              className={cn(
                "flex items-center gap-2 transition-colors shadow-xs",
                isDarkDashboard
                  ? "rounded-xl border border-[#003B2D] bg-[#002a20] p-1 pr-2.5 hover:bg-[#003B2D]"
                  : "rounded-xl border border-[var(--tbm-border)] bg-white p-1 pr-2.5 hover:bg-[#F3F7F5]"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center text-[11px] font-bold rounded-lg bg-[#9BE000] text-[#001D18]"
                )}
              >
                {initials}
              </span>
              <span className="hidden xl:inline text-xs font-semibold text-[#001D18] max-w-[100px] truncate">
                {displayName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--tbm-text-muted)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-neutral-200 bg-white text-neutral-900">
            <DropdownMenuLabel>
              <p className="text-xs font-semibold text-neutral-900">{displayName}</p>
              <p className="truncate text-[11px] font-normal text-neutral-500">
                {user?.email ?? "admin@tbm.ml"}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="gap-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
