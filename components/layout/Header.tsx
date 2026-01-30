"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Search, User, Menu, LogOut, Home, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";

interface HeaderProps {
  title: string;
  description?: string;
  onMenuClick: () => void;
  action?: React.ReactNode;
}

export function Header({ title, description, onMenuClick, action }: HeaderProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/alerts");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Fetch alerts error:", err);
      }
    };
    fetchUnreadCount();

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          const profile = data.profile;

          // Priority: Google OAuth avatar > uploaded avatar > initials
          const supabase = createSupabaseBrowserClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (user?.user_metadata?.picture) {
            setAvatarUrl(user.user_metadata.picture);
          } else if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }

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
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {description && (
            <p className="text-[13px] text-slate-600 dark:text-slate-400 hidden sm:block">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Custom Action */}
        {action && <div className="mr-2">{action}</div>}

        {/* Home Button */}
        <Link href="/">
          <Button variant="ghost" size="icon" className="hidden sm:flex h-9 w-9 dark:text-slate-300 dark:hover:bg-slate-800" title="Go to Homepage">
            <Home className="h-5 w-5" />
          </Button>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Search */}
        <Button variant="ghost" size="icon" className="hidden sm:flex h-9 w-9 dark:text-slate-300 dark:hover:bg-slate-800">
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Link href="/activity">
          <Button variant="ghost" size="icon" className="relative h-9 w-9 dark:text-slate-300 dark:hover:bg-slate-800">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-medium text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-2 h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 dark:text-slate-300 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="font-medium text-sm">{initials || <User className="h-5 w-5" />}</span>
              )}
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
