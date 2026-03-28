import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export default function NotificationControl() {
  const [filter, setFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-notification-logs", filter],
    queryFn: async () => {
      let query = supabase.from("notification_logs").select("*, profiles!notification_logs_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(100);
      if (filter !== "all") query = query.eq("status", filter as "sent" | "failed" | "pending");
      const { data } = await query;
      return data || [];
    },
  });

  const retry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notification_logs").update({ status: "pending", retry_count: 0 }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-notification-logs"] }); toast.success("Đã retry!"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "sent": return <Badge variant="outline" className="text-[hsl(var(--success))] border-[hsl(var(--success))]">Đã gửi</Badge>;
      case "failed": return <Badge variant="destructive">Thất bại</Badge>;
      case "pending": return <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning))]">Đang chờ</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quản lý thông báo</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="sent">Đã gửi</SelectItem>
            <SelectItem value="failed">Thất bại</SelectItem>
            <SelectItem value="pending">Đang chờ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người nhận</TableHead>
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
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
            ) : (logs?.length ?? 0) === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : logs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{(log as any).profiles?.full_name || "—"}</TableCell>
                <TableCell><Badge variant="secondary">{log.type}</Badge></TableCell>
                <TableCell className="max-w-[200px] truncate">{log.title}</TableCell>
                <TableCell>{statusBadge(log.status)}</TableCell>
                <TableCell>{log.retry_count}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleDateString("vi-VN")}</TableCell>
                <TableCell className="text-right">
                  {log.status === "failed" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => retry.mutate(log.id)} title="Retry">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
