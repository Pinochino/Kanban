import { Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import RoutePageSkeleton from "@/components/common/RoutePageSkeleton";
import { useRouteTransitionLoading } from "@/hooks/useRouteTransitionLoading";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

type AdminLayoutProps = {
  children?: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const isTransitionLoading = useRouteTransitionLoading(1000);
  const { t } = useI18n();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-background via-background to-muted/20">
          <header className={cn(
            "sticky top-0 z-20 border-b border-border/70",
            "bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70",
          )}>
            <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-9 w-9 rounded-full border border-border/70 bg-card/80 shadow-sm transition-colors hover:bg-accent" />
                <div className="hidden sm:block">
                  <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    {t("layout.adminWorkspace")}
                  </p>
                  <h1 className="text-lg font-semibold text-foreground">{t("layout.dashboardOverview")}</h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <LanguageToggle />
                <ModeToggle />
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
            {isTransitionLoading ? <RoutePageSkeleton /> : children ?? <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
