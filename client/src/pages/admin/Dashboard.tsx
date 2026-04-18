import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Kanban, CheckSquare, PieChart as PieChartIcon } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardStats = {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  unfinishedTasks: number;
  statusDistribution: Array<{ name: string; value: number }>;
};

const STATUS_COLORS = ["#06B6D4", "#F59E0B", "#8B5CF6", "#10B981"];

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-44" />

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-2 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </CardHeader>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-4">
          <Skeleton className="h-56 w-56 rounded-full" />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="ml-auto h-4 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const [usersCountRes, usersListRes, projectsRes, allTasksRes, todoRes, inProgressRes, reviewRes, doneRes] = await Promise.allSettled([
        handleApi({ url: apiName.accounts.count, method: "GET", withCredentials: true }),
        handleApi({
          url: apiName.accounts.list,
          method: "GET",
          withCredentials: true,
          params: { page: 0, size: 1000 },
        }),
        handleApi({ url: apiName.projects.list, method: "GET", withCredentials: true }),
        handleApi({
          url: apiName.tasks.search,
          method: "GET",
          withCredentials: true,
          params: { page: 0, size: 1 },
        }),
        handleApi({
          url: apiName.tasks.search,
          method: "GET",
          withCredentials: true,
          params: { status: "to_do", page: 0, size: 1 },
        }),
        handleApi({
          url: apiName.tasks.search,
          method: "GET",
          withCredentials: true,
          params: { status: "in_progress", page: 0, size: 1 },
        }),
        handleApi({
          url: apiName.tasks.search,
          method: "GET",
          withCredentials: true,
          params: { status: "review", page: 0, size: 1 },
        }),
        handleApi({
          url: apiName.tasks.search,
          method: "GET",
          withCredentials: true,
          params: { status: "done", page: 0, size: 1 },
        }),
      ]);

      const usersCountData = usersCountRes.status === "fulfilled" ? usersCountRes.value.data?.data : null;
      const usersListData = usersListRes.status === "fulfilled" ? usersListRes.value.data?.data : null;
      const projectsData = projectsRes.status === "fulfilled" ? projectsRes.value.data?.data : null;
      const allTasksData = allTasksRes.status === "fulfilled" ? allTasksRes.value.data?.data : null;
      const todoData = todoRes.status === "fulfilled" ? todoRes.value.data?.data : null;
      const inProgressData = inProgressRes.status === "fulfilled" ? inProgressRes.value.data?.data : null;
      const reviewData = reviewRes.status === "fulfilled" ? reviewRes.value.data?.data : null;
      const doneData = doneRes.status === "fulfilled" ? doneRes.value.data?.data : null;

      const totalUsersFromCount = Number(usersCountData ?? 0);
      const totalUsersFromList = Array.isArray(usersListData) ? usersListData.length : 0;
      const totalUsers = totalUsersFromCount > 0 ? totalUsersFromCount : totalUsersFromList;

      const totalProjects = Array.isArray(projectsData) ? projectsData.length : 0;
      const totalTasks = Number(allTasksData?.totalElements ?? 0);
      const todo = Number(todoData?.totalElements ?? 0);
      const inProgress = Number(inProgressData?.totalElements ?? 0);
      const review = Number(reviewData?.totalElements ?? 0);
      const done = Number(doneData?.totalElements ?? 0);

      return {
        totalUsers,
        totalProjects,
        totalTasks,
        unfinishedTasks: Math.max(totalTasks - done, 0),
        statusDistribution: [
          { name: "To do", value: todo },
          { name: "In progress", value: inProgress },
          { name: "Review", value: review },
          { name: "Done", value: done },
        ],
      };
    },
  });

  const statCards = [
    { title: "Tổng người dùng", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
    { title: "Tổng projects", value: stats?.totalProjects ?? 0, icon: Kanban, color: "text-emerald-600" },
    { title: "Tổng tasks", value: stats?.totalTasks ?? 0, icon: CheckSquare, color: "text-amber-600" },
    { title: "Tasks chưa hoàn thành", value: stats?.unfinishedTasks ?? 0, icon: PieChartIcon, color: "text-violet-600" },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phân bổ task theo trạng thái</CardTitle>
          <CardDescription>Dữ liệu lấy trực tiếp từ backend.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={stats?.statusDistribution ?? []}
                cx="50%"
                cy="50%"
                outerRadius={110}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {(stats?.statusDistribution ?? []).map((_, i) => (
                  <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            {(stats?.statusDistribution ?? []).map((item, index) => (
              <div key={item.name} className="flex items-center gap-2 rounded-md border px-3 py-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }}
                />
                <span className="text-muted-foreground">{item.name}</span>
                <span className="ml-auto font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
