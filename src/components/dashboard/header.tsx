"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Download,
  PanelsTopLeft,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", icon: PanelsTopLeft },
  { id: "order", label: "Order", icon: Sparkles },
  { id: "sales", label: "Sales", icon: TrendingUp },
];

const MONTHS = ["September", "October", "November", "December"];

export function DashboardHeader({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 800);
  };

  const handleDownload = () => {
    toast({
      title: "Export en cours",
      description:
        "Le rapport FiscalFlow d'octobre est en train d'être téléchargé.",
    });
  };

  return (
    <header
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5",
        className
      )}
    >
      {/* Breadcrumb (hidden on very small screens — mobile logo takes its place) */}
      <nav
        aria-label="Breadcrumb"
        className="hidden items-center gap-1.5 text-[13px] sm:flex"
      >
        <a
          href="#"
          className="text-neutral-400 transition-colors hover:text-neutral-600"
        >
          Spendly
        </a>
        <ChevronRight className="h-3.5 w-3.5 text-neutral-300" aria-hidden="true" />
        <span className="font-medium text-neutral-800" aria-current="page">
          Dashboard
        </span>
      </nav>

      {/* Tabs (own row on very small screens) */}
      <div
        className="-mb-1 flex w-full items-center gap-1.5 overflow-x-auto sm:order-none sm:mb-0 sm:w-auto"
        role="tablist"
        aria-label="Dashboard views"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "border border-neutral-200/80 bg-white text-neutral-900 shadow-sm"
                  : "border border-transparent text-neutral-500 hover:text-neutral-800"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-coral-500" : "text-neutral-400"
                )}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          aria-label="Refresh data"
          className="h-9 w-9 rounded-lg border-neutral-200 bg-white text-neutral-500 shadow-none hover:border-neutral-300 hover:text-neutral-700"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>

        <Select defaultValue="October">
          <SelectTrigger
            aria-label="Select month"
            className="h-9 w-[136px] rounded-lg border-neutral-200 bg-white pl-3 text-[13px] font-medium text-neutral-700 shadow-none hover:border-neutral-300"
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-neutral-400" />
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-neutral-100">
            {MONTHS.map((month) => (
              <SelectItem
                key={month}
                value={month}
                className="rounded-lg text-[13px]"
              >
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleDownload}
          className="h-9 gap-1.5 rounded-lg bg-coral-500 px-3.5 text-[13px] font-medium text-white shadow-md shadow-coral-500/30 transition-all hover:bg-coral-600 hover:shadow-lg hover:shadow-coral-500/40 active:scale-[0.98]"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>
    </header>
  );
}
