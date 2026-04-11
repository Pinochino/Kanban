import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, RotateCcw } from "lucide-react";
import { handleApi } from "@/api/handleApi";
import { IRole, IUser } from "@/types/UserInterface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const getRoleLabel = (role: string) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "Admin";
    case "USER":
      return "Staff";
    default:
      return role;
  }
};

const getInitials = (name: string | null | undefined) => {
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

export default function SoftDeletedUsers() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["soft-deleted-users"],
    queryFn: async () => {
      const res = await handleApi({
        url: "/accounts/list?active=false&page=0&size=100&ascending=false&sort=id",
        method: "GET",
        withCredentials: true,
      });
      return res.data.data as IUser[];
    },
  });

  const restoreUser = useMutation({
    mutationFn: async (userId: string | number) => {
      const res = await handleApi({
        url: `/accounts/update-active/${userId}?active=true`,
        method: "PATCH",
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["soft-deleted-users"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userActiveNum"] });
      toast.success("Đã restore người dùng.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold md:text-3xl">Soft Deleted Users</h1>
            <p className="max-w-2xl text-sm text-slate-200">
              Danh sách tài khoản đã xóa mềm. Bạn có thể restore tài khoản bất kỳ về danh sách người dùng chính.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
              <Link to="/users">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Quay lại quản lý user
              </Link>
            </Button>
            <Badge variant="outline" className="border-slate-500 bg-slate-800/60 px-3 py-1 text-slate-100">
              {Array.isArray(users) ? users.length : 0} user
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kho lưu xóa mềm</CardTitle>
          <CardDescription>Nhấn restore để mở lại tài khoản và đưa về trang quản trị user.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Restore</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Đang tải danh sách user đã xóa mềm...
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(users) || users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Chưa có user nào trong kho xóa mềm.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <p className="font-medium">{user.username || "Chưa cập nhật tên"}</p>
                            <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {user.roles.map((r: IRole) => (
                            <Badge key={r.id} variant="secondary">
                              {getRoleLabel(r.name)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => restoreUser.mutate(user.id || "")}
                          disabled={restoreUser.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <RotateCcw className="mr-1 h-4 w-4" />
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["soft-deleted-users"] })}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Tải lại
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
