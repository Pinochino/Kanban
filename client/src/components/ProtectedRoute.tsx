import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isSuperAdmin } from "@/utils/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useCurrentUser();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      navigate("/my-tasks", { replace: true });
    }
  }, [isAdmin, isLoading, navigate, user]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  if (!isSuperAdmin(user)) return <Navigate to="/my-tasks" replace />;
  return <>{children}</>;
}
