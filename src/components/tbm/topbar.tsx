"use client";

import { Bell, ChevronRight, LogOut, Menu, RefreshCw } from "lucide-react";
import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { ROLE_LABEL, type StaffRole } from "@/components/tbm/data";
import { sectionLabel, type SectionId } from "@/components/tbm/sidebar";
import { cn } from "@/lib/utils";

const NOTIFICATIONS = [
  {
    id: 1,
    title: "Rappel de rapprochement",
    detail: "Relevés Orange Money / Moov Money du jour à confirmer (P05).",
    tone: "bg-amber-50 text-amber-600",
    time: "il y a 25 min",
  },
  {
    id: 2,
    title: "2 remboursements en attente",
    detail: "RMB-030 et RMB-031 attendent une justification.",
    tone: "bg-violet-100 text-violet-600",
    time: "il y a 2 h",
  },
  {
    id: 3,
    title: "Compagnie en attente",
    detail: "Sikasso Voyage attend une activation (A01).",
    tone: "bg-coral-50 text-coral-600",
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
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const role: StaffRole = user?.role ?? "admin";

  const handleRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      toast({ title: "Données actualisées", description: "Les indicateurs du back-office sont à jour (démo)." });
    }, 700);
  };

  const initials =
    (user?.name ?? "TB")
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "TB";

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-neutral-200/80 bg-white px-4 py-3 sm:px-6">
      {/* Menu mobile */}
      <Button
        variant="outline"
        size="icon"
        onClick={onOpenMenu}
        aria-label="Ouvrir le menu de navigation"
        className="h-9 w-9 shrink-0 rounded-lg lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Fil d’Ariane */}
      <nav
        aria-label="Fil d’Ariane"
        className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex"
      >
        <span className="text-neutral-400">Back-office</span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden="true" />
        <span
          className="truncate font-medium text-neutral-800"
          aria-current="page"
        >
          {sectionLabel(active)}
        </span>
      </nav>

      {/* Actions à droite */}
      <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          aria-label="Actualiser les données"
          className="h-9 w-9 rounded-lg border-neutral-200 bg-white text-neutral-500 shadow-none hover:border-neutral-300 hover:text-neutral-700"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={`Notifications (${NOTIFICATIONS.length})`}
              className="relative h-9 w-9 rounded-lg border-neutral-200 bg-white text-neutral-500 shadow-none hover:border-neutral-300 hover:text-neutral-700"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white">
                {NOTIFICATIONS.length}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 rounded-xl border-neutral-100 p-0">
            <p className="border-b border-neutral-100 px-4 py-3 text-[13px] font-semibold text-neutral-800">
              Notifications
            </p>
            <ul className="max-h-72 overflow-y-auto ff-scrollbar">
              {NOTIFICATIONS.map((n) => (
                <li
                  key={n.id}
                  className="flex gap-3 border-b border-neutral-50 px-4 py-3 last:border-0 hover:bg-neutral-50/70"
                >
                  <span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", n.tone)} />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-neutral-800">
                      {n.title}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-neutral-500">
                      {n.detail}
                    </span>
                    <span className="mt-1 block text-[11px] text-neutral-400">
                      {n.time}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Menu du compte"
              className="flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white py-1 pl-1 pr-2.5 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral-100 text-[11px] font-bold text-coral-600">
                {initials}
              </span>
              <span className="hidden min-w-0 text-left sm:block">
                <span className="block truncate text-[12.5px] font-semibold leading-tight text-neutral-800">
                  {user?.name ?? "Invité"}
                </span>
                <span className="block truncate text-[10.5px] leading-tight text-neutral-400">
                  {ROLE_LABEL[role]}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-xl border-neutral-100">
            <DropdownMenuLabel>
              <span className="block text-[13px] font-semibold text-neutral-800">
                {user?.name ?? "Invité"}
              </span>
              <span className="block truncate text-[11.5px] font-normal text-neutral-400">
                {user?.email ?? "—"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="gap-2 rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
