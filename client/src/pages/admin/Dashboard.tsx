import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Kanban, CheckSquare, PieChart as PieChartIcon } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/I18nProvider";

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
  const { t, language } = useI18n();

  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ["admin-stats", language],
    queryFn: async (): Promise<DashboardStats> => {
      const res = await handleApi({
        url: apiName.dashboard.stats,
        method: "GET",
        withCredentials: true,
      });

      const payload = res.data?.data;

      return {
        totalUsers: Number(payload?.totalUsers ?? 0),
        totalProjects: Number(payload?.totalProjects ?? 0),
        totalTasks: Number(payload?.totalTasks ?? 0),
        unfinishedTasks: Number(payload?.unfinishedTasks ?? 0),
        statusDistribution: Array.isArray(payload?.statusDistribution)
          ? payload.statusDistribution.map((item: { name: string; value: number }) => ({
              name:
                item.name === "To do"
                  ? t("status.todo")
                  : item.name === "In progress"
                    ? t("status.inProgress")
                    : item.name === "Review"
                      ? t("status.review")
                      : item.name === "Done"
                        ? t("status.done")
                        : item.name,
              value: Number(item.value ?? 0),
            }))
          : [],
      };
    },
    staleTime: 30_000,
  });

  const statCards = [
    { title: t("dashboard.users"), value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
    { title: t("dashboard.projects"), value: stats?.totalProjects ?? 0, icon: Kanban, color: "text-emerald-600" },
    { title: t("dashboard.tasks"), value: stats?.totalTasks ?? 0, icon: CheckSquare, color: "text-amber-600" },
    { title: t("dashboard.unfinishedTasks"), value: stats?.unfinishedTasks ?? 0, icon: PieChartIcon, color: "text-violet-600" },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          {t("dashboard.loadError")} {error instanceof Error ? error.message : t("dashboard.reloadHint")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("dashboard.title")}</h2>

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
          <CardTitle className="text-base">{t("dashboard.taskByStatus")}</CardTitle>
          <CardDescription>{t("dashboard.backendData")}</CardDescription>
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
