"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Search, User, Menu, LogOut, Home, Settings, Info, Shield, Clock, AlertTriangle, CheckCircle, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";
import { toast } from "sonner";

interface HeaderProps {
  title: string;
  description?: string;
  onMenuClick: () => void;
  action?: React.ReactNode;
}

export function Header({ title, description, onMenuClick, action }: HeaderProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/alerts");
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts?.slice(0, 5) || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Fetch alerts error:", err);
      }
    };
    fetchAlerts();

    const fetchProfile = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          const profile = data.profile;

          // Priority: Google OAuth avatar > uploaded avatar > initials
          let finalAvatarUrl = null;
          
          // First try Google OAuth picture
          if (user?.user_metadata?.picture) {
            finalAvatarUrl = user.user_metadata.picture;
          }
          // Then try profile avatar_url (uploaded or stored)
          else if (profile.avatar_url) {
            finalAvatarUrl = profile.avatar_url;
          }
          
          setAvatarUrl(finalAvatarUrl);

          // Generate initials from full_name or email
          if (profile.full_name) {
            const parts = profile.full_name.split(' ').filter(Boolean);
            if (parts.length >= 2) {
              setInitials(`${parts[0][0]}${parts[1][0]}`.toUpperCase());
            } else if (parts.length === 1) {
              setInitials(parts[0][0].toUpperCase());
            }
          } else if (user?.email) {
            setInitials(user.email[0].toUpperCase());
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchProfile();

    // Supabase Realtime Subscription for Alerts
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        (payload: any) => {
          setAlerts((prev) => [payload.new, ...prev].slice(0, 5));
          setUnreadCount((prev) => prev + 1);
          toast.info("New Notification", {
            description: payload.new.title,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    // Note: onboarding_done is intentionally NOT cleared.
    // Onboarding is a first-install experience only.
    // After logout, users go straight to /login (not onboarding).
    router.push("/login");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.toLowerCase().trim();
    if (["insurance", "policy", "lic", "health", "life"].some(k => q.includes(k))) router.push("/insurance");
    else if (["bank", "account", "savings", "sbi", "hdfc", "icici"].some(k => q.includes(k))) router.push("/banking");
    else if (["asset", "property", "house", "car", "gold", "bike"].some(k => q.includes(k))) router.push("/assets");
    else if (["liability", "loan", "emi", "credit", "debt"].some(k => q.includes(k))) router.push("/liabilities");
    else if (["receivable", "lent", "friend"].some(k => q.includes(k))) router.push("/receivables");
    else if (["belonging", "item", "laptop", "phone", "jewelry"].some(k => q.includes(k))) router.push("/belongings");
    else if (["holding", "stock", "mutual", "fund", "equity", "mf"].some(k => q.includes(k))) router.push("/holdings");
    else {
      toast.error("No module match found", {
        description: "Try searching with keywords like 'bank', 'loan', 'insurance', 'property'"
      });
      return;
    }
    setSearchQuery("");
  };
  
  const handleMarkAsRead = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/read`, { method: "PATCH" });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'security': return <Shield className="h-4 w-4 text-red-500" />;
      case 'inactivity': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-primary" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 sm:px-6 lg:px-8 w-full">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden h-8 w-8 flex-shrink-0"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-tight text-foreground truncate">{title}</h1>
          {description && (
            <p className="text-[11px] text-muted-foreground hidden sm:block truncate">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Custom Action - desktop only */}
        {action && <div className="hidden sm:block mr-1">{action}</div>}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Global Smart Search - desktop only */}
        <form onSubmit={handleSearch} className="hidden lg:flex relative items-center ml-2 mr-2 group">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-48 lg:w-64 rounded-full border border-border bg-background pr-4 pl-9 text-sm outline-none transition-all placeholder:text-slate-400 focus:w-64 lg:focus:w-80 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </form>

        {/* Mobile 3-dot menu */}
        {(action) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {action && (
                <div className="px-2 py-1.5">{action}</div>
              )}
              <DropdownMenuSeparator />
              <form onSubmit={handleSearch} className="px-2 py-1.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-full rounded-lg border border-border bg-background pr-3 pl-8 text-xs outline-none focus:border-primary"
                  />
                </div>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 dark:text-slate-300 dark:hover:bg-slate-800">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-3">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              <Link href="/activity" className="text-xs text-primary hover:text-primary font-medium">
                View All
              </Link>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[400px] overflow-y-auto">
              {alerts.length > 0 ? (
                <div className="flex flex-col">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-border last:border-0 ${!alert.is_read ? 'bg-primary/10/30 dark:bg-primary/5' : ''}`}
                      onClick={() => !alert.is_read && handleMarkAsRead(alert.id)}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm font-medium truncate ${!alert.is_read ? 'text-foreground' : 'text-slate-500'}`}>
                            {alert.title}
                          </p>
                          {!alert.is_read && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {alert.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">
                  <Bell className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p>No new notifications</p>
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-2 h-9 w-9 rounded-full p-0">
              <Avatar 
                src={avatarUrl} 
                fallback={initials || undefined}
                alt="Profile"
                size="md"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
