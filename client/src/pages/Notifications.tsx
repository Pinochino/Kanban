import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Inbox, MailOpen } from "lucide-react";
import { toast } from "sonner";

import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { useI18n } from "@/i18n/I18nProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { INotification } from "@/types/NotificationInterface";

const getNotificationTypeLabel = (type: string, t: (key: string) => string) => {
  switch (type) {
    case "TASK_ASSIGNED":
      return t("notification.taskAssigned");
    case "ADMIN_MESSAGE":
      return t("notification.adminMessage");
    case "TASK_DUE":
      return t("notification.taskDue");
    case "TASK_REMINDER":
      return t("notification.taskReminder");
    default:
      return type;
  }
};

const getChannelLabel = (channel: string, t: (key: string) => string) => {
  if (channel === "WEB") return t("notification.web");
  if (channel === "EMAIL") return t("notification.email");
  return channel;
};

const Notifications = () => {
  const { t } = useI18n();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ["my-notifications", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<INotification[]> => {
      const res = await handleApi({
        url: apiName.notifications.myList,
        method: "GET",
        params: {
          channel: "WEB",
          unreadOnly: false,
        },
      });

      const payload = res.data?.data;
      return Array.isArray(payload) ? (payload as INotification[]) : [];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await handleApi({
        url: `${apiName.notifications.markRead}/${notificationId}/read`,
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications", user?.id] });
      toast.success(t("notification.markReadSuccess"));
    },
    onError: () => {
      toast.error(t("notification.markReadFailed"));
    },
  });

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-xl">
        <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-sm text-slate-200">
              <Bell className="h-4 w-4" />
              {t("sidebar.notifications")}
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">{t("notification.title")}</h1>
            <p className="max-w-2xl text-sm text-slate-200">{t("notification.description")}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-200">{t("notification.total")}</p>
              <p className="text-2xl font-semibold">{notifications.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-200">{t("notification.unread")}</p>
              <p className="text-2xl font-semibold">{unreadCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            {t("notification.inbox")}
          </CardTitle>
          <CardDescription>{t("notification.inboxDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
              {t("notification.loading")}
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
              {t("notification.loadFailed")}
            </div>
          ) : notifications.length === 0 ? (
            <Empty
              icon={<MailOpen className="h-5 w-5" />}
              title={t("notification.emptyTitle")}
              description={t("notification.emptyDescription")}
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex flex-col gap-3 rounded-lg border p-4 transition md:flex-row md:items-start md:justify-between ${notification.isRead ? "bg-muted/20" : "bg-muted/40"}`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                        {getNotificationTypeLabel(notification.type, t)}
                      </span>
                      <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                        {getChannelLabel(notification.channel, t)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.deliveredAt || notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {!notification.isRead ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={markAsReadMutation.isPending}
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      className="gap-2"
                    >
                      <CheckCheck className="h-4 w-4" />
                      {t("notification.markRead")}
                    </Button>
                  ) : (
                    <div className="text-xs text-muted-foreground">{t("notification.read")}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;