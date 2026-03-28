import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

export default function Analytics() {
  const { data } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [usersRes, boardsRes, cardsRes] = await Promise.all([
        supabase.from("profiles").select("created_at"),
        supabase.from("boards").select("created_at, is_deleted"),
        supabase.from("cards").select("created_at"),
      ]);
      return {
        users: usersRes.data || [],
        boards: boardsRes.data || [],
        cards: cardsRes.data || [],
      };
    },
  });

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  const userGrowth = last30Days.map((day) => {
    const total = data?.users.filter((u) => u.created_at.split("T")[0] <= day).length ?? 0;
    return { date: day.slice(5), total };
  });

  const dailyCards = last30Days.map((day) => ({
    date: day.slice(5),
    count: data?.cards.filter((c) => c.created_at.startsWith(day)).length ?? 0,
  }));

  const dailyBoards = last30Days.map((day) => ({
    date: day.slice(5),
    count: data?.boards.filter((b) => b.created_at.startsWith(day)).length ?? 0,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Tăng trưởng người dùng (30 ngày)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Tasks tạo mới theo ngày</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyCards}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Boards tạo mới theo ngày</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyBoards}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
