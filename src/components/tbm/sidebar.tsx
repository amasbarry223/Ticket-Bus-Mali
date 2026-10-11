"use client";

import { type ComponentType } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowLeftRight,
  Building2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MapPin,
  PanelRightClose,
  PanelRightOpen,
  Percent,
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

export type SectionId =
  | "dashboard"
  | "companies"
  | "transactions"
  | "refunds"
  | "settlements"
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
  hasChevron?: boolean;
}

interface SectionGroup {
  label: string;
  sections: Section[];
}

export const SECTION_GROUPS: SectionGroup[] = [
  {
    label: "PILOTAGE",
    sections: [
      {
        id: "companies",
        label: "Compagnies",
        icon: Building2,
        roles: ["admin"],
        hasChevron: true,
      },
      {
        id: "transactions",
        label: "Transactions",
        icon: ArrowLeftRight,
        roles: ["admin", "support"],
        badge: "2",
      },
      {
        id: "refunds",
        label: "Remboursements",
        icon: Undo2,
        roles: ["admin", "support"],
        badge: "4",
      },
      {
        id: "settlements",
        label: "Reversements",
        icon: Percent,
        roles: ["admin", "support"],
        badge: "5",
      },
      {
        id: "cities",
        label: "Villes & Gares",
        icon: MapPin,
        roles: ["admin"],
      },
      {
        id: "lines",
        label: "Lignes & Départs",
        icon: Route,
        roles: ["admin", "support"],
      },
      {
        id: "reservations",
        label: "Réservations",
        icon: Ticket,
        roles: ["admin", "support"],
        badge: "2",
      },
    ],
  },
  {
    label: "ADMINISTRATION",
    sections: [
      {
        id: "users",
        label: "Utilisateurs",
        icon: Users,
        roles: ["admin"],
        badge: "2",
      },
      {
        id: "audit",
        label: "Journal d’audit",
        icon: ScrollText,
        roles: ["admin", "support"],
      },
      {
        id: "settings",
        label: "Paramétrage",
        icon: Settings,
        roles: ["admin"],
      },
    ],
  },
];

export function sectionsForRole(role: StaffRole): Section[] {
  const list = SECTION_GROUPS.flatMap((g) => g.sections).filter((s) =>
    s.roles.includes(role)
  );
  // Toujours inclure dashboard
  return [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      roles: ["admin", "support"],
    },
    ...list,
  ];
}


const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
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

  const displayName = user?.name ?? "Daouda FOMBA";
  const initials =
    displayName
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "DF";

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#001D18] text-[#d6e3dc]">
      {/* Motifs géométriques subtils en bas à gauche */}
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 opacity-20"
        style={{
          backgroundImage: `radial-gradient(#9BE000 1px, transparent 1px), radial-gradient(#9BE000 1px, #001D18 1px)`,
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 8px 8px",
        }}
      />

      {/* ---- Logo officiel PNG transparent ---- */}
      <div
        className={cn(
          "flex items-center justify-between px-4 pb-3 pt-4",
          collapsed && "flex-col gap-2 px-2"
        )}
      >
        <div className="flex w-full items-center justify-center">
          {collapsed ? (
            <img
              src="/tbm-logo-clean.png"
              alt="TBM"
              className="h-10 w-auto object-contain"
            />
          ) : (
            <div className="flex w-full items-center justify-center py-1">
              <img
                src="/tbm-logo-clean.png"
                alt="Ticket Bus Mali"
                className="h-auto w-[180px] object-contain drop-shadow-sm"
              />
            </div>
          )}
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
            className={cn(
              "hidden h-7 w-7 items-center justify-center rounded-lg text-[#718078] transition-colors hover:bg-[#003B2D] hover:text-white lg:flex",
              collapsed && "mt-1"
            )}
          >
            {collapsed ? (
              <PanelRightOpen className="h-4 w-4" />
            ) : (
              <PanelRightClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* ---- Bouton Tableau de bord (Pilule vert primaire au sommet) ---- */}
      <div className="px-3 pt-1 pb-2">
        <button
          type="button"
          onClick={() => onSelect("dashboard")}
          title={collapsed ? "Tableau de bord" : undefined}
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all duration-150",
            collapsed && "justify-center px-0",
            active === "dashboard"
              ? "bg-[#9BE000] text-[#001D18] shadow-md shadow-[#9BE000]/25"
              : "bg-[#9BE000]/90 text-[#001D18] hover:bg-[#9BE000]"
          )}
        >
          <LayoutDashboard className="h-[18px] w-[18px] shrink-0 text-[#001D18]" />
          {!collapsed && <span>Tableau de bord</span>}
        </button>
      </div>

      {/* ---- Navigation Groupée ---- */}
      <nav className="ff-scrollbar relative z-10 flex-1 overflow-y-auto px-3 py-1 space-y-3">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            {/* Header du groupe */}
            <div
              className={cn(
                "px-2.5 pb-1 pt-1.5",
                collapsed && "text-center px-0"
              )}
            >
              {collapsed ? (
                <span className="mx-auto block h-px w-6 bg-[#123827]" />
              ) : (
                <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6b8b7b]">
                  {group.label}
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
                        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150",
                        collapsed && "justify-center px-0",
                        isActive
                          ? "bg-[#003B2D] text-white font-semibold border border-[#00513e] shadow-xs"
                          : "text-[#c2d3c9] hover:bg-[#002f24] hover:text-white"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          isActive ? "text-white" : "text-[#9cb5a8] group-hover:text-white"
                        )}
                      />
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span {...labelMotion} className="truncate">
                            {section.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Chevrons optionnels (ex: Compagnies) */}
                      {!collapsed && section.hasChevron && (
                        <ChevronRight
                          className={cn(
                            "ml-auto h-4 w-4",
                            isActive ? "text-white" : "text-[#718078] group-hover:text-white"
                          )}
                        />
                      )}

                      {/* Badges verts circulaires */}
                      {!collapsed && section.badge != null && (
                        <span
                          className={cn(
                            "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums bg-[#9BE000] text-[#001D18]"
                          )}
                        >
                          {section.badge}
                        </span>
                      )}

                      {collapsed && section.badge != null && (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#9BE000]" />
                      )}
                    </button>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>
        ))}
      </nav>

      {/* ---- Utilisateur en bas ---- */}
      <div className="relative z-10 border-t border-[#003B2D]/50 p-3 space-y-2">
        <div
          className={cn(
            "flex w-full items-center gap-3 rounded-xl bg-[#002a20] border border-[#003B2D] p-2",
            collapsed && "justify-center p-1.5"
          )}
        >
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-[#9BE000] text-[12px] font-black text-[#001D18] shadow-sm",
              "h-8 w-8"
            )}
          >
            {initials}
          </span>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold text-white">
                  {displayName}
                </span>
                <span className="block truncate text-[11px] font-normal text-[#718078]">
                  {ROLE_LABEL[role] ?? "Administrateur TBM"}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                aria-label="Se déconnecter"
                title="Se déconnecter"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#718078] transition-colors hover:bg-rose-500/20 hover:text-rose-400"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Footer info avec puce verte */}
        {!collapsed && (
          <div className="flex items-center gap-2 px-1 pt-1 text-[10.5px] text-[#718078]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#9BE000] animate-pulse" />
            <span className="truncate">TBM — Transport plus proche de vous</span>
          </div>
        )}
      </div>
    </div>
  );
}
