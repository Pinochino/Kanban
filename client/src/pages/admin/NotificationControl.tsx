import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
import { IAdminCreateNotificationRequest, INotification } from "@/types/NotificationInterface";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetAllData } from "@/hooks/useGetAllData";
import { IUser } from "@/types/UserInterface";
import useDebounce from "@/hooks/useDebounce";

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

  const retry = useMutation({
    mutationFn: async (id: number) => {
      await handleApi({
        url: `${apiName.notifications.retry}/${id}`,
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notification-logs"] });
      toast.success("Đã gửi lại email thông báo.");
    },
    onError: () => {
      toast.error("Không thể gửi lại thông báo.");
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
      toast.success("Tạo notification thành công.");
      setIsCreateDialogOpen(false);
      setRecipientAccountId("");
      setTitle("");
      setMessage("");
      setScheduledAt("");
      setUseWeb(true);
      setUseEmail(false);
    },
    onError: () => {
      toast.error("Không thể tạo notification.");
    },
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "SENT": return <Badge variant="outline" className="text-[hsl(var(--success))] border-[hsl(var(--success))]">Đã gửi</Badge>;
      case "FAILED": return <Badge variant="destructive">Thất bại</Badge>;
      case "PENDING": return <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning))]">Đang chờ</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const channelBadge = (channel: string) => {
    if (channel === "WEB") {
      return <Badge variant="secondary">Web</Badge>;
    }

    if (channel === "EMAIL") {
      return <Badge variant="outline">Email</Badge>;
    }

    return <Badge variant="secondary">{channel}</Badge>;
  };

  const typeLabel = (type: string) => {
    if (type === "TASK_ASSIGNED") return "Giao task";
    if (type === "ADMIN_MESSAGE") return "Thông báo admin";
    if (type === "TASK_DUE") return "Đến hạn";
    if (type === "TASK_REMINDER") return "Nhắc hạn";
    return type;
  };

  const handleCreateNotification = () => {
    if (!recipientAccountId.trim()) {
      toast.error("Vui lòng chọn người nhận.");
      return;
    }

    if (!title.trim() || !message.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung thông báo.");
      return;
    }

    const channels = [
      ...(useWeb ? ["WEB" as const] : []),
      ...(useEmail ? ["EMAIL" as const] : []),
    ];

    if (channels.length === 0) {
      toast.error("Vui lòng chọn ít nhất một kênh gửi.");
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
        <h2 className="text-2xl font-bold">Quản lý thông báo</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo thông báo
          </Button>

          <div className="relative w-full min-w-[240px] md:w-[320px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10 pr-9"
              placeholder="Tìm theo tiêu đề, tên người nhận"
            />
            {isFetching ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Kênh" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kênh</SelectItem>
              <SelectItem value="WEB">Web</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="SENT">Đã gửi</SelectItem>
              <SelectItem value="FAILED">Thất bại</SelectItem>
              <SelectItem value="PENDING">Đang chờ</SelectItem>
            </SelectContent>
          </Select>
      </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người nhận</TableHead>
              <TableHead>Kênh</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Retry</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
            ) : isError ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-red-600">Không thể tải dữ liệu thông báo.</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
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
                <TableCell>{log.retryCount}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleString("vi-VN")}</TableCell>
                <TableCell className="text-right">
                  {log.channel === "EMAIL" && log.status !== "SENT" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => retry.mutate(log.id)}
                      title="Retry"
                      disabled={retry.isPending}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      </div>

      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Bảng này ghi lại lịch sử gửi notification khi admin giao task, thông báo thủ công từ admin, cùng các thông báo deadline/reminder cho staff.
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm shadow-sm">
        <span className="text-muted-foreground">
          Trang {(notificationPage?.page ?? page) + 1} - {logs.length} bản ghi trong trang này
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-[110px] bg-background/70" id="notification-rows-per-page">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {NOTIFICATION_PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem value={String(size)} key={size}>
                    {size}/trang
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="bg-background/70 hover:bg-accent/70" onClick={handleFirstPage} disabled={isFetching || page === 0}>
            First
          </Button>
          <Button variant="outline" size="sm" className="bg-background/70 hover:bg-accent/70" onClick={handlePreviousPage} disabled={isFetching || !canGoPrevious}>
            Prev
          </Button>
          <span className="min-w-16 text-center text-xs text-muted-foreground">Trang {(notificationPage?.page ?? page) + 1}</span>
          <Button
            variant="outline"
            size="sm"
            className="bg-background/70 hover:bg-accent/70"
            onClick={handleNextPage}
            disabled={isLoading || isFetching || !canGoNext}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Tạo thông báo cho nhân viên</DialogTitle>
            <DialogDescription>
              Chọn người nhận, kênh gửi và thời điểm gửi. Nếu không chọn thời gian thì hệ thống gửi ngay.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-account">Người nhận</Label>
              <select
                id="recipient-account"
                value={recipientAccountId}
                onChange={(event) => setRecipientAccountId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Chọn nhân viên</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-title">Tiêu đề</Label>
              <Input
                id="notification-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Cập nhật deadline sprint"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-message">Nội dung</Label>
              <Textarea
                id="notification-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Nhập nội dung gửi cho nhân viên"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-scheduled-at">Thời điểm gửi (tùy chọn)</Label>
              <Input
                id="notification-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Kênh gửi</Label>
              <div className="flex items-center gap-6 rounded-md border p-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <Checkbox checked={useWeb} onCheckedChange={(checked) => setUseWeb(Boolean(checked))} />
                  Web notification
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <Checkbox checked={useEmail} onCheckedChange={(checked) => setUseEmail(Boolean(checked))} />
                  Email
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateNotification} disabled={createNotification.isPending}>
              {createNotification.isPending ? "Đang tạo..." : "Tạo thông báo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
