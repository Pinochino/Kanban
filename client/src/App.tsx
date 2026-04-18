import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {Toaster} from "@/components/ui/toaster";
import {TooltipProvider} from "@/components/ui/tooltip";
import {ProtectedRoute, AdminRoute} from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import SoftDeletedUsers from "./pages/admin/SoftDeletedUsers";
import NotificationControl from "./pages/admin/NotificationControl";
import GlobalProvider from "./hooks/providers/GlobalProvider";
import {AuthProvider} from "./hooks/providers/AuthProvider";
import ProjectManagement from "./pages/admin/ProjectManagement";
import MyTasks from "./pages/MyTasks";
import UserLayout from "./layouts/UserLayout";
import TaskManagement from "./pages/admin/TaskManagement";
import { I18nProvider } from "@/i18n/I18nProvider";
import ChatRoute from "./pages/ChatRoute";

const queryClient = new QueryClient();

const App = () => (
    <GlobalProvider>
        <I18nProvider>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <Toaster/>
                    <Sonner/>
                    <BrowserRouter>
                    <Routes>
                        {/* PUBLIC ROUTE */}
                        <Route path="/auth" element={<Auth/>}/>

                        {/* PROTECTED */}
                        <Route
                            path="/*"
                            element={
                                <AuthProvider>
                                    <Routes>
                                        {/* <Route path="/" element={
                    // <ProtectedRoute>
                    <Boards />
                    // </ProtectedRoute>
                  }
                  />
                  <Route path="/board/:id" element={<ProtectedRoute><BoardView /></ProtectedRoute>} /> */}

                                        <Route path="/" element={
                                            <AdminRoute>
                                                <AdminLayout/>
                                            </AdminRoute>
                                        }
                                        >
                                            <Route index element={<AdminDashboard/>}/>
                                            <Route path="users" element={<UserManagement/>}/>
                                            <Route path="users/deleted" element={<SoftDeletedUsers/>}/>
                                            <Route path="projects" element={<ProjectManagement/>}/>
                                            <Route path="projects/:projectId/tasks" element={<TaskManagement/>}/>
                                            <Route path="notifications" element={<NotificationControl/>}/>
                                        </Route>

                                            <Route
                                                path="/chat"
                                                element={
                                                    <ProtectedRoute>
                                                        <ChatRoute />
                                                    </ProtectedRoute>
                                                }
                                            />

                                        <Route
                                            path="/my-tasks"
                                            element={
                                                <ProtectedRoute>
                                                    <UserLayout>
                                                        <MyTasks />
                                                    </UserLayout>
                                                </ProtectedRoute>
                                            }
                                        />

                                        <Route path="*" element={<NotFound/>}/>
                                    </Routes>
                                </AuthProvider>
                            }
                        />
                    </Routes>
                    </BrowserRouter>
                </TooltipProvider>
            </QueryClientProvider>
        </I18nProvider>
    </GlobalProvider>
);

export default App;
