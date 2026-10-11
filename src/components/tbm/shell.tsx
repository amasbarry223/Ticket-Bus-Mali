"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  SidebarContent,
  sectionsForRole,
  type SectionId,
} from "@/components/tbm/sidebar";
import { TbmTopbar } from "@/components/tbm/topbar";
import { DashboardPage } from "@/components/tbm/pages/dashboard";
import { CompaniesPage } from "@/components/tbm/pages/companies";
import { TransactionsPage } from "@/components/tbm/pages/transactions";
import { RefundsPage } from "@/components/tbm/pages/refunds";
import { SettlementsPage } from "@/components/tbm/pages/settlements";
import { CitiesPage } from "@/components/tbm/pages/cities";
import { LinesPage } from "@/components/tbm/pages/lines";
import { ReservationsPage } from "@/components/tbm/pages/reservations";
import { UsersPage } from "@/components/tbm/pages/users";
import { AuditLogPage } from "@/components/tbm/pages/audit-log";
import { SettingsPage } from "@/components/tbm/pages/settings";
import { useAuthStore } from "@/lib/auth-store";
import {
  clearSecondaryParams,
  useParamState,
} from "@/lib/use-param-state";

/**
 * Shell du back-office TBM — plein écran, sans arrière-plan :
 * sidebar épinglée à gauche, top-bar épinglée en haut, contenu scrollable.
 * La page active est synchronisée avec le paramètre URL ?page= (deep-linking),
 * les onglets et sélections de chaque page avec ?tab= et ?sel=.
 */
export function TbmShell() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "admin";
  const allowed = sectionsForRole(role);
  const fallbackPage = allowed[0]?.id ?? "dashboard";
  const [pageParam, setPageParam] = useParamState("page", fallbackPage);
  const active: SectionId = allowed.some((s) => s.id === pageParam)
    ? (pageParam as SectionId)
    : fallbackPage;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const goTo = (id: SectionId) => {
    setPageParam(id);
    clearSecondaryParams(); // les tab/sel de la page précédente ne doivent pas fuiter
    setMobileOpen(false);
  };

  const renderSection = () => {
    switch (active) {
      case "dashboard":
        return <DashboardPage onNavigate={goTo} />;
      case "companies":
        return <CompaniesPage />;
      case "transactions":
        return <TransactionsPage />;
      case "refunds":
        return <RefundsPage />;
      case "settlements":
        return <SettlementsPage />;
      case "cities":
        return <CitiesPage />;
      case "lines":
        return <LinesPage />;
      case "reservations":
        return <ReservationsPage />;
      case "users":
        return <UsersPage />;
      case "audit":
        return <AuditLogPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="fixed inset-0 flex h-dvh w-full overflow-hidden bg-[var(--tbm-background)] text-[var(--tbm-text)] antialiased">
      {/* ---- Sidebar bureau : fixe / épinglée, pleine hauteur ---- */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="relative z-30 hidden h-full shrink-0 overflow-hidden border-r border-[#003B2D]/40 bg-[var(--tbm-dark)] lg:block"
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          active={active}
          onSelect={goTo}
        />
      </motion.aside>

      {/* ---- Colonne principale : Header fixe + Contenu scrollable ---- */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[var(--tbm-background)]">
        <TbmTopbar active={active} onOpenMenu={() => setMobileOpen(true)} />

        {/* Contenu scrollable exclusif : seul ce conteneur défile */}
        <main className="ff-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--tbm-background)]">
          <h1 className="sr-only">TBM — Back-office, {active}</h1>
          <div className="p-4 sm:p-5 lg:p-6">{renderSection()}</div>
        </main>
      </div>

      {/* ---- Sidebar mobile ---- */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[290px] border-r-0 p-0">
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigation principale du back-office TBM.
          </SheetDescription>
          <SidebarContent
            collapsed={false}
            onToggleCollapse={() => setMobileOpen(false)}
            active={active}
            onSelect={goTo}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
