import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Kanban, CheckSquare, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, boardsRes, cardsRes] = await Promise.all([
        supabase.from("profiles").select("id, created_at"),
        supabase.from("boards").select("id, is_deleted, created_at").eq("is_deleted", false),
        supabase.from("cards").select("id, created_at"),
      ]);

      return {
        totalUsers: usersRes.data?.length ?? 0,
        activeBoards: boardsRes.data?.length ?? 0,
        totalCards: cardsRes.data?.length ?? 0,
        users: usersRes.data ?? [],
        boards: boardsRes.data ?? [],
        cards: cardsRes.data ?? [],
      };
    },
  });

  const { data: roleStats } = useQuery({
    queryKey: ["admin-role-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role");
      const counts: Record<string, number> = {};
      data?.forEach((r) => {
        counts[r.role] = (counts[r.role] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  // Generate last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const usersByDay = last7Days.map((day) => ({
    date: day.slice(5),
    users: stats?.users.filter((u) => u.created_at.startsWith(day)).length ?? 0,
  }));

  const cardsByDay = last7Days.map((day) => ({
    date: day.slice(5),
    cards: stats?.cards.filter((c) => c.created_at.startsWith(day)).length ?? 0,
  }));

  const COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)"];

  const statCards = [
    { title: "Tổng người dùng", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
    { title: "Boards hoạt động", value: stats?.activeBoards ?? 0, icon: Kanban, color: "text-[hsl(var(--success))]" },
    { title: "Tổng tasks", value: stats?.totalCards ?? 0, icon: CheckSquare, color: "text-[hsl(var(--warning))]" },
    { title: "Active (7 ngày)", value: stats?.totalUsers ?? 0, icon: Activity, color: "text-[hsl(var(--info))]" },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Đăng ký mới (7 ngày)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={usersByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks tạo mới (7 ngày)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cardsByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="cards" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân bổ vai trò</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={roleStats || []} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {(roleStats || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
