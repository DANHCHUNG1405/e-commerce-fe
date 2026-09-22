import { request } from "@/lib/api/client";
import type {
  AccountPermissions,
  AuthResult,
  SellerMembership,
  TokenPair,
  User,
} from "@/lib/api/types";
export const authApi = {
  register: (body: { email: string; password: string; fullName: string }) =>
    request<AuthResult>({ url: "/auth/register", method: "POST", data: body }),
  login: (body: { email: string; password: string }) =>
    request<AuthResult>({ url: "/auth/login", method: "POST", data: body }),
  refresh: (refreshToken: string) =>
    request<TokenPair>({
      url: "/auth/refresh",
      method: "POST",
      data: { refreshToken },
      skipAuthRefresh: true,
    }),
  logout: (refreshToken: string) =>
    request<Record<string, never>>({
      url: "/auth/logout",
      method: "POST",
      data: { refreshToken },
      skipAuthRefresh: true,
    }),
  me: () => request<User>({ url: "/auth/me" }),
  permissions: () => request<AccountPermissions>({ url: "/users/me/permissions" }),
  memberships: () => request<SellerMembership[]>({ url: "/users/me/seller-memberships" }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<Record<string, never>>({
      url: "/auth/change-password",
      method: "POST",
      data: { currentPassword, newPassword },
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>({
      url: "/auth/forgot-password",
      method: "POST",
      data: { email },
      skipAuthRefresh: true,
    }),
  resetPassword: (token: string, newPassword: string) =>
    request<Record<string, never>>({
      url: "/auth/reset-password",
      method: "POST",
      data: { token, newPassword },
      skipAuthRefresh: true,
    }),
};
