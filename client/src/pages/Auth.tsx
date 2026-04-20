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
import { useI18n } from "@/i18n/I18nProvider";
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
  const { t } = useI18n();
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
      errors.email = t("auth.emailRequired");
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = t("auth.emailInvalid");
    }

    if (!loginPassword) {
      errors.password = t("auth.passwordRequired");
    } else if (loginPassword.length < 6) {
      errors.password = t("auth.passwordMin");
    }

    return errors;
  };

  const validateRegister = (): RegisterErrors => {
    const errors: RegisterErrors = {};
    const name = registerName.trim();
    const email = registerEmail.trim();

    if (!name) {
      errors.name = t("auth.nameRequired");
    } else if (name.length < 2) {
      errors.name = t("auth.nameMin");
    }

    if (!email) {
      errors.email = t("auth.emailRequired");
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = t("auth.emailInvalid");
    }

    if (!registerPassword) {
      errors.password = t("auth.passwordRequired");
    } else if (registerPassword.length < 6) {
      errors.password = t("auth.passwordMin");
    }

    if (!registerConfirmPassword) {
      errors.confirmPassword = t("auth.confirmRequired");
    } else if (registerConfirmPassword !== registerPassword) {
      errors.confirmPassword = t("auth.confirmMismatch");
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
      toast.success(t("auth.loginSuccess"));
    } catch (err: unknown) {
      const message = normalizeErrorMessage(err, t("auth.loginFailure"));
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
      toast.success(t("auth.registerSuccess"));

    } catch (err: unknown) {
      const message = normalizeErrorMessage(err, t("auth.registerFailure"));
      toast.error(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-primary/10 ring-1 ring-border">
            <img src="/Logo/logo.png" alt={t("auth.brand")} className="h-full w-full object-cover" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("auth.brand")}</CardTitle>
          <CardDescription>{t("auth.description")}</CardDescription>
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
              <TabsTrigger value="login">{t("auth.loginTab")}</TabsTrigger>
              <TabsTrigger value="register">{t("auth.registerTab")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t("auth.loginEmailLabel")}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder={t("auth.emailPlaceholder")}
                    required
                    autoComplete="email"
                    aria-invalid={Boolean(loginErrors.email)}
                  />
                  {loginErrors.email ? <p className="text-xs text-destructive">{loginErrors.email}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">{t("auth.loginPasswordLabel")}</Label>
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
                  {loginLoading ? t("auth.loginLoading") : t("auth.loginButton")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">{t("auth.registerNameLabel")}</Label>
                  <Input
                    id="register-name"
                    value={registerName}
                    onChange={(e) => {
                      setRegisterName(e.target.value);
                      setRegisterErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder={t("auth.fullNamePlaceholder")}
                    required
                    aria-invalid={Boolean(registerErrors.name)}
                  />
                  {registerErrors.name ? <p className="text-xs text-destructive">{registerErrors.name}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">{t("auth.registerEmailLabel")}</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => {
                      setRegisterEmail(e.target.value);
                      setRegisterErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder={t("auth.emailPlaceholder")}
                    required
                    autoComplete="email"
                    aria-invalid={Boolean(registerErrors.email)}
                  />
                  {registerErrors.email ? <p className="text-xs text-destructive">{registerErrors.email}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">{t("auth.registerPasswordLabel")}</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => {
                      setRegisterPassword(e.target.value);
                      setRegisterErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder={t("auth.passwordPlaceholder")}
                    minLength={6}
                    required
                    autoComplete="new-password"
                    aria-invalid={Boolean(registerErrors.password)}
                  />
                  {registerErrors.password ? <p className="text-xs text-destructive">{registerErrors.password}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">{t("auth.registerConfirmLabel")}</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(e) => {
                      setRegisterConfirmPassword(e.target.value);
                      setRegisterErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder={t("auth.confirmPlaceholder")}
                    required
                    autoComplete="new-password"
                    aria-invalid={Boolean(registerErrors.confirmPassword)}
                  />
                  {registerErrors.confirmPassword ? (
                    <p className="text-xs text-destructive">{registerErrors.confirmPassword}</p>
                  ) : null}
                </div>

                <Button type="submit" className="w-full" disabled={registerLoading}>
                  {registerLoading ? t("auth.registerSubmitting") : t("auth.registerButton")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
