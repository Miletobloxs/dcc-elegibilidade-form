"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

type AppShellProps = {
  role?: string;
  hasInvestorProfile?: boolean;
  displayName: string;
  initials: string;
  email: string;
  children: React.ReactNode;
};

export default function AppShell({ role, hasInvestorProfile, displayName, initials, email, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F4F6F8] overflow-hidden">
      {/* Overlay (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar role={role} hasInvestorProfile={hasInvestorProfile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0">
        <Header
          displayName={displayName}
          initials={initials}
          email={email}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
