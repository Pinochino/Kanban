import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Trash2, ShieldCheck, Users, UserCheck, UserX, ShieldAlert, Pencil, CircleArrowOutUpRight, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";
import { handleApi } from "@/api/handleApi";
import { IRole, IUser } from "@/types/UserInterface";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type RoleFilter = "all" | "SUPER_ADMIN" | "USER";

type UserFormState = {
  id: string;
  username: string;
  email: string;
  active: boolean;
  role: "SUPER_ADMIN" | "USER";
};

export default function UserManagement() {

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserFormState | null>(null);
  const queryClient = useQueryClient();


  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await handleApi({ url: "/accounts/list", method: "GET", withCredentials: true });
      console.log('User data: ', res.data.data)
      return res.data.data;
    },
  });

  const { data: detailUser, isLoading: detailLoading } = useQuery({
    queryKey: ["user-detail", detailUserId],
    queryFn: async () => {
      if (!detailUserId) {
        return null;
      }
      const res = await handleApi({ url: `/accounts/detail/${detailUserId}`, method: "GET", withCredentials: true });
      return res.data.data as IUser;
    },
    enabled: Boolean(detailUserId),
  });

  const { data: userActiveNum } = useQuery({
    queryKey: ["userActiveNum"],
    queryFn: async () => {
      const res = await handleApi({ url: "/accounts/count-active?active=false", method: "GET", withCredentials: true });
      return res.data.data;
    },
  });

  const { data: userLoginNum } = useQuery({
    queryKey: ["userLoginNum"],
    queryFn: async () => {
      const res = await handleApi({ url: "/accounts/count-login?login=true", method: "GET", withCredentials: true });
      return res.data.data;
    },
  });

  const { data: userAdminNum } = useQuery({
    queryKey: ["userAdminNum"],
    queryFn: async () => {
      const res = await handleApi({ url: "/accounts/count-by-role?name=SUPER_ADMIN", method: "GET", withCredentials: true });
      return res.data.data;
    },
  });


  const toggleLock = useMutation({
    mutationFn: async ({ userId, lock }: { userId: number | string; lock: boolean }) => {
      const res = await handleApi({ url: `/accounts/update-active/${userId}?active=${lock}`, method: "PATCH", data: lock, withCredentials: true })
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userActiveNum"] });
      toast.success("Cập nhật thành công!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const softDeleteUser = useMutation({
    mutationFn: async (userId: string | number) => {
      const res = await handleApi({
        url: `/accounts/update-active/${userId}?active=false`,
        method: "PATCH",
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userActiveNum"] });
      toast.success("Đã chuyển user sang trạng thái xóa mềm.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateUser = useMutation({
    mutationFn: async (payload: UserFormState) => {
      const existing = Array.isArray(users) ? users.find((u: IUser) => String(u.id) === payload.id) : null;

      if (existing && existing.active !== payload.active) {
        await handleApi({
          url: `/accounts/update-active/${payload.id}?active=${payload.active}`,
          method: "PATCH",
          withCredentials: true,
        });
      }

      return payload;
    },
    onSuccess: (payload) => {
      queryClient.setQueryData(["users"], (oldData: IUser[] | undefined) => {
        if (!Array.isArray(oldData)) {
          return oldData;
        }

        return oldData.map((item) => {
          if (String(item.id) !== payload.id) {
            return item;
          }

          return {
            ...item,
            username: payload.username,
            email: payload.email,
            active: payload.active,
            roles: item.roles.map((role, index) => {
              if (index !== 0) {
                return role;
              }
              return {
                ...role,
                name: payload.role,
              };
            }),
          };
        });
      });

      queryClient.invalidateQueries({ queryKey: ["userActiveNum"] });
      setEditingUser(null);
      toast.success("Đã cập nhật user trên giao diện.");
      toast.info("API cập nhật username/email chưa có trên backend, hiện chỉ lưu tạm ở client.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // const changeRole = useMutation({
  //   mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
  //     // Delete existing roles then insert new one
  //     await supabase.from("user_roles").delete().eq("user_id", userId);
  //     const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
  //     if (error) throw error;
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  //     toast.success("Đã cập nhật vai trò!");
  //   },
  //   onError: (err: Error) => toast.error(err.message),
  // });

  // const filtered = users?.filter((u) => {
  //   const q = search.trim().toLowerCase();
  //   const name = (u.full_name || "").toLowerCase();
  //   const id = u.user_id.toLowerCase();

  //   const matchesSearch = !q || name.includes(q) || id.includes(q);
  //   const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter);
  //   const matchesStatus =
  //     statusFilter === "all" ||
  //     (statusFilter === "active" && !u.is_locked) ||
  //     (statusFilter === "locked" && u.is_locked);

  //   return matchesSearch && matchesRole && matchesStatus;
  // }) ?? [];

  // const totalUsers = users?.length ?? 0;
  // const lockedUsers = users?.filter((u) => u.is_locked).length ?? 0;
  // const activeUsers = totalUsers - lockedUsers;
  // const adminUsers = users?.filter((u) => u.roles.includes("SUPER_ADMIN")).length ?? 0;

  const handleLockUser = async (userId: number | string, lock: boolean) => {
    await toggleLock.mutateAsync({ userId, lock });
  };

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) {
      return [];
    }

    const q = search.trim().toLowerCase();

    return users.filter((u: IUser) => {
      const roleNames = (u.roles || []).map((r) => r.name);
      const matchesSearch = !q || (u.username || "").toLowerCase().includes(q) || String(u.id).includes(q);
      const matchesRole = roleFilter === "all" || roleNames.includes(roleFilter);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "online" && Boolean(u.login)) ||
        (statusFilter === "offline" && !u.login);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const openUpdateDialog = (user: IUser) => {
    setEditingUser({
      id: String(user.id),
      username: user.username || "",
      email: user.email || "",
      active: Boolean(user.active),
      role: user.roles.some((role) => role.name === "SUPER_ADMIN") ? "SUPER_ADMIN" : "USER",
    });
  };

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "member": return "secondary";
      case "guest": return "outline";
      default: return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Admin";
      case "USER":
        return "Staff";
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
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
              <Link to="/users/deleted">
                <ArchiveRestore className="mr-1 h-4 w-4" />
                User đã xóa mềm
              </Link>
            </Button>
            <Badge variant="outline" className="w-fit border-slate-500 bg-slate-800/60 px-3 py-1 text-slate-100">
              {filteredUsers.length} kết quả hiển thị
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng người dùng</CardDescription>
            <CardTitle className="text-2xl"> {Array.isArray(users) && Array.from(users).length}</CardTitle>
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
            <CardTitle className="text-2xl"> {userLoginNum}</CardTitle>
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
            <CardTitle className="text-2xl"> {userActiveNum}</CardTitle>
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
            <CardTitle className="text-2xl"> {userAdminNum}</CardTitle>
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

            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="SUPER_ADMIN">Admin</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | "online" | "offline")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="online">Đang hoạt động</SelectItem>
                <SelectItem value="offline">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Đang tải dữ liệu người dùng...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Không có người dùng phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: IUser) => {

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage
                                // src={user?.avatar_url || undefined} 

                                alt={user.username || "User"} />
                              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                              <p className="font-medium">{user.username || "Chưa cập nhật tên"}</p>
                              <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {user.roles.map((r: IRole) => (
                                <Badge key={r.id} variant={roleBadgeVariant(r.name) as "default" | "secondary" | "outline"}>
                                  {getRoleLabel(r.name as string)}
                                </Badge>
                              ))}
                            </div>

                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={!user.login ? "destructive" : "outline"}
                            className={cn(user.login && "border-emerald-200 bg-emerald-50 text-emerald-700")}
                          >
                            {!user.login ? "Không hoạt động" : "Hoạt động"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </TableCell>

                        <TableCell>
                          <Switch defaultChecked={user.active} onCheckedChange={(checked) => handleLockUser(user.id, checked)} />
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">

                            <Button
                              variant="default"
                              className="bg-blue-500 hover:bg-blue-600"
                              size="sm"
                              onClick={() => setDetailUserId(String(user.id))}
                            >
                              <CircleArrowOutUpRight size={12} />
                            </Button>

                            <Button
                              variant="default"
                              className="bg-orange-500 hover:bg-orange-600"
                              size="sm"
                              onClick={() => openUpdateDialog(user)}
                            >
                              <Pencil size={12} />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="default"
                                  size="icon"
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa mềm người dùng?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tài khoản <strong>{user.username || user.id}</strong> sẽ bị ẩn khỏi danh sách chính
                                    và có thể khôi phục ở trang user đã xóa mềm.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => softDeleteUser.mutate(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Xóa mềm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>


                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(detailUserId)} onOpenChange={(open) => !open && setDetailUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>Thông tin tài khoản và trạng thái hiện tại.</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải chi tiết...</p>
          ) : detailUser ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">ID</span>
                <span className="font-medium">{detailUser.id}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Username</span>
                <span className="font-medium">{detailUser.username || "Chưa cập nhật"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{detailUser.email || "Chưa cập nhật"}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Vai trò</span>
                <div className="flex flex-wrap gap-1.5">
                  {detailUser.roles?.map((role) => (
                    <Badge key={role.id}>{getRoleLabel(role.name)}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Trạng thái</span>
                <Badge variant={detailUser.login ? "outline" : "destructive"}>
                  {detailUser.login ? "Đang hoạt động" : "Không hoạt động"}
                </Badge>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Xóa mềm</span>
                <Badge variant={detailUser.active ? "outline" : "secondary"}>
                  {detailUser.active ? "Không" : "Đã xóa mềm"}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không lấy được dữ liệu chi tiết.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật người dùng</DialogTitle>
            <DialogDescription>Chỉnh sửa nhanh thông tin tài khoản trong trang quản trị.</DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser((prev) => prev ? { ...prev, username: e.target.value } : prev)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser((prev) => prev ? { ...prev, email: e.target.value } : prev)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Vai trò</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser((prev) => prev ? { ...prev, role: value as "SUPER_ADMIN" | "USER" } : prev)}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Admin</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Trạng thái tài khoản</p>
                  <p className="text-xs text-muted-foreground">Tắt để chuyển về trạng thái xóa mềm</p>
                </div>
                <Switch
                  checked={editingUser.active}
                  onCheckedChange={(checked) => setEditingUser((prev) => prev ? { ...prev, active: checked } : prev)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Hủy
            </Button>
            <Button onClick={() => editingUser && updateUser.mutate(editingUser)} disabled={updateUser.isPending}>
              {updateUser.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
