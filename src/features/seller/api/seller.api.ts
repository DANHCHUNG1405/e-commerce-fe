import { request } from "@/lib/api/client";
import type { Seller, SellerOrder, UUID } from "@/lib/api/types";
export const sellerApi = {
  create: (body: { name: string; slug: string }) =>
    request<Seller>({ url: "/sellers", method: "POST", data: body }),
  mine: () => request<Seller[]>({ url: "/users/me/sellers" }),
  updateStatus: (seller: UUID, status: Seller["Status"]) =>
    request<Record<string, never>>({
      url: `/admin/sellers/${seller}/status`,
      method: "PATCH",
      data: { status },
    }),
  orders: (seller: UUID) => request<SellerOrder[]>({ url: `/sellers/${seller}/orders` }),
  updateOrderStatus: (
    seller: UUID,
    order: UUID,
    body: {
      status: "confirmed" | "shipping" | "delivered";
      carrier?: string;
      trackingNumber?: string;
    },
  ) =>
    request<Record<string, never>>({
      url: `/sellers/${seller}/orders/${order}/status`,
      method: "PATCH",
      data: body,
    }),
  changeInventory: (seller: UUID, variant: UUID, delta: number, note: string) =>
    request<Record<string, never>>({
      url: `/sellers/${seller}/variants/${variant}/inventory`,
      method: "POST",
      data: { delta, note },
    }),
};
