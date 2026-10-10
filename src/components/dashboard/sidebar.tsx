"use client";

import { useState, type ComponentType } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronsUpDown,
  CircleUser,
  CreditCard,
  EllipsisVertical,
  FileText,
  Files,
  Home,
  LogOut,
  PanelRightClose,
  PanelRightOpen,
  PieChart,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo";

type IconType = ComponentType<{ className?: string }>;

interface NavEntry {
  label: string;
  icon: IconType;
  badge?: number;
}

const MAIN_MENU: NavEntry[] = [
  { label: "Dashboard", icon: Home },
  { label: "Financial Statement", icon: BarChart3, badge: 8 },
  { label: "Key Metrics", icon: PieChart },
  { label: "Tax & Compliance", icon: FileText, badge: 18 },
  { label: "Account Management", icon: Files, badge: 13 },
];

const FOOTER_MENU: NavEntry[] = [
  { label: "Security", icon: ShieldCheck },
  { label: "Setting", icon: Settings },
  { label: "Logout", icon: LogOut },
];

const ACCOUNT_SUBMENU: { label: string; icon: IconType }[] = [
  { label: "Profile", icon: User },
  { label: "Billing", icon: CreditCard },
  { label: "Notifications", icon: Bell },
];

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const labelMotion = {
  initial: { opacity: 0, x: -4 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -4 },
  transition: { duration: 0.15 },
};

interface NavButtonProps {
  entry: NavEntry;
  collapsed: boolean;
  active: boolean;
  onSelect: () => void;
}

function NavButton({ entry, collapsed, active, onSelect }: NavButtonProps) {
  const Icon = entry.icon;
  return (
    <motion.li variants={itemVariants}>
      <button
        type="button"
        onClick={onSelect}
        title={collapsed ? entry.label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-all duration-200",
          collapsed && "justify-center px-0",
          active
            ? "bg-coral-500 text-white shadow-md shadow-coral-500/30"
            : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        )}
      >
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0",
            !active && "transition-transform duration-200 group-hover:scale-110"
          )}
        />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span {...labelMotion} className="truncate">
              {entry.label}
            </motion.span>
          )}
        </AnimatePresence>
        {!collapsed && entry.badge != null && (
          <span
            className={cn(
              "ml-auto rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              active
                ? "bg-white/25 text-white"
                : "bg-neutral-100 text-neutral-400"
            )}
          >
            {entry.badge}
          </span>
        )}
        {collapsed && entry.badge != null && (
          <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-coral-400" />
        )}
      </button>
    </motion.li>
  );
}

interface SidebarContentProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SidebarContent({
  collapsed = false,
  onToggleCollapse,
}: SidebarContentProps) {
  const [active, setActive] = useState("Dashboard");
  const [accountOpen, setAccountOpen] = useState(false);
  const [activeSub, setActiveSub] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* ---- Brand ---- */}
      <div
        className={cn(
          "flex items-center justify-between px-4 pb-4 pt-5",
          collapsed && "px-2.5"
        )}
      >
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-9" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[19px] font-bold tracking-tight text-neutral-900"
              >
                FiscalFlow
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
        >
          {collapsed ? (
            <PanelRightOpen className="h-4 w-4" />
          ) : (
            <PanelRightClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* ---- Search ---- */}
      <div className={cn("px-4 pb-3", collapsed && "px-2.5")}>
        {collapsed ? (
          <button
            type="button"
            aria-label="Search"
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600"
          >
            <Search className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex h-9 items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3 transition-all focus-within:border-coral-300 focus-within:ring-4 focus-within:ring-coral-100/60">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              type="text"
              placeholder="Search"
              aria-label="Search"
              className="h-full w-full bg-transparent text-[13px] text-neutral-700 outline-none placeholder:text-neutral-400"
            />
            <kbd className="shrink-0 rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
              ⌘F
            </kbd>
          </div>
        )}
      </div>

      {/* ---- Navigation ---- */}
      <nav className="ff-scrollbar flex-1 overflow-y-auto px-3 pb-4">
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
              Menu
            </span>
          )}
          {!collapsed && (
            <button
              type="button"
              aria-label="Menu options"
              className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-500"
            >
              <EllipsisVertical className="h-4 w-4" />
            </button>
          )}
        </div>

        <motion.ul
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="space-y-1"
        >
          {MAIN_MENU.map((entry) => (
            <NavButton
              key={entry.label}
              entry={entry}
              collapsed={collapsed}
              active={active === entry.label}
              onSelect={() => setActive(entry.label)}
            />
          ))}
        </motion.ul>

        <div className="mx-2 my-3 h-px bg-neutral-100" />

        <motion.ul
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="space-y-1"
        >
          {/* Account — collapsible */}
          <motion.li variants={itemVariants}>
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              aria-expanded={accountOpen}
              title={collapsed ? "Account" : undefined}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-all duration-200",
                collapsed && "justify-center px-0",
                active === "Account"
                  ? "bg-coral-500 text-white shadow-md shadow-coral-500/30"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <CircleUser className="h-[18px] w-[18px] shrink-0" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span {...labelMotion} className="truncate">
                    Account
                  </motion.span>
                )}
              </AnimatePresence>
              {!collapsed && (
                <ChevronDown
                  className={cn(
                    "ml-auto h-4 w-4 text-neutral-300 transition-transform duration-300",
                    accountOpen && "rotate-180"
                  )}
                />
              )}
            </button>
          </motion.li>

          <AnimatePresence initial={false}>
            {accountOpen && !collapsed && (
              <motion.li
                key="account-submenu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <ul className="ml-4 mt-1 space-y-0.5 border-l border-neutral-100 pl-2.5">
                  {ACCOUNT_SUBMENU.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = activeSub === sub.label;
                    return (
                      <li key={sub.label}>
                        <button
                          type="button"
                          onClick={() => setActiveSub(sub.label)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12.5px] font-medium transition-colors",
                            subActive
                              ? "bg-coral-50 text-coral-600"
                              : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
                          )}
                        >
                          <SubIcon className="h-3.5 w-3.5" />
                          {sub.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.li>
            )}
          </AnimatePresence>

          <NavButton
            entry={{ label: "Member", icon: Users }}
            collapsed={collapsed}
            active={active === "Member"}
            onSelect={() => setActive("Member")}
          />
        </motion.ul>

        <div className="mx-2 my-3 h-px bg-neutral-100" />

        <motion.ul
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="space-y-1"
        >
          {FOOTER_MENU.map((entry) => (
            <NavButton
              key={entry.label}
              entry={entry}
              collapsed={collapsed}
              active={active === entry.label}
              onSelect={() => setActive(entry.label)}
            />
          ))}
        </motion.ul>
      </nav>

      {/* ---- User card ---- */}
      <div className={cn("border-t border-neutral-100 p-3", collapsed && "px-2.5")}>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border border-neutral-200/80 p-2 text-left transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50",
            collapsed && "justify-center border-transparent p-1.5 hover:bg-neutral-100"
          )}
        >
          <Image
            src="/avatar-jack.png"
            alt="Portrait of Jack Williams"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-neutral-200"
          />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-neutral-800">
                Jack Williams
              </span>
              <span className="block truncate text-[11.5px] text-neutral-400">
                jack.will@gmail.com
              </span>
            </span>
          )}
          {!collapsed && (
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-300" />
          )}
        </button>
      </div>
    </div>
  );
}
