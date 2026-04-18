import { useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { getHomePath, isSuperAdmin } from "@/utils/auth";

export const useCurrentUser = () => {
  const { data: userLogin, status: loginStatus } = useAppSelector((state: RootState) => state.auth.login);
  const { data: userRegister, status: registerStatus } = useAppSelector((state: RootState) => state.auth.register);

  const user = userLogin ?? userRegister ?? null;
  const isLoading = loginStatus === "pending" || registerStatus === "pending";

  return {
    user,
    isAdmin: isSuperAdmin(user),
    isLoading,
    homePath: getHomePath(user),
  };
};