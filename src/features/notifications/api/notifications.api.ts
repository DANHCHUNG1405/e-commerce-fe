import { request } from "@/lib/api/client";
import type { Notification } from "@/lib/api/types";

export const notificationsApi = {
  list: (page = 1) =>
    request<Notification[]>({ url: "/notifications", params: { page, limit: 20 } }),
  unreadCount: () => request<{ count: number }>({ url: "/notifications/unread-count" }),
  read: (id: string) =>
    request<Record<string, never>>({ url: `/notifications/${id}/read`, method: "PATCH" }),
  readAll: () =>
    request<Record<string, never>>({ url: "/notifications/read-all", method: "PATCH" }),
};
