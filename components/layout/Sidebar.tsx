"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Bell,
  Settings,
  Shield,
  Landmark,
  Building2,
  Wallet,
  Coins,
  Gem,
  FileText,
  Sparkles,
  UsersRound
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";

// Navigation order:
// Dashboard, Insurance, Banking, Assets, Liabilities, Receivables, Belongings,
// Holdings, Documents, AI Assistant, Family Hub, Nominee, Activity & Alerts, Settings
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Insurance", href: "/insurance", icon: Shield },
  { name: "Banking", href: "/banking", icon: Landmark },
  { name: "Assets", href: "/assets", icon: Building2 },
  { name: "Liabilities", href: "/liabilities", icon: Wallet },
  { name: "Receivables", href: "/receivables", icon: Coins },
  { name: "Belongings", href: "/belongings", icon: Gem },
  { name: "Holdings", href: "/holdings", icon: Briefcase },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "AI Assistant", href: "/assistant", icon: Sparkles },
  { name: "Family Hub", href: "/family", icon: UsersRound },
  { name: "Nominee", href: "/nominee", icon: Users },
  { name: "Activity & Alerts", href: "/activity", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Navigation content - shared between desktop and mobile
function NavigationContent({ expanded, onClose }: { expanded?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-0.5", expanded ? "p-3" : "p-2")}>
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClose}
            className={cn(
              "relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
              expanded ? "px-3" : "px-0 justify-center",
              isActive
                ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent"
                : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {isActive && expanded && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
            )}
            <item.icon
              className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-primary dark:text-accent" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "transition-all duration-300 whitespace-nowrap",
                expanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
              )}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// Sidebar footer content with auth-aware portfolio status
function SidebarFooter({ collapsed }: { collapsed?: boolean }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsConnected(!!user);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const supabase = createSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsConnected(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (collapsed) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
      <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
        <p className="text-xs font-medium text-muted-foreground">
          Portfolio Status
        </p>
        <div className="mt-2 flex items-center gap-2">
          {isLoading ? (
            <>
              <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-pulse" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Checking...</span>
            </>
          ) : isConnected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-sm text-primary dark:text-accent font-medium">Connected</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Not connected</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Logo component
function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="icon-container bg-primary flex-shrink-0">
        <Shield className="h-4.5 w-4.5 text-white" />
      </div>
      <span
        className={cn(
          "font-semibold tracking-tight text-foreground transition-all duration-300 whitespace-nowrap",
          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
        )}
      >
        Investment Intelligence
      </span>
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Desktop Sidebar - Fixed with Hover Expand */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 hidden lg:block h-screen",
          "border-r border-border",
          "bg-white dark:bg-slate-900",
          "transition-all duration-300 ease-in-out",
          expanded ? "w-64 shadow-xl" : "w-[72px]"
        )}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-border transition-all duration-300",
          expanded ? "px-5" : "px-3 justify-center"
        )}>
          <Logo collapsed={!expanded} />
        </div>

        {/* Navigation */}
        <div className="relative h-[calc(100vh-4rem)] overflow-y-auto">
          <NavigationContent expanded={expanded} />

          {/* Footer */}
          <SidebarFooter collapsed={!expanded} />
        </div>
      </aside>

      {/* Mobile Sidebar - Sheet (Always Expanded) */}
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="left" className="w-64 p-0 dark:bg-slate-900 dark:border-slate-700">
          <SheetHeader className="h-16 flex-row items-center border-b border-border px-5">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <Logo collapsed={false} />
          </SheetHeader>

          {/* Navigation - Always expanded on mobile */}
          <div className="relative h-[calc(100vh-4rem)] overflow-y-auto">
            <NavigationContent expanded={true} onClose={onClose} />

            {/* Footer */}
            <SidebarFooter collapsed={false} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

