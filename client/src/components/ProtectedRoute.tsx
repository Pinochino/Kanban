import { useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { setAccessToken } from "@/utils/JwtUtils";
import axios from "axios";
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: userLogin, status: statusLogin } = useAppSelector(
    (state: RootState) => state.auth.login,
  );

  const { data: userRegister, status: statusRegister } = useAppSelector(
    (state: RootState) => state.auth.register,
  );


  if (statusLogin === "pending" || statusRegister === "pending")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  if (!userLogin && !userRegister) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  // const { user, isAdmin, isLoading } = useAuth();

  const { data: userLogin, status: statusLogin } = useAppSelector(
    (state: RootState) => state.auth.login,
  );

  const { data: userRegister, status: statusRegister } = useAppSelector(
    (state: RootState) => state.auth.register,
  );

  const navigate = useNavigate();

  // App.tsx hoặc ProtectedRoute
  useEffect(() => {
    const restoreToken = async () => {
      try {
        const res = await axios.post(
          "http://localhost:9000/api/auth/refresh-token",
          {},
          { withCredentials: true }
        );

        setAccessToken(res.data.data);

      } catch {
        // refresh token hết hạn → redirect login
        navigate("/auth");
      }
    };

    restoreToken();
  }, []);

  if (statusLogin === "pending" || statusRegister === "pending")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  if (!userLogin && !userRegister) return <Navigate to="/auth" replace />;
  // if (userLogin?.roles[0].name !== "SUPER_ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}
