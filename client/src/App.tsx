import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import GlobalProvider from "./hooks/providers/GlobalProvider";
import { AuthProvider } from "./hooks/providers/AuthProvider";
import { I18nProvider } from "@/i18n/I18nProvider";

const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const SoftDeletedUsers = lazy(() => import("./pages/admin/SoftDeletedUsers"));
const NotificationControl = lazy(() => import("./pages/admin/NotificationControl"));
const ProjectManagement = lazy(() => import("./pages/admin/ProjectManagement"));
const MyTasks = lazy(() => import("./pages/MyTasks"));
const MyProjectTasks = lazy(() => import("./pages/MyProjectTasks"));
const Notifications = lazy(() => import("./pages/Notifications"));
const UserLayout = lazy(() => import("./layouts/UserLayout"));
const TaskManagement = lazy(() => import("./pages/admin/TaskManagement"));
const ChatRoute = lazy(() => import("./pages/ChatRoute"));
const Profile = lazy(() => import("./pages/Profile"));

const queryClient = new QueryClient();

const PageFallback = () => (
    <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">Loading...</div>
);

const App = () => (
    <GlobalProvider>
        <I18nProvider>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                        <Suspense fallback={<PageFallback />}>
                            <Routes>
                                <Route path="/auth" element={<Auth />} />

                                <Route
                                    path="/*"
                                    element={
                                        <AuthProvider>
                                            <Routes>
                                                <Route
                                                    path="/"
                                                    element={
                                                        <AdminRoute>
                                                            <AdminLayout />
                                                        </AdminRoute>
                                                    }
                                                >
                                                    <Route index element={<AdminDashboard />} />
                                                    <Route path="users" element={<UserManagement />} />
                                                    <Route path="users/deleted" element={<SoftDeletedUsers />} />
                                                    <Route path="projects" element={<ProjectManagement />} />
                                                    <Route path="projects/:projectId/tasks" element={<TaskManagement />} />
                                                    <Route path="admin/notifications" element={<NotificationControl />} />
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

                                                <Route
                                                    path="/my-tasks/:projectId/tasks"
                                                    element={
                                                        <ProtectedRoute>
                                                            <UserLayout>
                                                                <MyProjectTasks />
                                                            </UserLayout>
                                                        </ProtectedRoute>
                                                    }
                                                />

                                                    <Route
                                                        path="/profile"
                                                        element={
                                                            <ProtectedRoute>
                                                                <UserLayout>
                                                                    <Profile />
                                                                </UserLayout>
                                                            </ProtectedRoute>
                                                        }
                                                    />

                                                    <Route
                                                        path="/notifications"
                                                        element={
                                                            <ProtectedRoute>
                                                                <UserLayout>
                                                                    <Notifications />
                                                                </UserLayout>
                                                            </ProtectedRoute>
                                                        }
                                                    />

                                                <Route path="*" element={<NotFound />} />
                                            </Routes>
                                        </AuthProvider>
                                    }
                                />
                            </Routes>
                        </Suspense>
                    </BrowserRouter>
                </TooltipProvider>
            </QueryClientProvider>
        </I18nProvider>
    </GlobalProvider>
);

export default App;
