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
import { Empty } from "@/components/ui/empty";
import { useGetAllData } from "@/hooks/useGetAllData";
import { apiName } from "@/api/apiName";
import UserStatistics from "@/domains/users/UserStatistics";
import useDebounce from "@/hooks/useDebounce";
import { useEnterSkeletonLoading, useMinVisibleLoading } from "@/hooks/useMinimumLoading";
import { buildQuery } from "@/utils/QueryUtils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useI18n } from "@/i18n/I18nProvider";

const USER_PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const;

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useCurrentUser();
  const { t, language } = useI18n();

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
    const normalizedQuery = String(debouncedQuery ?? "");
    const trimmedQuery = normalizedQuery.trim();
    const isNumericQuery = /^\d+$/.test(trimmedQuery);

    const params = {
      username: trimmedQuery && !isNumericQuery ? trimmedQuery : undefined,
      accountId: trimmedQuery && isNumericQuery ? Number(trimmedQuery) : undefined,
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
      toast.success(t("auth.updateSuccess"));
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
      toast.success(t("auth.softDeleteSuccess"));
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
      toast.success(t("auth.updateUserSuccess"));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleLockUser = async (userId: number | string, lock: boolean) => {
    const targetUser = users.find((item: IUser) => String(item.id ?? "") === String(userId));
    if (targetUser && !canToggleUserActive(targetUser)) {
      toast.error(t("auth.toggleActiveDenied"));
      return;
    }

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
      toast.error(t("auth.invalidImage"));
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t("auth.avatarTooLarge"));
      return;
    }

    setSelectedAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const hasRole = (roles: IRole[] | undefined, roleName: string) => {
    if (!Array.isArray(roles)) {
      return false;
    }

    return roles.some((role) => String(role.name) === roleName);
  };

  const isCurrentUserAdmin = hasRole(currentUser?.roles, "ADMIN");
  const isCurrentUserSuperAdmin = hasRole(currentUser?.roles, "SUPER_ADMIN");

  const canToggleUserActive = (targetUser: IUser) => {
    const isSelf = String(currentUser?.id ?? "") === String(targetUser.id ?? "");
    if (isSelf) {
      return false;
    }

    const targetIsAdmin = hasRole(targetUser.roles, "ADMIN") || hasRole(targetUser.roles, "SUPER_ADMIN");
    if (!isCurrentUserSuperAdmin && isCurrentUserAdmin && targetIsAdmin) {
      return false;
    }

    return true;
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
      case "ADMIN":
      case "SUPER_ADMIN":
        return t("auth.roleAdmin");
      case "USER":
        return t("auth.roleStaff");
      case "GUEST":
      case "guest":
        return t("auth.roleGuest");
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
          <CardTitle>{t("auth.userListTitle")}</CardTitle>
          <CardDescription>{t("auth.userListDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("auth.searchUsers")}
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
                <SelectValue placeholder={t("auth.filterRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("auth.allRoles")}</SelectItem>
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
                <SelectValue placeholder={t("auth.filterStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("auth.allStatuses")}</SelectItem>
                <SelectItem value="true">{t("auth.active")}</SelectItem>
                <SelectItem value="false">{t("auth.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative overflow-x-auto rounded-lg border">
            {isPageTransitionLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("auth.loadingPage")}
                </div>
              </div>
            ) : null}
            <Table className="table-fixed min-w-[860px] [&_th]:px-2 [&_td]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">{t("auth.usernameColumn")}</TableHead>
                  <TableHead className="w-[180px]">{t("auth.roleColumn")}</TableHead>
                  <TableHead className="w-[110px] text-center">{t("auth.statusColumn")}</TableHead>
                  <TableHead className="w-[120px]">{t("auth.createdAt")}</TableHead>
                  <TableHead className="w-[90px] text-center">{t("auth.activeColumn")}</TableHead>
                  <TableHead className="w-[120px] text-right">{t("auth.actions")}</TableHead>
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
                    <TableCell colSpan={6} className="py-4">
                      <Empty
                        title={t("auth.noUsers")}
                        description={t("auth.noUsersDescription")}
                        icon={<Search className="h-5 w-5" />}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user: IUser) => {
                    return (
                      <TableRow key={user.id} className="align-middle">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage src={user.avatarUrl || ""} alt={user.username || "User"} />
                              <AvatarFallback>
                                {getInitials(user.username)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                              <p className="font-medium">
                                {user.username || t("auth.detailNoData")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {user.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="w-[180px] py-3">
                          <div className="flex min-h-8 flex-wrap items-center gap-1.5">
                            {user.roles?.length ? (
                              user.roles.map((r: IRole) => (
                                <Badge
                                  key={r.id}
                                  variant={
                                    roleBadgeVariant(r.name) as
                                    | "default"
                                    | "secondary"
                                    | "outline"
                                  }
                                  className="whitespace-nowrap"
                                >
                                  {getRoleLabel(r.name as string)}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="whitespace-nowrap">
                                {t("auth.noRole")}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-3 text-center">
                          <Badge
                            variant={!user.login ? "destructive" : "outline"}
                            className={cn(
                              user.login &&
                              "border-emerald-200 bg-emerald-50 text-emerald-700",
                            )}
                          >
                            {!user.login ? t("auth.switchInactive") : t("auth.switchActive")}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-3 text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                        </TableCell>

                        <TableCell className="py-3 text-center">
                          {!canToggleUserActive(user) && String(currentUser?.id ?? "") !== String(user.id ?? "") ? (
                            <span className="block text-xs text-muted-foreground">
                              {t("auth.noPermission")}
                            </span>
                          ) : null}
                          <Switch
                            checked={Boolean(user.active)}
                            disabled={!canToggleUserActive(user)}
                            onCheckedChange={(checked) =>
                              handleLockUser(user.id, checked)
                            }
                          />
                        </TableCell>

                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="default"
                              className="h-8 w-8 bg-blue-500 p-0 hover:bg-blue-600"
                              size="icon"
                              onClick={() => setDetailUserId(String(user.id))}
                            >
                              <CircleArrowOutUpRight size={12} />
                            </Button>

                            <Button
                              variant="default"
                              className="h-8 w-8 bg-orange-500 p-0 hover:bg-orange-600"
                              size="icon"
                              onClick={() => openUpdateDialog(user)}
                            >
                              <Pencil size={12} />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="default"
                                  size="icon"
                                  className="h-8 w-8 bg-red-500 hover:bg-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t("auth.deleteConfirm")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("auth.deleteConfirmDescription").replace("{name}", String(user.username || user.id))}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t("auth.cancel")}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      softDeleteUser.mutate(user.id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {t("auth.softDelete")}
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
                              <DialogTitle>{t("auth.editUser")}</DialogTitle>
                              <DialogDescription>{t("auth.editUserDescription")}</DialogDescription>
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
                                  <Label htmlFor="edit-password">{t("auth.editPassword")}</Label>
                                  <Input
                                    id="edit-password"
                                    type="password"
                                    placeholder={t("auth.passwordInputPlaceholder")}
                                    value={editingUser.password}
                                    onChange={(e) =>
                                      setEditingUser((prev) =>
                                        prev ? { ...prev, password: e.target.value } : prev,
                                      )
                                    }
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>{t("auth.avatar")}</Label>

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
                                        <AvatarFallback>{t("auth.noAvatar")}</AvatarFallback>
                                      </Avatar>

                                      <div className="space-y-1">
                                        <p className="flex items-center gap-2 text-sm font-medium">
                                          <ImageUp className="h-4 w-4" />
                                          {t("auth.uploadingAvatar")}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {t("auth.chooseAvatar")}
                                        </p>
                                        {selectedAvatarFile ? (
                                          <p className="text-xs text-emerald-600">
                                            {t("auth.avatarSelected")}: {selectedAvatarFile.name}
                                          </p>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-role">{t("auth.role")}</Label>
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
                                      <SelectValue placeholder={t("auth.chooseRole")} />
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
                                {t("auth.cancel")}
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
                                {updateUser.isPending ? t("auth.saving") : t("auth.saveChanges")}
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

          <div className="hidden">
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
              <Empty
                title={t("auth.noUsers")}
                description={t("auth.noUsersDescription")}
                icon={<Search className="h-5 w-5" />}
              />
            ) : (
              users.map((user: IUser) => (
                <div key={user.id} className="space-y-3 rounded-lg border p-4 shadow-sm">
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
                          {user.username || t("auth.detailNoData")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {user.id}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={Boolean(user.active)}
                      disabled={!canToggleUserActive(user)}
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
                      {!user.login ? t("auth.switchInactive") : t("auth.switchActive")}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {t("auth.createdAt")}: {" "}
                    {new Date(user.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="default"
                      className="h-9 bg-blue-500 hover:bg-blue-600"
                      size="sm"
                      onClick={() => setDetailUserId(String(user.id))}
                    >
                      <CircleArrowOutUpRight size={12} />
                    </Button>

                    <Button
                      variant="default"
                      className="h-9 bg-orange-500 hover:bg-orange-600"
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
                          className="h-9 bg-red-500 hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("auth.deleteConfirm")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("auth.deleteConfirmDescription").replace("{name}", String(user.username || user.id))}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("auth.cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => softDeleteUser.mutate(user.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t("auth.softDelete")}
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
          <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              {t("auth.page")} {page + 1} - {users.length} {t("auth.pageUsers")}
            </span>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-8 w-[104px] bg-background/70" id="select-rows-per-page">
                    <SelectValue placeholder={t("auth.pageSize")} />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    {USER_PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem value={String(size)} key={size}>
                        {language === "vi" ? `${size}/trang` : `${size}/page`}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="hidden h-8 bg-background/70 hover:bg-accent/70 sm:inline-flex" onClick={handleFirstPage} disabled={isFetching || page === 0}>
                  {t("auth.first")}
                </Button>
                <Button variant="outline" size="sm" className="h-8 bg-background/70 hover:bg-accent/70" onClick={handlePreviousPage} disabled={isFetching || !canGoPrevious}>
                  {t("auth.prev")}
                </Button>
                <span className="flex h-8 min-w-16 items-center justify-center rounded-md border border-border/70 bg-background/70 px-2 text-xs text-muted-foreground">
                  {t("auth.page")} {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 bg-background/70 hover:bg-accent/70"
                  onClick={handleNextPage}
                  disabled={isLoading || isFetching || isCheckingNextPage || !canGoNext}
                >
                  {t("auth.next")}
                </Button>
              </div>
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
            <DialogTitle>{t("auth.detailTitle")}</DialogTitle>
            <DialogDescription>{t("auth.detailDescription")}</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <p className="text-sm text-muted-foreground">
              {t("auth.loadingDetail")}
            </p>
          ) : detailUser ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">{t("auth.detailId")}</span>
                <span className="font-medium">{detailUser.id}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">{t("auth.detailUsername")}</span>
                <span className="font-medium">
                  {detailUser.username || t("auth.detailNoData")}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">{t("auth.detailEmail")}</span>
                <span className="font-medium">
                  {detailUser.email || t("auth.detailNoData")}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">{t("auth.detailRole")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {detailUser.roles?.map((role) => (
                    <Badge key={role.id}>{getRoleLabel(role.name)}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">{t("auth.detailStatus")}</span>
                <Badge variant={detailUser.login ? "outline" : "destructive"}>
                  {detailUser.login ? t("auth.switchActive") : t("auth.switchInactive")}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("auth.detailNoData")}
            </p>
          )}
        </DialogContent>
      </Dialog>



    </div>
  );
}
