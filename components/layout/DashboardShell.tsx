"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface DashboardShellProps {
  children: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function DashboardShell({
  children,
  title,
  description,
  action,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[72px] min-w-0 max-w-full overflow-x-hidden">
        <Header
          title={title}
          description={description}
          onMenuClick={() => setSidebarOpen(true)}
          action={action}
        />
        <main className="page-padding pb-20 lg:pb-6 min-w-0 max-w-full overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl min-w-0">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
