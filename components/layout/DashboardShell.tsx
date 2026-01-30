"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[72px]">
        <Header
          title={title}
          description={description}
          onMenuClick={() => setSidebarOpen(true)}
          action={action}
        />
        <main className="page-padding">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
