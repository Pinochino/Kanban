import { Bell, LogOut, LayoutList, MessagesSquare, UserRound } from "lucide-react";
import { useLocation } from "react-router-dom";

import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import authService from "@/services/AuthService";
import { useAppDispatch } from "@/store/hooks";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";

export function UserSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useCurrentUser();
  const { t } = useI18n();

  const menuItems = [
    { title: t("sidebar.myTasks"), url: "/my-tasks", icon: LayoutList },
    { title: t("sidebar.notifications"), url: "/notifications", icon: Bell },
    { title: t("sidebar.chat"), url: "/chat", icon: MessagesSquare },
    { title: t("sidebar.profile"), url: "/profile", icon: UserRound },
  ];

  const signOut = async () => {
    try {
      await dispatch(authService.logout());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.logoutFailed"));
    }
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border pb-4">
        <div className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8 shrink-0 rounded-lg">
            <AvatarImage src="/Logo/logo.png" alt="TaskFlow" className="object-cover" />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
              TF
            </AvatarFallback>
          </Avatar>
          {!collapsed && <span className="text-lg font-bold">TaskFlow</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
          <NavLink
            to="/profile"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-sidebar-accent/50"
            activeClassName="bg-sidebar-accent"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user?.avatarUrl || ""} alt={user?.username || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.username || "User"}</p>
                <p className="text-xs text-muted-foreground">{t("sidebar.personalWorkspace")}</p>
              </div>
            )}
          </NavLink>
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