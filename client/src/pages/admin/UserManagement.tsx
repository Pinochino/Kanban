import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Lock, Unlock, Trash2, ShieldCheck, Users, UserCheck, UserX, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "locked">("all");
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

  const filtered = users?.filter((u) => {
    const q = search.trim().toLowerCase();
    const name = (u.full_name || "").toLowerCase();
    const id = u.user_id.toLowerCase();

    const matchesSearch = !q || name.includes(q) || id.includes(q);
    const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !u.is_locked) ||
      (statusFilter === "locked" && u.is_locked);

    return matchesSearch && matchesRole && matchesStatus;
  }) ?? [];

  const totalUsers = users?.length ?? 0;
  const lockedUsers = users?.filter((u) => u.is_locked).length ?? 0;
  const activeUsers = totalUsers - lockedUsers;
  const adminUsers = users?.filter((u) => u.roles.includes("admin")).length ?? 0;

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "member": return "secondary";
      case "guest": return "outline";
      default: return "secondary";
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "member":
        return "Member";
      case "guest":
        return "Guest";
      default:
        return role;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) {
      return "NA";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s.charAt(0).toUpperCase())
      .join("");
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-sm text-slate-200">
              <ShieldCheck className="h-4 w-4" />
              Admin control panel
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">User Management</h1>
            <p className="max-w-2xl text-sm text-slate-200">
              Quản trị tài khoản, phân quyền, trạng thái khóa/mở khóa và theo dõi truy cập trên toàn hệ thống.
            </p>
          </div>
          <Badge variant="outline" className="w-fit border-slate-500 bg-slate-800/60 px-3 py-1 text-slate-100">
            {filtered.length} kết quả hiển thị
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng người dùng</CardDescription>
            <CardTitle className="text-2xl">{totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              All accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đang hoạt động</CardDescription>
            <CardTitle className="text-2xl">{activeUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <UserCheck className="h-4 w-4" />
              Active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tài khoản bị khóa</CardDescription>
            <CardTitle className="text-2xl">{lockedUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <UserX className="h-4 w-4" />
              Locked accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Quyền admin</CardDescription>
            <CardTitle className="text-2xl">{adminUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldAlert className="h-4 w-4" />
              Elevated roles
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>
            Tìm kiếm theo tên/ID, lọc theo vai trò và trạng thái để thao tác quản trị nhanh hơn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc user ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "all" | AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | "active" | "locked")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="locked">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Vai trò hiện tại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Đang tải dữ liệu người dùng...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Không có người dùng phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "User"} />
                            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <p className="font-medium">{user.full_name || "Chưa cập nhật tên"}</p>
                            <p className="text-xs text-muted-foreground">ID: {user.user_id}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {user.roles.map((r) => (
                              <Badge key={r} variant={roleBadgeVariant(r) as "default" | "secondary" | "outline"}>
                                {getRoleLabel(r as AppRole)}
                              </Badge>
                            ))}
                          </div>
                          <Select
                            onValueChange={(val) => changeRole.mutate({ userId: user.user_id, newRole: val as AppRole })}
                          >
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                              <SelectValue placeholder="Đổi vai trò" />
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
                        <Badge
                          variant={user.is_locked ? "destructive" : "outline"}
                          className={cn(!user.is_locked && "border-emerald-200 bg-emerald-50 text-emerald-700")}
                        >
                          {user.is_locked ? "Đã khóa" : "Hoạt động"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("vi-VN")}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleLock.mutate({ userId: user.user_id, lock: !user.is_locked })}
                            title={user.is_locked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                          >
                            {user.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xác nhận xóa người dùng?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn sắp xóa tài khoản <strong>{user.full_name || user.user_id}</strong>. Hành động này
                                  không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUser.mutate(user.user_id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Xóa người dùng
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
        </CardContent>
      </Card>
    </div>
  );
}
