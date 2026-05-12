"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  Shield, Landmark, Building2, Wallet, Coins,
  Gem, Briefcase, FileText, Users, UsersRound, Home,
} from "lucide-react";

const modules = [
  { name: "Home", href: "/", icon: Home, color: "bg-slate-100 dark:bg-slate-800", iconColor: "text-slate-600 dark:text-slate-300" },
  { name: "Insurance", href: "/insurance", icon: Shield, color: "bg-blue-50 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400" },
  { name: "Banking", href: "/banking", icon: Landmark, color: "bg-emerald-50 dark:bg-emerald-900/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { name: "Assets", href: "/assets", icon: Building2, color: "bg-purple-50 dark:bg-purple-900/30", iconColor: "text-purple-600 dark:text-purple-400" },
  { name: "Liabilities", href: "/liabilities", icon: Wallet, color: "bg-red-50 dark:bg-red-900/30", iconColor: "text-red-600 dark:text-red-400" },
  { name: "Receivables", href: "/receivables", icon: Coins, color: "bg-amber-50 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400" },
  { name: "Belongings", href: "/belongings", icon: Gem, color: "bg-pink-50 dark:bg-pink-900/30", iconColor: "text-pink-600 dark:text-pink-400" },
  { name: "Holdings", href: "/holdings", icon: Briefcase, color: "bg-indigo-50 dark:bg-indigo-900/30", iconColor: "text-indigo-600 dark:text-indigo-400" },
  { name: "Documents", href: "/documents", icon: FileText, color: "bg-orange-50 dark:bg-orange-900/30", iconColor: "text-orange-600 dark:text-orange-400" },
  { name: "Family Hub", href: "/family", icon: UsersRound, color: "bg-teal-50 dark:bg-teal-900/30", iconColor: "text-teal-600 dark:text-teal-400" },
  { name: "Nominee", href: "/nominee", icon: Users, color: "bg-cyan-50 dark:bg-cyan-900/30", iconColor: "text-cyan-600 dark:text-cyan-400" },
];

export default function MorePage() {
  return (
    <DashboardShell title="All Modules" description="Access all features">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {modules.map((mod) => (
          <Link
            key={mod.name}
            href={mod.href}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-all duration-200 active:scale-95"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mod.color}`}>
              <mod.icon className={`h-6 w-6 ${mod.iconColor}`} />
            </div>
            <span className="text-xs font-medium text-center text-foreground leading-tight">{mod.name}</span>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
