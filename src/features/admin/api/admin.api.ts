import { request } from "@/lib/api/client";
import type {
  AdminSeller,
  AdminStats,
  Category,
  DriverProfile,
  PaymentWebhookReceipt,
  Review,
  Shipment,
} from "@/lib/api/types";
import type { Voucher } from "@/features/vouchers/api/vouchers.api";
export const adminApi = {
  dashboard: () => request<AdminStats>({ url: "/admin/dashboard" }),
  sellers: (page = 1, status?: AdminSeller["Status"]) =>
    request<AdminSeller[]>({ url: "/admin/sellers", params: { page, limit: 20, status } }),
  vouchers: (page = 1) =>
    request<Voucher[]>({ url: "/admin/vouchers", params: { page, limit: 20 } }),
  receipts: (page = 1, status?: string) =>
    request<PaymentWebhookReceipt[]>({
      url: "/admin/payments/sepay/receipts",
      params: { page, limit: 20, status },
    }),
  drivers: (page = 1, status?: string) =>
    request<DriverProfile[]>({ url: "/admin/drivers", params: { page, limit: 20, status } }),
  updateDriver: (id: string, status: "approved" | "rejected" | "suspended") =>
    request<Record<string, never>>({
      url: `/admin/drivers/${id}/status`,
      method: "PATCH",
      data: { status },
    }),
  shipments: (page = 1, status?: string) =>
    request<Shipment[]>({ url: "/admin/shipments", params: { page, limit: 20, status } }),
  assignDriver: (id: string, driverId: string) =>
    request<Record<string, never>>({
      url: `/admin/shipments/${id}/driver`,
      method: "PUT",
      data: { driverId },
    }),
  settleCod: (id: string) =>
    request<Record<string, never>>({ url: `/admin/shipments/${id}/settle-cod`, method: "POST" }),
  reviews: (page = 1, status?: string, productId?: string) =>
    request<Review[]>({ url: "/admin/reviews", params: { page, limit: 20, status, productId } }),
  createCategory: (data: { name: string; slug: string; parentId: string | null }) =>
    request<Category>({ url: "/admin/categories", method: "POST", data }),
  deleteReview: (id: string) =>
    request<Record<string, never>>({ url: `/admin/reviews/${id}`, method: "DELETE" }),
};
