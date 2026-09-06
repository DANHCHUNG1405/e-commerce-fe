import { request } from "@/lib/api/client";
import type { CartItem, UUID } from "@/lib/api/types";
export const cartApi = {
  list: () => request<CartItem[]>({ url: "/cart" }),
  setItem: (variant: UUID, quantity: number) =>
    request<Record<string, never>>({
      url: `/cart/items/${variant}`,
      method: "PUT",
      data: { quantity },
    }),
  removeItem: (variant: UUID) =>
    request<Record<string, never>>({ url: `/cart/items/${variant}`, method: "DELETE" }),
};
