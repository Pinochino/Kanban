import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4 justify-between">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
            <ModeToggle />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
