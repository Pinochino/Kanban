import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Kanban, LogOut, Shield } from "lucide-react";

export default function Index() {
  const { user, profile, isAdmin, signOut, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Kanban className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg">TaskFlow</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin"><Shield className="h-4 w-4 mr-1" />Admin</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" />Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-3xl font-bold">Chào mừng, {profile?.full_name || "User"}! 👋</h1>
          <p className="text-muted-foreground">Hệ thống quản lý công việc Kanban sẽ sớm sẵn sàng. Các tính năng Board, Card, Drag & Drop đang được phát triển.</p>

          {isAdmin && (
            <div className="mt-4">
              <Button asChild size="lg">
                <Link to="/admin"><Shield className="h-5 w-5 mr-2" />Truy cập Admin Panel</Link>
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">📋 Boards</CardTitle>
                <CardDescription>Tạo và quản lý boards</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Sắp ra mắt...</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">🎯 Tasks</CardTitle>
                <CardDescription>Kéo thả cards giữa các cột</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Sắp ra mắt...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
