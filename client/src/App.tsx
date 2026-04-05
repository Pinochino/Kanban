import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import Boards from "./pages/Boards";
import BoardView from "./pages/BoardView";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import BoardManagement from "./pages/admin/BoardManagement";
import Moderation from "./pages/admin/Moderation";
import Analytics from "./pages/admin/Analytics";
import SystemSettings from "./pages/admin/SystemSettings";
import NotificationControl from "./pages/admin/NotificationControl";
import GlobalProvider from "./hooks/providers/GlobalProvider";
import { AuthProvider } from "./hooks/providers/AuthProvider";

const queryClient = new QueryClient();

const App = () => (
  <GlobalProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* PUBLIC ROUTE */}
            <Route path="/auth" element={<Auth />} />

            {/* PROTECTED */}
            <Route
              path="/*"
              element={
                <AuthProvider>
                  <Routes>
                    <Route path="/" element={<ProtectedRoute><Boards /></ProtectedRoute>} />
                    <Route path="/board/:id" element={<ProtectedRoute><BoardView /></ProtectedRoute>} />

                    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="boards" element={<BoardManagement />} />
                      <Route path="moderation" element={<Moderation />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="settings" element={<SystemSettings />} />
                      <Route path="notifications" element={<NotificationControl />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AuthProvider>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </GlobalProvider>
);

export default App;
