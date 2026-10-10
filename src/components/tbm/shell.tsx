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
import { CitiesPage } from "@/components/tbm/pages/cities";
import { LinesPage } from "@/components/tbm/pages/lines";
import { UsersPage } from "@/components/tbm/pages/users";
import { AuditLogPage } from "@/components/tbm/pages/audit-log";
import { SettingsPage } from "@/components/tbm/pages/settings";
import { useAuthStore } from "@/lib/auth-store";

/**
 * Shell du back-office TBM — plein écran, sans arrière-plan :
 * sidebar épinglée à gauche, top-bar épinglée en haut, contenu scrollable.
 */
export function TbmShell() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "admin";
  const allowed = sectionsForRole(role);
  const [active, setActive] = useState<SectionId>(allowed[0]?.id ?? "dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const goTo = (id: SectionId) => {
    setActive(id);
    setMobileOpen(false);
  };

  const renderSection = () => {
    switch (active) {
      case "dashboard":
        return <DashboardPage />;
      case "companies":
        return <CompaniesPage />;
      case "transactions":
        return <TransactionsPage />;
      case "refunds":
        return <RefundsPage />;
      case "cities":
        return <CitiesPage />;
      case "lines":
        return <LinesPage />;
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
    <div className="flex h-dvh w-full overflow-hidden bg-white text-neutral-900 antialiased">
      {/* ---- Sidebar bureau : épinglée, pleine hauteur ---- */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 88 : 264 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="z-30 hidden h-full shrink-0 overflow-hidden border-r border-neutral-200/80 lg:block"
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          active={active}
          onSelect={goTo}
        />
      </motion.aside>

      {/* ---- Colonne principale ---- */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <TbmTopbar active={active} onOpenMenu={() => setMobileOpen(true)} />

        {/* Contenu scrollable : pleine largeur, fond blanc */}
        <main className="ff-scrollbar min-h-0 flex-1 overflow-y-auto">
          <h1 className="sr-only">TBM — Back-office, {active}</h1>
          <div className="px-4 pb-10 pt-5 sm:px-6 lg:px-8">{renderSection()}</div>
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
