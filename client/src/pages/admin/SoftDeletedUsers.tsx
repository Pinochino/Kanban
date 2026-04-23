import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, RotateCcw, Trash } from "lucide-react";
import { handleApi } from "@/api/handleApi";
import { IRole, IUser } from "@/types/UserInterface";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { apiName } from "@/api/apiName";
import { useGetAllData } from "@/hooks/useGetAllData";
import { useI18n } from "@/i18n/I18nProvider";
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
import { AxiosError } from "axios";

const getRoleLabel = (role: string, t: (key: string) => string) => {
  switch (role) {
    case "SUPER_ADMIN":
      return t("auth.roleAdmin");
    case "USER":
      return t("auth.roleStaff");
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
  const { t } = useI18n();

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ??
        error.message;
      return message || fallback;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  };

  const { data: users, isLoading } = useGetAllData({
    url: `${apiName.accounts.listSoftDelete}`,
  });

  const restoreUser = useMutation({
    mutationFn: async (userId: string | number) => {
      const res = await handleApi({
        url: `/accounts/restore/${userId}`,
        method: "PATCH",
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`${apiName.accounts.listSoftDelete}`],
      });
      queryClient.invalidateQueries({ queryKey: [`${apiName.accounts.list}`] });
      // queryClient.invalidateQueries({ queryKey: ["userActiveNum"] });
      toast.success(t("auth.updateSuccess"));
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, t("auth.deleteForeverDescription")),
      ),
  });

  const deleteUserPermanent = useMutation({
    mutationFn: async (userId: string | number) => {
      const res = await handleApi({
        url: `/accounts/delete/${userId}`,
        method: "DELETE",
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`${apiName.accounts.listSoftDelete}`],
      });
      queryClient.invalidateQueries({ queryKey: [`${apiName.accounts.list}`] });
      // queryClient.invalidateQueries({ queryKey: ["userActiveNum"] });
      toast.success(t("auth.deleteForever"));
    },
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, t("auth.deleteForeverDescription")),
      ),
  });

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold md:text-3xl">
              {t("auth.softDelete")}
            </h1>
            <p className="max-w-2xl text-sm text-slate-200">
              {t("auth.deleteConfirmDescription")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="secondary"
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              <Link to="/users">
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t("sidebar.users")}
              </Link>
            </Button>
            <Badge
              variant="outline"
              className="border-slate-500 bg-slate-800/60 px-3 py-1 text-slate-100"
            >
              {Array.isArray(users) ? users.length : 0} {t("auth.pageUsers")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("auth.softDelete")}</CardTitle>
          <CardDescription>{t("auth.detailDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("auth.usernameColumn")}</TableHead>
                  <TableHead>{t("auth.detailEmail")}</TableHead>
                  <TableHead>{t("auth.roleColumn")}</TableHead>
                  <TableHead>{t("auth.createdAt")}</TableHead>
                  <TableHead className="text-right">
                    {t("auth.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {t("auth.loadingPage")}
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(users) || users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {t("auth.noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarFallback>
                              {getInitials(user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <p className="font-medium">
                              {user.username || t("auth.noRole")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {user.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {user.roles.map((r: IRole) => (
                            <Badge key={r.id} variant="secondary">
                              {getRoleLabel(r.name, t)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          onClick={() => restoreUser.mutate(user.id || "")}
                          disabled={restoreUser.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700"
                          size="icon"
                        >
                          <RotateCcw />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="bg-red-400"
                              size="icon"
                              disabled={deleteUserPermanent.isPending}
                            >
                              <Trash />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Bạn chắc chắn muốn xóa vĩnh viễn?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này không thể hoàn tác. Người dùng sẽ
                                bị xóa khỏi hệ thống vĩnh viễn.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteUserPermanent.mutate(user.id || "")
                                }
                                disabled={deleteUserPermanent.isPending}
                                className="bg-red-500 text-white hover:bg-red-600"
                              >
                                {deleteUserPermanent.isPending
                                  ? t("auth.deleteForever")
                                  : t("auth.deleteForever")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {isLoading ? (
              <div className="rounded-lg border p-5 text-center text-sm text-muted-foreground">
                {t("auth.loadingPage")}
              </div>
            ) : !Array.isArray(users) || users.length === 0 ? (
              <div className="rounded-lg border p-5 text-center text-sm text-muted-foreground">
                {t("auth.noData")}
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback>
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.username || t("auth.noRole")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {user.id}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {user.email || "-"}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {user.roles.map((r: IRole) => (
                      <Badge key={r.id} variant="secondary">
                        {getRoleLabel(r.name, t)}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    <Button
                      onClick={() => restoreUser.mutate(user.id || "")}
                      disabled={restoreUser.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <RotateCcw className="mr-1 h-4 w-4" />
                      {t("auth.restore")}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: [`${apiName.accounts.listSoftDelete}`],
                })
              }
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {t("auth.reload")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
