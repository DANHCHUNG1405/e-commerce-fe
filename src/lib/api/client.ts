import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { useSessionStore } from "@/features/auth/store/session.store";
import type { Envelope, TokenPair } from "./types";
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
  timeout: 20000,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});
let refreshPromise: Promise<TokenPair> | null = null;
export function refreshSession(): Promise<TokenPair> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = useSessionStore.getState().tokens?.refreshToken;
  if (!refreshToken) return Promise.reject(new ApiError(401, "Vui lòng đăng nhập lại"));
  refreshPromise = apiClient
    .post<Envelope<TokenPair>>("/auth/refresh", { refreshToken }, {
      skipAuthRefresh: true,
    } as RetryConfig)
    .then(({ data }) => {
      if (useSessionStore.getState().tokens?.refreshToken !== refreshToken)
        throw new ApiError(401, "Phiên đăng nhập đã thay đổi");
      useSessionStore.getState().setTokens(data.data.content);
      return data.data.content;
    })
    .catch((error) => {
      if (useSessionStore.getState().tokens?.refreshToken === refreshToken)
        useSessionStore.getState().clearSession();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}
apiClient.interceptors.request.use((config) => {
  const token = useSessionStore.getState().tokens?.accessToken;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<Envelope<Record<string, never>>>) => {
    const config = error.config as RetryConfig | undefined;
    const path = config?.url ?? "";
    const publicRequest =
      /^\/auth\/(login|register|refresh|logout|forgot-password|reset-password)$/.test(path) ||
      ((config?.method ?? "get") === "get" &&
        (/^\/(products|categories|vouchers)(\/|$)/.test(path) ||
          /^\/sellers\/[^/]+\/vouchers$/.test(path)));
    if (
      error.response?.status === 401 &&
      config &&
      !publicRequest &&
      !config._retry &&
      !config.skipAuthRefresh &&
      useSessionStore.getState().tokens
    ) {
      config._retry = true;
      const sentToken = String(config.headers.get("Authorization") ?? "");
      const current = useSessionStore.getState().tokens!;
      const tokens =
        sentToken !== `Bearer ${current.accessToken}` ? current : await refreshSession();
      config.headers.set("Authorization", `Bearer ${tokens.accessToken}`);
      return apiClient(config);
    }
    return Promise.reject(
      new ApiError(
        error.response?.status ?? 0,
        error.response?.data?.data?.msg || error.message || "Không thể kết nối",
      ),
    );
  },
);
export async function request<T>(
  config: AxiosRequestConfig & { skipAuthRefresh?: boolean },
): Promise<T> {
  const { data } = await apiClient.request<Envelope<T>>(config);
  if (data.error) throw new ApiError(data.statusCode, data.data.msg);
  return data.data.content;
}
