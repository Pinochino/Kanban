import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
import { IAdminCreateNotificationRequest, INotification } from "@/types/NotificationInterface";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetAllData } from "@/hooks/useGetAllData";
import { IUser } from "@/types/UserInterface";
import useDebounce from "@/hooks/useDebounce";
import { useI18n } from "@/i18n/I18nProvider";

type NotificationPage = {
  items: INotification[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

const NOTIFICATION_PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const;

export default function NotificationControl() {
  const { t, language } = useI18n();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [recipientAccountId, setRecipientAccountId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [useWeb, setUseWeb] = useState(true);
  const [useEmail, setUseEmail] = useState(false);
  const queryClient = useQueryClient();
  const debouncedKeyword = useDebounce({ value: search, delay: 500 });
  const normalizedKeyword = String(debouncedKeyword ?? "").trim();

  const { data: usersData } = useGetAllData({ url: apiName.accounts.list });
  const users = Array.isArray(usersData) ? (usersData as IUser[]) : [];

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, statusFilter, channelFilter]);

  const { data: notificationPage, isLoading, isError, isFetching } = useQuery({
    queryKey: ["admin-notification-logs", statusFilter, channelFilter, debouncedKeyword, page, pageSize],
    queryFn: async (): Promise<NotificationPage> => {
      const res = await handleApi({
        url: apiName.notifications.adminList,
        method: "GET",
        params: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          channel: channelFilter !== "all" ? channelFilter : undefined,
          keyword: normalizedKeyword ? normalizedKeyword : undefined,
          page,
          size: pageSize,
        },
      });

      const data = res.data?.data;

      return {
        items: Array.isArray(data?.items) ? (data.items as INotification[]) : [],
        totalElements: Number(data?.totalElements ?? 0),
        totalPages: Number(data?.totalPages ?? 0),
        page: Number(data?.page ?? 0),
        size: Number(data?.size ?? pageSize),
        hasNext: Boolean(data?.hasNext ?? false),
        hasPrevious: Boolean(data?.hasPrevious ?? page > 0),
      };
    },
  });

  const logs = notificationPage?.items ?? [];
  const canGoPrevious = Boolean(notificationPage?.hasPrevious ?? page > 0);
  const canGoNext = Boolean(notificationPage?.hasNext ?? false);

  const handleFirstPage = () => {
    if (isFetching || page === 0) {
      return;
    }
    setPage(0);
  };

  const handlePreviousPage = () => {
    if (isFetching || !canGoPrevious) {
      return;
    }
    setPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    if (isLoading || isFetching || !canGoNext) {
      return;
    }
    setPage((prev) => prev + 1);
  };

  const deleteNotification = useMutation({
    mutationFn: async (id: number) => {
      await handleApi({
        url: `${apiName.notifications.adminDelete}/${id}`,
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notification-logs"] });
      toast.success(t("adminNotification.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("adminNotification.deleteFailed"));
    },
  });

  const createNotification = useMutation({
    mutationFn: async (payload: IAdminCreateNotificationRequest) => {
      await handleApi({
        url: apiName.notifications.adminCreate,
        method: "POST",
        data: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notification-logs"] });
      toast.success(t("adminNotification.createSuccess"));
      setIsCreateDialogOpen(false);
      setRecipientAccountId("");
      setTitle("");
      setMessage("");
      setScheduledAt("");
      setUseWeb(true);
      setUseEmail(false);
    },
    onError: () => {
      toast.error(t("adminNotification.createFailed"));
    },
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "SENT": return <Badge variant="outline" className="text-[hsl(var(--success))] border-[hsl(var(--success))]">{t("adminNotification.sent")}</Badge>;
      case "FAILED": return <Badge variant="destructive">{t("adminNotification.failed")}</Badge>;
      case "PENDING": return <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning))]">{t("adminNotification.pending")}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const channelBadge = (channel: string) => {
    if (channel === "WEB") {
      return <Badge variant="secondary">{t("adminNotification.web")}</Badge>;
    }

    if (channel === "EMAIL") {
      return <Badge variant="outline">{t("adminNotification.email")}</Badge>;
    }

    return <Badge variant="secondary">{channel}</Badge>;
  };

  const typeLabel = (type: string) => {
    if (type === "TASK_ASSIGNED") return t("adminNotification.taskAssigned");
    if (type === "ADMIN_MESSAGE") return t("adminNotification.adminMessage");
    if (type === "TASK_DUE") return t("adminNotification.taskDue");
    if (type === "TASK_REMINDER") return t("adminNotification.taskReminder");
    return type;
  };

  const handleCreateNotification = () => {
    if (!recipientAccountId.trim()) {
      toast.error(t("adminNotification.chooseRecipient"));
      return;
    }

    if (!title.trim() || !message.trim()) {
      toast.error(t("adminNotification.enterTitleMessage"));
      return;
    }

    const channels = [
      ...(useWeb ? ["WEB" as const] : []),
      ...(useEmail ? ["EMAIL" as const] : []),
    ];

    if (channels.length === 0) {
      toast.error(t("adminNotification.chooseChannel"));
      return;
    }

    createNotification.mutate({
      recipientAccountId: Number(recipientAccountId),
      title: title.trim(),
      message: message.trim(),
      channels,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold">{t("adminNotification.title")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("adminNotification.create")}
          </Button>

          <div className="relative w-full min-w-[240px] md:w-[320px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10 pr-9"
              placeholder={t("adminNotification.searchPlaceholder")}
            />
            {isFetching ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder={t("adminNotification.channel")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("adminNotification.allChannels")}</SelectItem>
              <SelectItem value="WEB">{t("adminNotification.web")}</SelectItem>
              <SelectItem value="EMAIL">{t("adminNotification.email")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder={t("adminNotification.status")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("adminNotification.allStatuses")}</SelectItem>
              <SelectItem value="SENT">{t("adminNotification.sent")}</SelectItem>
              <SelectItem value="FAILED">{t("adminNotification.failed")}</SelectItem>
              <SelectItem value="PENDING">{t("adminNotification.pending")}</SelectItem>
            </SelectContent>
          </Select>
      </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("adminNotification.recipient")}</TableHead>
              <TableHead>{t("adminNotification.channel")}</TableHead>
              <TableHead>{t("adminNotification.type")}</TableHead>
              <TableHead>{t("adminNotification.subject")}</TableHead>
              <TableHead>{t("adminNotification.status")}</TableHead>
              <TableHead>{t("adminNotification.date")}</TableHead>
              <TableHead className="text-right">{t("adminNotification.action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t("adminNotification.loading")}</TableCell></TableRow>
            ) : isError ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-red-600">{t("adminNotification.loadFailed")}</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t("adminNotification.noData")}</TableCell></TableRow>
            ) : logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{log.recipientName || "—"}</p>
                    <p className="text-xs text-muted-foreground">{log.recipientEmail || "—"}</p>
                  </div>
                </TableCell>
                <TableCell>{channelBadge(log.channel)}</TableCell>
                <TableCell><Badge variant="secondary">{typeLabel(log.type)}</Badge></TableCell>
                <TableCell className="max-w-[200px] truncate">{log.title}</TableCell>
                <TableCell>{statusBadge(log.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        title={t("adminNotification.delete")}
                        disabled={deleteNotification.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("adminNotification.deleteConfirm")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("adminNotification.deleteConfirmDescription").replace("{title}", String(log.title || log.id))}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("auth.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteNotification.mutate(log.id)}>
                          {t("adminNotification.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      </div>

      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          {t("adminNotification.historyNote")}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-muted-foreground">
          {t("auth.page")} {(notificationPage?.page ?? page) + 1} - {logs.length} {t("adminNotification.pageRecords")}
        </span>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-[104px] bg-background/70" id="notification-rows-per-page">
              <SelectValue placeholder={t("auth.pageSize")} />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {NOTIFICATION_PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem value={String(size)} key={size}>
                    {language === "vi" ? `${size}/trang` : `${size}/page`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="hidden h-8 bg-background/70 hover:bg-accent/70 sm:inline-flex" onClick={handleFirstPage} disabled={isFetching || page === 0}>
            {t("auth.first")}
          </Button>
          <Button variant="outline" size="sm" className="h-8 bg-background/70 hover:bg-accent/70" onClick={handlePreviousPage} disabled={isFetching || !canGoPrevious}>
            {t("auth.prev")}
          </Button>
          <span className="flex h-8 min-w-16 items-center justify-center rounded-md border border-border/70 bg-background/70 px-2 text-xs text-muted-foreground">{t("auth.page")} {(notificationPage?.page ?? page) + 1}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-background/70 hover:bg-accent/70"
            onClick={handleNextPage}
            disabled={isLoading || isFetching || !canGoNext}
          >
            {t("auth.next")}
          </Button>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("adminNotification.createForStaff")}</DialogTitle>
            <DialogDescription>{t("adminNotification.createDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-account">{t("adminNotification.recipient")}</Label>
              <select
                id="recipient-account"
                value={recipientAccountId}
                onChange={(event) => setRecipientAccountId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t("adminNotification.chooseStaff")}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-title">{t("adminNotification.subject")}</Label>
              <Input
                id="notification-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("adminNotification.titlePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-message">{t("adminNotification.message")}</Label>
              <Textarea
                id="notification-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t("adminNotification.messagePlaceholder")}
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-scheduled-at">{t("adminNotification.scheduledAt")}</Label>
              <Input
                id="notification-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("adminNotification.channelLabel")}</Label>
              <div className="flex items-center gap-6 rounded-md border p-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <Checkbox checked={useWeb} onCheckedChange={(checked) => setUseWeb(Boolean(checked))} />
                  {t("adminNotification.webNotification")}
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <Checkbox checked={useEmail} onCheckedChange={(checked) => setUseEmail(Boolean(checked))} />
                  {t("adminNotification.email")}
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t("auth.cancel")}
            </Button>
            <Button onClick={handleCreateNotification} disabled={createNotification.isPending}>
              {createNotification.isPending ? t("adminNotification.creating") : t("adminNotification.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
