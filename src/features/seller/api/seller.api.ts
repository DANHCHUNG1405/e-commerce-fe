import { request } from "@/lib/api/client";
import type {
  InventoryMovement,
  PickupAddress,
  Product,
  ProductDetail,
  Seller,
  SellerMember,
  SellerOrder,
  SellerOrderDetail,
  SellerStats,
  UUID,
} from "@/lib/api/types";
export const sellerApi = {
  create: (body: { name: string; slug: string }) =>
    request<Seller>({ url: "/sellers", method: "POST", data: body }),
  mine: () => request<Seller[]>({ url: "/users/me/sellers" }),
  publicProfile: (seller: UUID) => request<Seller>({ url: `/sellers/${seller}` }),
  profile: (seller: UUID) => request<Seller>({ url: `/sellers/${seller}/profile` }),
  updateProfile: (
    seller: UUID,
    body: { name: string; description: string; pickupAddress: PickupAddress },
  ) =>
    request<Record<string, never>>({
      url: `/sellers/${seller}/profile`,
      method: "PUT",
      data: body,
    }),
  members: (seller: UUID, page = 1) =>
    request<SellerMember[]>({ url: `/sellers/${seller}/members`, params: { page, limit: 20 } }),
  updateMember: (seller: UUID, user: UUID, role: "manager" | "staff") =>
    request<Record<string, never>>({
      url: `/sellers/${seller}/members/${user}`,
      method: "PUT",
      data: { role },
    }),
  removeMember: (seller: UUID, user: UUID) =>
    request<Record<string, never>>({ url: `/sellers/${seller}/members/${user}`, method: "DELETE" }),
  dashboard: (seller: UUID) => request<SellerStats>({ url: `/sellers/${seller}/dashboard` }),
  products: (seller: UUID, page = 1, status?: Product["Status"]) =>
    request<Product[]>({ url: `/sellers/${seller}/products`, params: { page, limit: 20, status } }),
  product: (seller: UUID, product: UUID) =>
    request<ProductDetail>({ url: `/sellers/${seller}/products/${product}` }),
  updateVariant: (
    seller: UUID,
    product: UUID,
    variant: UUID,
    body: { sku: string; name: string; price: number; attributes: Record<string, unknown> },
  ) =>
    request<Record<string, never>>({
      url: `/sellers/${seller}/products/${product}/variants/${variant}`,
      method: "PUT",
      data: body,
    }),
  inventory: (seller: UUID, variant: UUID, page = 1) =>
    request<InventoryMovement[]>({
      url: `/sellers/${seller}/variants/${variant}/inventory`,
      params: { page, limit: 20 },
    }),
  order: (seller: UUID, id: UUID) =>
    request<SellerOrderDetail>({ url: `/sellers/${seller}/orders/${id}` }),
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
