"use client";

import { useAuthStore } from "@/store/authStore";
import { NavRail } from "@/components/dashboard/NavRail";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeNavItem?: "messages" | "search" | "settings";
}

export function DashboardLayout({ children, activeNavItem = "settings" }: DashboardLayoutProps) {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen overflow-hidden font-[family-name:var(--font-body)]">
      <NavRail
        userFirstName={user?.firstName ?? ""}
        userLastName={user?.lastName ?? ""}
        activeItem={activeNavItem}
      />
      <main className="flex-1 h-screen overflow-y-auto bg-[#EAF6F1]">
        {children}
      </main>
    </div>
  );
}
