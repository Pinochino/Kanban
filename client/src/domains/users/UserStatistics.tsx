import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  ArchiveRestore,
} from "lucide-react";
import { IUser } from "@/types/UserInterface";
import { useGetAllData } from "@/hooks/useGetAllData";
import { apiName } from "@/api/apiName";

const UserStatistics = ({ userList }: { userList: IUser[] }) => {

  const { data: userLoginNum } = useGetAllData({ url: `${apiName.accounts.loginNums}?login=true` })
  const { data: userActiveNum } = useGetAllData({ url: `${apiName.accounts.activeNums}?active=false` })
  const { data: userAdminNum } = useGetAllData({ url: `${apiName.accounts.countByRole}?name=SUPER_ADMIN` })



  return (
    <>
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-sm text-slate-200">
              <ShieldCheck className="h-4 w-4" />
              Admin control panel
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">
              User Management
            </h1>
            <p className="max-w-2xl text-sm text-slate-200">
              Quản trị tài khoản, phân quyền, trạng thái khóa/mở khóa và theo
              dõi truy cập trên toàn hệ thống.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="secondary"
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              <Link to="/users/deleted">
                <ArchiveRestore className="mr-1 h-4 w-4" />
                User đã xóa mềm
              </Link>
            </Button>
            <Badge
              variant="outline"
              className="w-fit border-slate-500 bg-slate-800/60 px-3 py-1 text-slate-100"
            >
               {Array.isArray(userList) && Array.from(userList).length} kết quả hiển thị
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng người dùng</CardDescription>
            <CardTitle className="text-2xl">
              {Array.isArray(userList) && Array.from(userList).length}
            </CardTitle>
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
    </>
  );
};

export default UserStatistics;
