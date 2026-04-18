import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, Ban, XCircle, CheckCircle } from "lucide-react";

export default function Moderation() {
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("*, profiles!reports_reporter_id_fkey(full_name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "resolved" | "dismissed" }) => {
      const { error } = await supabase.from("reports").update({ status, resolved_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-reports"] }); toast.success("Đã cập nhật!"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const hideComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comments").update({ is_hidden: true }).eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Đã ẩn bình luận!"),
    onError: (err: Error) => toast.error(err.message),
  });

  const banUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("profiles").update({ is_locked: true }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Đã khóa tài khoản!"),
    onError: (err: Error) => toast.error(err.message),
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="text-[hsl(var(--warning))] border-[hsl(var(--warning))]">Chờ xử lý</Badge>;
      case "resolved": return <Badge variant="outline" className="text-[hsl(var(--success))] border-[hsl(var(--success))]">Đã xử lý</Badge>;
      case "dismissed": return <Badge variant="secondary">Bỏ qua</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kiểm duyệt nội dung</h2>
        <Badge variant="outline">{reports?.filter((r) => r.status === "pending").length ?? 0} chờ xử lý</Badge>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người báo cáo</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
            ) : (reports?.length ?? 0) === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Không có báo cáo nào</TableCell></TableRow>
            ) : reports?.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{(report as any).profiles?.full_name || "—"}</TableCell>
                <TableCell><Badge variant="secondary">{report.target_type}</Badge></TableCell>
                <TableCell className="max-w-[200px] truncate">{report.reason}</TableCell>
                <TableCell>{statusBadge(report.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(report.created_at).toLocaleDateString("vi-VN")}</TableCell>
                <TableCell className="text-right">
                  {report.status === "pending" && (
                    <div className="flex items-center justify-end gap-1">
                      {report.target_type === "comment" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => hideComment.mutate(report.target_id)} title="Ẩn comment">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => banUser.mutate(report.reporter_id)} title="Ban user">
                        <Ban className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--success))]" onClick={() => updateReport.mutate({ id: report.id, status: "resolved" })} title="Đã xử lý">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateReport.mutate({ id: report.id, status: "dismissed" })} title="Bỏ qua">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
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
