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

export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 antialiased">
      <div className="mx-auto flex w-full max-w-[1500px]">
        {/* Desktop sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 88 : 264 }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className="sticky top-0 z-30 hidden h-screen shrink-0 overflow-hidden lg:block"
        >
          <SidebarContent
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
          />
        </motion.aside>

        {/* Main column */}
        <div className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-neutral-200/70 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
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
            <span className="text-[17px] font-bold tracking-tight">
              FiscalFlow
            </span>
          </div>

          {/* Content */}
          <main className="mx-auto w-full max-w-[1320px] px-4 pb-10 pt-4 sm:px-6 lg:px-7 lg:pt-6">
            <DashboardHeader />
            <StatsCards className="mt-4" />
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
              <CashFlowChart className="xl:col-span-8" />
              <FinancialBalance className="xl:col-span-4" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
              <RecentTransactions className="xl:col-span-5" />
              <TaxLiabilities className="xl:col-span-7" />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
