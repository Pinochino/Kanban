import { LayoutDashboard, Users, Bell, LogOut, MessagesSquare, Kanban } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppDispatch } from "@/store/hooks";
import authService from "@/services/AuthService";
import { toast } from "../ui/sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUnreadIndicators } from "@/hooks/useUnreadIndicators";
import { useI18n } from "@/i18n/I18nProvider";

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useCurrentUser();
  const { t } = useI18n();
  const { unreadMessages } = useUnreadIndicators();

  const menuItems = [
    { title: t("sidebar.dashboard"), url: "/", icon: LayoutDashboard },
    { title: t("sidebar.accounts"), url: "/users", icon: Users },
    { title: t("sidebar.projects"), url: "/projects", icon: Kanban },
    { title: t("sidebar.notifications"), url: "/admin/notifications", icon: Bell },
    { title: t("sidebar.chat"), url: "/chat", icon: MessagesSquare, badgeCount: unreadMessages },
  ];

  const dispatch = useAppDispatch();

  const signOut = async () => {
    try {

      await dispatch(authService.logout());

    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.logoutFailed");
      toast.error(message)
    }
  }

  const displayName = user?.username?.trim() || t("common.admin");
  const displayAvatar = user?.avatarUrl || "";

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);

    if (parts.length === 0) {
      return "AD";
    }

    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border pb-4">
        <div className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8 shrink-0 rounded-lg">
            <AvatarImage src="/Logo/logo.png" alt={t("sidebar.adminTitle")} className="object-cover" />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
              KF
            </AvatarFallback>
          </Avatar>
          {!collapsed && <span className="font-bold text-lg">{t("sidebar.adminTitle")}</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("common.admin")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === "/admin"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <div className="relative">
                        <item.icon className="h-4 w-4" />
                        {collapsed && Number(item.badgeCount ?? 0) > 0 ? (
                          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                        ) : null}
                      </div>
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                      {!collapsed && Number(item.badgeCount ?? 0) > 0 ? (
                        <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white animate-pulse">
                          {Number(item.badgeCount) > 99 ? "99+" : Number(item.badgeCount)}
                        </span>
                      ) : null}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={displayAvatar} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || t("common.admin")}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
