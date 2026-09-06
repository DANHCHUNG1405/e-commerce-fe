import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { useSessionStore } from "@/features/auth/store/session.store";
import type { Envelope, TokenPair } from "./types";

interface RetryConfig extends InternalAxiosRequestConfig { _retry?: boolean; skipAuthRefresh?: boolean }

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "ApiError"; }
}

export const apiClient = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/v1", headers: { Accept: "application/json", "Content-Type": "application/json" } });
let refreshPromise: Promise<TokenPair> | null = null;

apiClient.interceptors.request.use((config) => {
  const accessToken = useSessionStore.getState().tokens?.accessToken;
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<Envelope<Record<string, never>>>) => {
    const config = error.config as RetryConfig | undefined;
    const publicRequest = (config?.url?.startsWith("/auth/") && config.url !== "/auth/me") || config?.url?.startsWith("/products") || config?.url?.startsWith("/categories");
    if (error.response?.status === 401 && config && !publicRequest && !config._retry && !config.skipAuthRefresh && useSessionStore.getState().tokens?.refreshToken) {
      config._retry = true;
      try {
        if (!refreshPromise) {
          const refreshToken = useSessionStore.getState().tokens!.refreshToken;
          refreshPromise = apiClient.post<Envelope<TokenPair>>("/auth/refresh", { refreshToken }, { skipAuthRefresh: true } as RetryConfig).then(({ data }) => {
            if (useSessionStore.getState().tokens?.refreshToken !== refreshToken) throw new ApiError(401, "Phiên đăng nhập đã thay đổi");
            useSessionStore.getState().setTokens(data.data.content);
            return data.data.content;
          }).finally(() => { refreshPromise = null; });
        }
        const tokens = await refreshPromise;
        if (useSessionStore.getState().tokens?.accessToken !== tokens.accessToken) throw new ApiError(401, "Phiên đăng nhập đã kết thúc");
        config.headers.set("Authorization", `Bearer ${tokens.accessToken}`);
        return apiClient(config);
      } catch { useSessionStore.getState().clearSession(); }
    }
    return Promise.reject(new ApiError(error.response?.status ?? 0, error.response?.data?.data?.msg || error.message || "Network error"));
  },
);

export async function request<T>(config: AxiosRequestConfig & { skipAuthRefresh?: boolean }): Promise<T> {
  const { data } = await apiClient.request<Envelope<T>>(config);
  return data.data.content;
}
