import { request } from "@/lib/api/client";
import type { Address, Order, OrderDetail, PageParams, UUID, WishlistItem } from "@/lib/api/types";
export interface AddressInput { recipientName: string; phone: string; addressLine: string; ward: string; district: string; province: string; country: string; postalCode?: string }
const listQuery = (params: PageParams) => `?page=${params.page ?? 1}&limit=${params.limit ?? 20}`;
export const accountApi = {
  updateProfile: (fullName: string) => request<Record<string, never>>({ url: "/users/me", method: "PATCH", data: { fullName } }),
  addresses: () => request<Address[]>({ url: "/users/me/addresses" }), createAddress: (body: AddressInput) => request<Address>({ url: "/users/me/addresses", method: "POST", data: body }), updateAddress: (id: UUID, body: AddressInput) => request<Address>({ url: `/users/me/addresses/${id}`, method: "PUT", data: body }), deleteAddress: (id: UUID) => request<Record<string, never>>({ url: `/users/me/addresses/${id}`, method: "DELETE" }),
  wishlist: (params: PageParams = {}) => request<WishlistItem[]>({ url: `/wishlist${listQuery(params)}` }), addWishlist: (product: UUID) => request<Record<string, never>>({ url: `/wishlist/items/${product}`, method: "PUT" }), removeWishlist: (product: UUID) => request<Record<string, never>>({ url: `/wishlist/items/${product}`, method: "DELETE" }),
  orders: (params: PageParams = {}) => request<Order[]>({ url: `/orders${listQuery(params)}` }), order: (id: UUID) => request<OrderDetail>({ url: `/orders/${id}` }), cancelOrder: (id: UUID) => request<Record<string, never>>({ url: `/orders/${id}/cancel`, method: "POST" }), checkout: (addressId: UUID, idempotencyKey: string) => request<Order>({ url: "/orders", method: "POST", data: { addressId, method: "cod" }, headers: { "Idempotency-Key": idempotencyKey } }),
};
