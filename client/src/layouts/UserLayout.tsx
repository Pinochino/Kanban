import { Outlet } from "react-router-dom";
import type { ReactNode } from "react";

import { ModeToggle } from "@/components/ui/mode-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/user/UserSidebar";

type UserLayoutProps = {
  children?: ReactNode;
};

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <UserSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-foreground">My Workspace</h1>
            <ModeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}