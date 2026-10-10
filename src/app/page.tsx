"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogoMark } from "@/components/dashboard/logo";
import { SidebarContent } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { FinancialBalance } from "@/components/dashboard/financial-balance";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { TaxLiabilities } from "@/components/dashboard/tax-liabilities";

/**
 * FiscalFlow — Full-screen dashboard shell.
 *
 * Layout (edge-to-edge, no page background):
 * ┌──────────┬────────────────────────────────┐
 * │          │  Top bar (pinned)              │
 * │ Sidebar  ├────────────────────────────────┤
 * │ (pinned) │  Scrollable content area       │
 * │          │                                │
 * └──────────┴────────────────────────────────┘
 */
export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-white text-neutral-900 antialiased">
      {/* ---- Desktop sidebar : pinned, full height ---- */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 88 : 264 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="z-30 hidden h-full shrink-0 overflow-hidden border-r border-neutral-200/80 lg:block"
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </motion.aside>

      {/* ---- Main column ---- */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* Top bar : pinned, always visible */}
        <div className="flex shrink-0 items-center gap-3 border-b border-neutral-200/80 bg-white px-4 py-3 sm:px-6">
          {/* Mobile-only controls */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="h-9 w-9 shrink-0 rounded-lg"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[286px] border-r-0 p-0">
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                <SidebarContent
                  collapsed={false}
                  onToggleCollapse={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <LogoMark className="h-8 w-8" />
          </div>

          <DashboardHeader className="min-w-0 flex-1" />
        </div>

        {/* Scrollable content : full width, pure white, no background */}
        <main className="ff-scrollbar min-h-0 flex-1 overflow-y-auto">
          <h1 className="sr-only">FiscalFlow — Dashboard</h1>
          <div className="px-4 pb-10 pt-5 sm:px-6 lg:px-8">
            <StatsCards />
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
              <CashFlowChart className="xl:col-span-8" />
              <FinancialBalance className="xl:col-span-4" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
              <RecentTransactions className="xl:col-span-5" />
              <TaxLiabilities className="xl:col-span-7" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
