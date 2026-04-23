import { Outlet } from "react-router-dom";
import type { ReactNode } from "react";

import { LanguageToggle } from "@/components/ui/language-toggle";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/user/UserSidebar";
import RoutePageSkeleton from "@/components/common/RoutePageSkeleton";
import { useRouteTransitionLoading } from "@/hooks/useRouteTransitionLoading";
import { useI18n } from "@/i18n/I18nProvider";

type UserLayoutProps = {
  children?: ReactNode;
};

export default function UserLayout({ children }: UserLayoutProps) {
  const isTransitionLoading = useRouteTransitionLoading(1000);
  const { t } = useI18n();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <div className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-background via-background to-muted/20">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
            <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-9 w-9 rounded-full border border-border/70 bg-card/80 shadow-sm transition-colors hover:bg-accent" />
                <div className="hidden sm:block">
                  <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    {t("layout.workspace")}
                  </p>
                  <h1 className="text-lg font-semibold text-foreground">{t("layout.myWorkspace")}</h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 shadow-sm sm:flex">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-500/40 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("sidebar.personalWorkspace")}
                  </span>
                </div>
                <LanguageToggle />
                <ModeToggle />
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
            {isTransitionLoading ? <RoutePageSkeleton compact /> : children ?? <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}