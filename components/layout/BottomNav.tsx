"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sparkles,
  Bell,
  Settings,
  Grid3X3,
} from "lucide-react";

const bottomNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI", href: "/assistant", icon: Sparkles },
  { name: "More", href: "/more", icon: Grid3X3 },
  { name: "Alerts", href: "/activity", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-slate-900 border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary dark:text-accent"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{item.name}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary dark:bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
