import { request } from "@/lib/api/client";
import type { AuthResult, TokenPair, User } from "@/lib/api/types";
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
};
