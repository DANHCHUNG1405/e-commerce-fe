import { request } from "@/lib/api/client";
import type { Category } from "@/lib/api/types";
export const adminApi = {
  createCategory: (data: { name: string; slug: string; parentId: string | null }) => request<Category>({ url: "/admin/categories", method: "POST", data }),
  deleteReview: (id: string) => request<Record<string, never>>({ url: `/admin/reviews/${id}`, method: "DELETE" }),
};
