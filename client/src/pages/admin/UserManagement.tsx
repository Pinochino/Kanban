import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { Search, Trash2, Pencil, CircleArrowOutUpRight, Loader2, ImageUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { handleApi } from "@/api/handleApi";
import { IRole, IUpdateUser, IUser } from "@/types/UserInterface";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useGetAllData } from "@/hooks/useGetAllData";
import { apiName } from "@/api/apiName";
import UserStatistics from "@/domains/users/UserStatistics";
import useDebounce from "@/hooks/useDebounce";
import { useEnterSkeletonLoading, useMinVisibleLoading } from "@/hooks/useMinimumLoading";
import { buildQuery } from "@/utils/QueryUtils";

const USER_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export default function UserManagement() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<IUpdateUser | null>(null);
  const debouncedQuery = useDebounce({ value: search, delay: 500 });
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterLogin, setFilterLogin] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(0);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isAvatarDragOver, setIsAvatarDragOver] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const getLoginLabel = (login: string) => {
    if (login === "true") {
      return true;
    } else {
      return false;
    }
  };

  const { data: roleList } = useGetAllData({ url: apiName.roles.list });

  const buildListUrl = (targetPage: number, targetSize: number = pageSize) => {
    const params = {
      username: debouncedQuery ? debouncedQuery : undefined,
      page: targetPage,
      size: targetSize ? Number(targetSize) : undefined,
      ...(filterLogin !== "all" && { login: getLoginLabel(filterLogin) }),
      ...(filterRole !== "all" && { roleId: Number(filterRole) }),
    };

    return `${apiName.accounts.list}?${buildQuery(params)}`;
  };

  const { data: userList, isLoading, isFetching } = useQuery({
    queryKey: [
      `${apiName.accounts.list}`,
      debouncedQuery,
      filterRole,
      filterLogin,
      page,
      pageSize,
    ],
    queryFn: async () => {
      const url = buildListUrl(page);

      const res = await handleApi({ url, method: "GET", withCredentials: true });
      return res.data.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const users = Array.isArray(userList)
    ? Array.from(userList).filter((user: IUser) => user.deleted === false)
    : [];
  const { data: hasNextPage = false, isFetching: isCheckingNextPage } = useQuery({
    queryKey: [
      `${apiName.accounts.list}`,
      "has-next-page",
      debouncedQuery,
      filterRole,
      filterLogin,
      page,
      pageSize,
    ],
    queryFn: async () => {
      const url = buildListUrl(page + 1, pageSize);
      const res = await handleApi({ url, method: "GET", withCredentials: true });
      const nextPageItems = res.data.data;
      return Array.isArray(nextPageItems) && nextPageItems.length > 0;
    },
    enabled: users.length > 0,
    placeholderData: (previousData) => previousData ?? false,
  });

  const { data: detailUser, isLoading: detailLoading } = useQuery({
    queryKey: [`${apiName.accounts.detail}/${detailUserId}`, detailUserId],
    queryFn: async () => {
      if (!detailUserId) {
        return null;
      }
      const res = await handleApi({
        url: `${apiName.accounts.detail}/${detailUserId}`,
        method: "GET",
        withCredentials: true,
      });
      return res.data.data as IUser;
    },
    enabled: Boolean(detailUserId),
  });

  const toggleLock = useMutation({
    mutationFn: async ({
      userId,
      lock,
    }: {
      userId: number | string;
      lock: boolean;
    }) => {
      const res = await handleApi({
        url: `/accounts/update-active/${userId}?active=${lock}`,
        method: "PATCH",
        data: lock,
        withCredentials: true,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${apiName.accounts.list}`] });
      queryClient.invalidateQueries({
        queryKey: [`${apiName.accounts.activeNums}?active=false`],
      });
      toast.success("Cập nhật thành công!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const softDeleteUser = useMutation({
    mutationFn: async (userId: string | number) => {
      const res = await handleApi({
        url: `/accounts/soft-delete/${userId}`,
        method: "PATCH",
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${apiName.accounts.list}`] });
      queryClient.invalidateQueries({
        queryKey: [`${apiName.accounts.activeNums}`],
      });
      toast.success("Đã chuyển user sang trạng thái xóa mềm.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateUser = useMutation({
    mutationFn: async ({ payload, avatarFile }: { payload: IUpdateUser; avatarFile?: File | null }) => {
      const updateRes = await handleApi({
        url: `${apiName.accounts.update}/${payload.userId}`,
        method: "PUT",
        data: payload,
        withCredentials: true,
      });

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const profileRes = await handleApi({
          url: `${apiName.accounts.updateProfile}/${payload.userId}`,
          method: "PATCH",
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        });

        return profileRes.data.data;
      }

      return updateRes.data.data;
    },
    onSuccess: (_updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: [`${apiName.accounts.list}`] });
      queryClient.invalidateQueries({ queryKey: [`${apiName.accounts.detail}/${variables.payload.userId}`] });
      setEditingUser(null);
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Cập nhật thông tin người dùng thành công.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleLockUser = async (userId: number | string, lock: boolean) => {
    await toggleLock.mutateAsync({ userId, lock });
  };

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, filterRole, filterLogin, pageSize]);

  useEffect(() => {
    if (!isLoading && !isFetching && page > 0 && users.length === 0) {
      setPage((prev) => Math.max(prev - 1, 0));
    }
  }, [isLoading, isFetching, page, users.length]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const canGoPrevious = page > 0;
  const canGoNext = hasNextPage;
  const showEnterSkeleton = useEnterSkeletonLoading(isLoading, 2200);
  const showSearchSpinner = useMinVisibleLoading(isFetching && !showEnterSkeleton, 900);
  const isPageTransitionLoading = useMinVisibleLoading(isFetching && !isLoading && !showEnterSkeleton, 900);
  const isFirstPageLoading = showEnterSkeleton && users.length === 0;

  const handlePreviousPage = () => {
    if (isFetching || !canGoPrevious) {
      return;
    }
    setPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    if (isLoading || isFetching || isCheckingNextPage || !canGoNext) {
      return;
    }
    setPage((prev) => prev + 1);
  };

  const handleFirstPage = () => {
    if (isFetching || page === 0) {
      return;
    }

    setPage(0);
  };

  const openUpdateDialog = (user: IUser) => {
    setEditingUser({
      userId: String(user.id),
      username: user.username || "",
      email: user.email || "",
      password: "",
      roleId: user.roles?.[0]?.id,
    });
    setSelectedAvatarFile(null);
    setAvatarPreview(user.avatarUrl || null);
  };

  const handleAvatarFile = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.");
      return;
    }

    setSelectedAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "default";
      case "USER":
        return "secondary";
      case "guest":
        return "outline";
      default:
        return "secondary";
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
      <UserStatistics userList={users} />

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>
            Tìm kiếm theo tên/ID, lọc theo vai trò và trạng thái để thao tác
            quản trị nhanh hơn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-9"
              />
              {showSearchSpinner ? (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              ) : null}
            </div>

            <Select
              value={filterRole}
              onValueChange={(value) => setFilterRole(String(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                {(Array.isArray(roleList) ? Array.from(roleList) : []).map(
                  (r: IRole) => {
                    return (
                      <SelectItem value={`${r.id}`} key={`${r.id}`}>
                        {r.name}
                      </SelectItem>
                    );
                  },
                )}
              </SelectContent>
            </Select>

            <Select
              value={filterLogin as string}
              onValueChange={(value) => {
                setFilterLogin(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="true">Đang hoạt động</SelectItem>
                <SelectItem value="false">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative hidden overflow-x-auto rounded-lg border md:block">
            {isPageTransitionLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải trang...
                </div>
              </div>
            ) : null}
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
                {isFirstPageLoading ? (
                  Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Đang tải dữ liệu người dùng...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Không có người dùng phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user: IUser) => {
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage src={user.avatarUrl || ""} alt={user.username || "User"} />
                              <AvatarFallback>
                                {getInitials(user.username)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                              <p className="font-medium">
                                {user.username || "Chưa cập nhật tên"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {user.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {user.roles.map((r: IRole) => (
                              <Badge
                                key={r.id}
                                variant={
                                  roleBadgeVariant(r.name) as
                                  | "default"
                                  | "secondary"
                                  | "outline"
                                }
                              >
                                {getRoleLabel(r.name as string)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={!user.login ? "destructive" : "outline"}
                            className={cn(
                              user.login &&
                              "border-emerald-200 bg-emerald-50 text-emerald-700",
                            )}
                          >
                            {!user.login ? "Không hoạt động" : "Hoạt động"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </TableCell>

                        <TableCell>
                          <Switch
                            defaultChecked={user.active}
                            onCheckedChange={(checked) =>
                              handleLockUser(user.id, checked)
                            }
                          />
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
                                  <AlertDialogTitle>
                                    Xác nhận xóa mềm người dùng?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tài khoản{" "}
                                    <strong>{user.username || user.id}</strong>{" "}
                                    sẽ bị ẩn khỏi danh sách chính và có thể khôi
                                    phục ở trang user đã xóa mềm.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      softDeleteUser.mutate(user.id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Xóa mềm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>

                        <Dialog
                          open={Boolean(editingUser)}
                          onOpenChange={(open) => !open && setEditingUser(null)}
                        >
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cập nhật người dùng</DialogTitle>
                              <DialogDescription>
                                Chỉnh sửa nhanh thông tin tài khoản trong trang quản trị.
                              </DialogDescription>
                            </DialogHeader>

                            {editingUser && (
                              <div className="space-y-4">
                                <div className="space-y-2">

                                  <input
                                    type="hidden"
                                    value={editingUser.userId}
                                    readOnly
                                  />

                                  <Label htmlFor="edit-username">Username</Label>
                                  <Input
                                    id="edit-username"
                                    value={editingUser.username}
                                    onChange={(e) =>
                                      setEditingUser((prev) =>
                                        prev ? { ...prev, username: e.target.value } : prev,
                                      )
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-email">Email</Label>
                                  <Input
                                    id="edit-email"
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) =>
                                      setEditingUser((prev) =>
                                        prev ? { ...prev, email: e.target.value } : prev,
                                      )
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-password">Password</Label>
                                  <Input
                                    id="edit-password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={editingUser.password}
                                    onChange={(e) =>
                                      setEditingUser((prev) =>
                                        prev ? { ...prev, password: e.target.value } : prev,
                                      )
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Ảnh đại diện</Label>

                                  <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => {
                                      const file = event.target.files?.[0] ?? null;
                                      handleAvatarFile(file);
                                      event.currentTarget.value = "";
                                    }}
                                  />

                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => avatarInputRef.current?.click()}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        avatarInputRef.current?.click();
                                      }
                                    }}
                                    onDragOver={(event) => {
                                      event.preventDefault();
                                      setIsAvatarDragOver(true);
                                    }}
                                    onDragLeave={(event) => {
                                      event.preventDefault();
                                      setIsAvatarDragOver(false);
                                    }}
                                    onDrop={(event) => {
                                      event.preventDefault();
                                      setIsAvatarDragOver(false);
                                      const file = event.dataTransfer.files?.[0] ?? null;
                                      handleAvatarFile(file);
                                    }}
                                    className={cn(
                                      "cursor-pointer rounded-lg border border-dashed p-4 transition",
                                      isAvatarDragOver
                                        ? "border-primary bg-primary/5"
                                        : "border-muted-foreground/30 hover:border-primary/50",
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-14 w-14 border">
                                        <AvatarImage src={avatarPreview || ""} alt="Avatar preview" />
                                        <AvatarFallback>IMG</AvatarFallback>
                                      </Avatar>

                                      <div className="space-y-1">
                                        <p className="flex items-center gap-2 text-sm font-medium">
                                          <ImageUp className="h-4 w-4" />
                                          Kéo & thả ảnh vào đây
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Hoặc bấm để chọn ảnh từ máy (JPG, PNG, WEBP - tối đa 5MB)
                                        </p>
                                        {selectedAvatarFile ? (
                                          <p className="text-xs text-emerald-600">
                                            Đã chọn: {selectedAvatarFile.name}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-role">Vai trò</Label>
                                  <Select
                                    value={String(editingUser.roleId ?? "")}
                                    onValueChange={(value) =>
                                      setEditingUser((prev) =>
                                        prev
                                          ? { ...prev, roleId: Number(value) }
                                          : prev,
                                      )
                                    }
                                  >
                                    <SelectTrigger id="edit-role">
                                      <SelectValue placeholder="Chọn vai trò" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {/* <SelectItem value="SUPER_ADMIN">Admin</SelectItem>
                    <SelectItem value="USER">User</SelectItem> */}
                                      {(Array.isArray(roleList) ? Array.from(roleList) : []).map((r: IRole) => {
                                        return (
                                          <SelectItem value={String(r.id)} key={String(r.id)}>{r.name}</SelectItem>
                                        )
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>

                              </div>
                            )}

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingUser(null);
                                  setSelectedAvatarFile(null);
                                  setAvatarPreview(null);
                                }}
                              >
                                Hủy
                              </Button>
                              <Button
                                onClick={() => {
                                  if (!editingUser) {
                                    return;
                                  }

                                  const payload: IUpdateUser = {
                                    userId: editingUser.userId,
                                    username: editingUser.username,
                                    email: editingUser.email,
                                    roleId: editingUser.roleId,
                                    ...(editingUser.password?.trim()
                                      ? { password: editingUser.password.trim() }
                                      : {}),
                                  };

                                  updateUser.mutate({
                                    payload,
                                    avatarFile: selectedAvatarFile,
                                  });
                                }}
                                disabled={updateUser.isPending}
                              >
                                {updateUser.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>

            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {isFirstPageLoading ? (
              <div className="space-y-3 rounded-lg border p-4">
                {Array.from({ length: Math.min(pageSize, 4) }).map((_, index) => (
                  <div key={`mobile-skeleton-${index}`} className="space-y-2 rounded-md border p-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-lg border p-5 text-center text-sm text-muted-foreground">
                Không có người dùng phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              users.map((user: IUser) => (
                <div key={user.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={user.avatarUrl || ""} alt={user.username || "User"} />
                        <AvatarFallback>
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.username || "Chưa cập nhật tên"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {user.id}
                        </p>
                      </div>
                    </div>
                    <Switch
                      defaultChecked={user.active}
                      onCheckedChange={(checked) =>
                        handleLockUser(user.id, checked)
                      }
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {user.roles.map((r: IRole) => (
                      <Badge
                        key={r.id}
                        variant={
                          roleBadgeVariant(r.name) as
                          | "default"
                          | "secondary"
                          | "outline"
                        }
                      >
                        {getRoleLabel(r.name as string)}
                      </Badge>
                    ))}
                    <Badge
                      variant={!user.login ? "destructive" : "outline"}
                      className={cn(
                        user.login &&
                        "border-emerald-200 bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {!user.login ? "Không hoạt động" : "Hoạt động"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Tạo ngày:{" "}
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
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
                          size="sm"
                          className="bg-red-500 hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Xác nhận xóa mềm người dùng?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tài khoản{" "}
                            <strong>{user.username || user.id}</strong> sẽ bị ẩn
                            khỏi danh sách chính và có thể khôi phục ở trang
                            user đã xóa mềm.
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
                </div>
              ))
            )}
          </div>

          {/* PAGINATION */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-slate-50/70 px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Trang {page + 1} - {users.length} user trong trang này
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-8 w-[110px]" id="select-rows-per-page">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    {USER_PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem value={String(size)} key={size}>
                        {size}/trang
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={handleFirstPage} disabled={isFetching || page === 0}>
                First
              </Button>
              <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={isFetching || !canGoPrevious}>
                Prev
              </Button>
              <span className="min-w-16 text-center text-xs text-muted-foreground">Trang {page + 1}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={isLoading || isFetching || isCheckingNextPage || !canGoNext}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(detailUserId)}
        onOpenChange={(open) => !open && setDetailUserId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>
              Thông tin tài khoản và trạng thái hiện tại.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <p className="text-sm text-muted-foreground">
              Đang tải chi tiết...
            </p>
          ) : detailUser ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">ID</span>
                <span className="font-medium">{detailUser.id}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Username</span>
                <span className="font-medium">
                  {detailUser.username || "Chưa cập nhật"}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">
                  {detailUser.email || "Chưa cập nhật"}
                </span>
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
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Không lấy được dữ liệu chi tiết.
            </p>
          )}
        </DialogContent>
      </Dialog>



    </div>
  );
}
