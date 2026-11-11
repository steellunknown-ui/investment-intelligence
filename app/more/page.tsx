"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  LayoutDashboard,
  History,
  Shield,
  Landmark,
  Building2,
  Wallet,
  Coins,
  Gem,
  Briefcase,
  FileText,
  UsersRound,
  Users,
  Bot,
  Bell,
  Settings,
  Home,
  PieChart,
} from "lucide-react";

interface ModuleItem {
  name: string;
  href: string;
  icon: any;
  color: string;
  iconColor: string;
  badge?: string;
}

const allModules: ModuleItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-700 dark:text-slate-200",
  },
  {
    name: "Smart Passbook",
    href: "/passbook",
    icon: History,
    color: "bg-emerald-500/10 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-[#BBF078]",
    badge: "v5.0",
  },
  {
    name: "Banking",
    href: "/banking",
    icon: Landmark,
    color: "bg-emerald-50 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "Insurance",
    href: "/insurance",
    icon: Shield,
    color: "bg-blue-50 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    name: "Assets",
    href: "/assets",
    icon: Building2,
    color: "bg-purple-50 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    name: "Liabilities",
    href: "/liabilities",
    icon: Wallet,
    color: "bg-red-50 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
  },
  {
    name: "Receivables",
    href: "/receivables",
    icon: Coins,
    color: "bg-amber-50 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    name: "Belongings",
    href: "/belongings",
    icon: Gem,
    color: "bg-pink-50 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  {
    name: "Holdings",
    href: "/holdings",
    icon: Briefcase,
    color: "bg-indigo-50 dark:bg-indigo-900/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    name: "Documents",
    href: "/documents",
    icon: FileText,
    color: "bg-orange-50 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    name: "Family Hub",
    href: "/family",
    icon: UsersRound,
    color: "bg-teal-50 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    name: "Nominee",
    href: "/nominee",
    icon: Users,
    color: "bg-cyan-50 dark:bg-cyan-900/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    name: "AI Assistant",
    href: "/assistant",
    icon: Bot,
    color: "bg-lime-400/15 dark:bg-lime-950/40",
    iconColor: "text-lime-700 dark:text-[#BBF078]",
    badge: "Groq",
  },
  {
    name: "Activity & Alerts",
    href: "/activity",
    icon: Bell,
    color: "bg-sky-50 dark:bg-sky-900/30",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    color: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
  },
  {
    name: "Home",
    href: "/",
    icon: Home,
    color: "bg-neutral-100 dark:bg-neutral-800",
    iconColor: "text-neutral-600 dark:text-neutral-300",
  },
];

export default function MorePage() {
  return (
    <DashboardShell title="All Modules" description="Access every financial ledger and tool">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-6">
        {allModules.map((mod) => (
          <Link
            key={mod.name}
            href={mod.href}
            className="group relative flex flex-col items-center gap-2 p-3.5 sm:p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 active:scale-95"
          >
            {mod.badge && (
              <span className="absolute top-2 right-2 text-[9px] font-mono font-bold bg-primary/10 text-primary dark:text-[#BBF078] border border-primary/20 px-1.5 py-0.2 rounded-full">
                {mod.badge}
              </span>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mod.color} group-hover:scale-105 transition-transform`}>
              <mod.icon className={`h-6 w-6 ${mod.iconColor}`} />
            </div>
            <span className="text-xs font-semibold text-center text-foreground leading-tight line-clamp-1">
              {mod.name}
            </span>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
