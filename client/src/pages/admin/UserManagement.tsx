import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Lock, Unlock, Trash2, ShieldCheck } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("*");

      return (profiles || []).map((p) => ({
        ...p,
        roles: (roles || []).filter((r) => r.user_id === p.user_id).map((r) => r.role),
      }));
    },
  });

  const toggleLock = useMutation({
    mutationFn: async ({ userId, lock }: { userId: string; lock: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_locked: lock }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Cập nhật thành công!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Delete profile (cascade will handle related data)
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Đã xóa người dùng!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // Delete existing roles then insert new one
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Đã cập nhật vai trò!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = users?.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.user_id.includes(search)
  ) ?? [];

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "member": return "secondary";
      case "guest": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quản lý người dùng</h2>
        <Badge variant="outline">{filtered.length} users</Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm theo tên hoặc ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.roles.map((r) => (
                        <Badge key={r} variant={roleBadgeVariant(r) as "default" | "secondary" | "outline"}>{r}</Badge>
                      ))}
                      <Select onValueChange={(val) => changeRole.mutate({ userId: user.user_id, newRole: val as AppRole })}>
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue placeholder="Đổi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="guest">Guest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.is_locked ? (
                      <Badge variant="destructive">Đã khóa</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[hsl(var(--success))] border-[hsl(var(--success))]">Hoạt động</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(user.created_at).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleLock.mutate({ userId: user.user_id, lock: !user.is_locked })}
                        title={user.is_locked ? "Mở khóa" : "Khóa"}
                      >
                        {user.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa người dùng <strong>{user.full_name}</strong>? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteUser.mutate(user.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
