"use client";

import { type ComponentType } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowLeftRight,
  Building2,
  ChevronsUpDown,
  EllipsisVertical,
  LayoutDashboard,
  LogOut,
  MapPin,
  PanelRightClose,
  PanelRightOpen,
  Route,
  ScrollText,
  Settings,
  Ticket,
  Undo2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { ROLE_LABEL, type StaffRole } from "@/components/tbm/data";
import { LogoTbm } from "@/components/tbm/logo";

export type SectionId =
  | "dashboard"
  | "companies"
  | "transactions"
  | "refunds"
  | "cities"
  | "lines"
  | "reservations"
  | "users"
  | "audit"
  | "settings";

interface Section {
  id: SectionId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles: StaffRole[];
  badge?: string;
}

interface SectionGroup {
  label: string;
  sections: Section[];
}

/**
 * Sections du back-office (cahier des charges §3.4, A01 → A08),
 * filtrées par rôle : RBAC côté interface.
 */
export const SECTION_GROUPS: SectionGroup[] = [
  {
    label: "Pilotage",
    sections: [
      {
        id: "dashboard",
        label: "Tableau de bord",
        icon: LayoutDashboard,
        roles: ["admin", "support"], // A08
      },
    ],
  },
  {
    label: "Opérations",
    sections: [
      {
        id: "companies",
        label: "Compagnies",
        icon: Building2,
        roles: ["admin"], // A01
      },
      {
        id: "transactions",
        label: "Transactions",
        icon: ArrowLeftRight,
        roles: ["admin", "support"], // A02
        badge: "2",
      },
      {
        id: "refunds",
        label: "Remboursements",
        icon: Undo2,
        roles: ["admin", "support"], // A03
        badge: "4",
      },
      {
        id: "cities",
        label: "Villes & Gares",
        icon: MapPin,
        roles: ["admin"], // A07
      },
      {
        id: "lines",
        label: "Lignes & Départs",
        icon: Route,
        roles: ["admin", "support"], // A09 — supervision inter-compagnies
      },
      {
        id: "reservations",
        label: "Réservations",
        icon: Ticket,
        roles: ["admin", "support"], // A10 — réservations & billets (support)
        badge: "2",
      },
    ],
  },
  {
    label: "Administration",
    sections: [
      {
        id: "users",
        label: "Utilisateurs",
        icon: Users,
        roles: ["admin"], // A05
      },
      {
        id: "audit",
        label: "Journal d’audit",
        icon: ScrollText,
        roles: ["admin", "support"], // A06
      },
      {
        id: "settings",
        label: "Paramétrage",
        icon: Settings,
        roles: ["admin"], // A04
      },
    ],
  },
];

export function sectionsForRole(role: StaffRole): Section[] {
  return SECTION_GROUPS.flatMap((g) => g.sections).filter((s) =>
    s.roles.includes(role)
  );
}

export function sectionLabel(id: SectionId): string {
  return (
    SECTION_GROUPS.flatMap((g) => g.sections).find((s) => s.id === id)?.label ??
    id
  );
}

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

const labelMotion = {
  initial: { opacity: 0, x: -4 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -4 },
  transition: { duration: 0.15 },
};

interface SidebarContentProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  active: SectionId;
  onSelect: (id: SectionId) => void;
}

export function SidebarContent({
  collapsed = false,
  onToggleCollapse,
  active,
  onSelect,
}: SidebarContentProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const role: StaffRole = user?.role ?? "admin";

  const groups = SECTION_GROUPS.map((g) => ({
    ...g,
    sections: g.sections.filter((s) => s.roles.includes(role)),
  })).filter((g) => g.sections.length > 0);

  const initials =
    (user?.name ?? "TB")
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "TB";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* ---- Marque ---- */}
      <div
        className={cn(
          "flex items-center justify-between px-4 pb-4 pt-5",
          collapsed && "flex-col gap-2 px-2.5"
        )}
      >
        <div className="flex items-center gap-2.5">
          <LogoTbm className="h-9 w-9" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div {...labelMotion} className="min-w-0">
                <p className="truncate text-[16px] font-bold leading-tight tracking-tight text-neutral-900">
                  TBM <span className="text-coral-500">·</span> Back-office
                </p>
                <p className="truncate text-[10.5px] font-medium text-neutral-400">
                  Ticket Bus Mali — Bamako
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600",
            collapsed && "mt-1"
          )}
        >
          {collapsed ? (
            <PanelRightOpen className="h-4 w-4" />
          ) : (
            <PanelRightClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="ff-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <div className="mx-2 my-3 h-px bg-neutral-100" />}
            <div
              className={cn(
                "flex items-center justify-between px-2.5 pb-2 pt-1",
                collapsed && "justify-center px-0"
              )}
            >
              {collapsed ? (
                <span className="h-px w-7 bg-neutral-200" />
              ) : (
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                  {group.label}
                </span>
              )}
              {!collapsed && gi === 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-300">
                  <EllipsisVertical className="h-4 w-4" />
                </span>
              )}
            </div>

            <motion.ul
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="space-y-1"
            >
              {group.sections.map((section) => {
                const Icon = section.icon;
                const isActive = active === section.id;
                return (
                  <motion.li key={section.id} variants={itemVariants}>
                    <button
                      type="button"
                      onClick={() => onSelect(section.id)}
                      title={collapsed ? section.label : undefined}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-all duration-200",
                        collapsed && "justify-center px-0",
                        isActive
                          ? "bg-coral-500 text-white shadow-md shadow-coral-500/30"
                          : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          !isActive &&
                            "transition-transform duration-200 group-hover:scale-110"
                        )}
                      />
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span {...labelMotion} className="truncate">
                            {section.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && section.badge != null && (
                        <span
                          className={cn(
                            "ml-auto rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                            isActive
                              ? "bg-white/25 text-white"
                              : "bg-coral-50 text-coral-500"
                          )}
                        >
                          {section.badge}
                        </span>
                      )}
                      {collapsed && section.badge != null && (
                        <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-coral-400" />
                      )}
                    </button>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>
        ))}
      </nav>

      {/* ---- Carte utilisateur + déconnexion ---- */}
      <div
        className={cn(
          "border-t border-neutral-100 p-3",
          collapsed && "px-2.5"
        )}
      >
        <div
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border border-neutral-200/80 p-2",
            collapsed && "justify-center border-transparent p-1.5"
          )}
        >
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-coral-100 text-[12px] font-bold text-coral-600 ring-1 ring-coral-200",
              collapsed ? "h-9 w-9" : "h-9 w-9"
            )}
          >
            {initials}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-neutral-800">
                  {user?.name ?? "Invité"}
                </span>
                <span className="block truncate text-[11.5px] text-neutral-400">
                  {ROLE_LABEL[role]}
                </span>
              </span>
              <button
                type="button"
                onClick={logout}
                aria-label="Se déconnecter"
                title="Se déconnecter"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={logout}
            aria-label="Se déconnecter"
            title="Se déconnecter"
            className="mx-auto mt-2 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
        {!collapsed && (
          <p className="mt-2 flex items-center justify-center gap-1 text-[10.5px] text-neutral-300">
            <ChevronsUpDown className="h-3 w-3" />
            RBAC — accès limité à votre rôle
          </p>
        )}
      </div>
    </div>
  );
}
