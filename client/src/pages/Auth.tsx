import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Kanban } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import authService from "@/services/AuthService";
import { getHomePath } from "@/utils/auth";

type LoginErrors = {
  email?: string;
  password?: string;
};

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export default function Auth() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const { status: loginStatus } = useAppSelector((state: RootState) => state.auth.login);

  const { status: registerStatus } = useAppSelector((state: RootState) => state.auth.register);

  if (loginStatus === "pending" || registerStatus === "pending")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  // if (userLogin) return <Navigate to="/" replace />;

  const validateLogin = (): LoginErrors => {
    const errors: LoginErrors = {};
    const email = loginEmail.trim();

    if (!email) {
      errors.email = "Vui lòng nhập email.";
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = "Email không đúng định dạng.";
    }

    if (!loginPassword) {
      errors.password = "Vui lòng nhập mật khẩu.";
    } else if (loginPassword.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    return errors;
  };

  const validateRegister = (): RegisterErrors => {
    const errors: RegisterErrors = {};
    const name = registerName.trim();
    const email = registerEmail.trim();

    if (!name) {
      errors.name = "Vui lòng nhập họ và tên.";
    } else if (name.length < 2) {
      errors.name = "Tên phải có ít nhất 2 ký tự.";
    }

    if (!email) {
      errors.email = "Vui lòng nhập email.";
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = "Email không đúng định dạng.";
    }

    if (!registerPassword) {
      errors.password = "Vui lòng nhập mật khẩu.";
    } else if (registerPassword.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (!registerConfirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (registerConfirmPassword !== registerPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    return errors;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateLogin();
    setLoginErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoginLoading(true);
    const loginPaylog = {
      email: loginEmail.trim(),
      password: loginPassword,
    };
    try {
      const account = await dispatch(authService.login({ ...loginPaylog })).unwrap();

      navigate(getHomePath(account));
      toast.success("Đăng nhập thành công!");
    } catch (err: unknown) {
      const message = normalizeErrorMessage(err, "Đăng nhập thất bại. Vui lòng thử lại.");
      toast.error(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRegister();
    setRegisterErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setRegisterLoading(true);
    const payload = {
      username: registerName.trim(),
      email: registerEmail.trim(),
      password: registerPassword,
    };
    try {
      const account = await dispatch(authService.register({ ...payload })).unwrap();
      navigate(getHomePath(account));
      toast.success("Đăng kí thành công!");

    } catch (err: unknown) {
      const message = normalizeErrorMessage(err, "Đăng ký thất bại. Vui lòng thử lại.");
      toast.error(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-2">
            <Kanban className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">TaskFlow</CardTitle>
          <CardDescription>Quản lý công việc hiệu quả</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="login"
            value={activeTab}
            onValueChange={(value) => {
              const normalized = value === "register" ? "register" : "login";
              setActiveTab(normalized);
              setLoginErrors({});
              setRegisterErrors({});
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Đăng nhập</TabsTrigger>
              <TabsTrigger value="register">Đăng ký</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    aria-invalid={Boolean(loginErrors.email)}
                  />
                  {loginErrors.email ? <p className="text-xs text-destructive">{loginErrors.email}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mật khẩu</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    aria-invalid={Boolean(loginErrors.password)}
                  />
                  {loginErrors.password ? <p className="text-xs text-destructive">{loginErrors.password}</p> : null}
                </div>
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? "Đang xử lý..." : "Đăng nhập"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Họ và tên</Label>
                  <Input
                    id="register-name"
                    value={registerName}
                    onChange={(e) => {
                      setRegisterName(e.target.value);
                      setRegisterErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Nguyễn Văn A"
                    required
                    aria-invalid={Boolean(registerErrors.name)}
                  />
                  {registerErrors.name ? <p className="text-xs text-destructive">{registerErrors.name}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => {
                      setRegisterEmail(e.target.value);
                      setRegisterErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    aria-invalid={Boolean(registerErrors.email)}
                  />
                  {registerErrors.email ? <p className="text-xs text-destructive">{registerErrors.email}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Mật khẩu</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => {
                      setRegisterPassword(e.target.value);
                      setRegisterErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Tối thiểu 6 ký tự"
                    minLength={6}
                    required
                    autoComplete="new-password"
                    aria-invalid={Boolean(registerErrors.password)}
                  />
                  {registerErrors.password ? <p className="text-xs text-destructive">{registerErrors.password}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Xác nhận mật khẩu</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(e) => {
                      setRegisterConfirmPassword(e.target.value);
                      setRegisterErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Nhập lại mật khẩu"
                    required
                    autoComplete="new-password"
                    aria-invalid={Boolean(registerErrors.confirmPassword)}
                  />
                  {registerErrors.confirmPassword ? (
                    <p className="text-xs text-destructive">{registerErrors.confirmPassword}</p>
                  ) : null}
                </div>

                <Button type="submit" className="w-full" disabled={registerLoading}>
                  {registerLoading ? "Đang xử lý..." : "Đăng ký"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
