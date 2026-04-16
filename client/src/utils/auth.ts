import { IUser } from "@/types/UserInterface";

export const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

export const getPrimaryRoleName = (user?: Pick<IUser, "roles"> | null) =>
  user?.roles?.[0]?.name ?? "";

export const isSuperAdmin = (user?: Pick<IUser, "roles"> | null) =>
  user?.roles?.some((role) => role.name === SUPER_ADMIN_ROLE) ?? false;

export const getHomePath = (user?: Pick<IUser, "roles"> | null) =>
  isSuperAdmin(user) ? "/" : "/my-tasks";