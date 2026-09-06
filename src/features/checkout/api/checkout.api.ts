import { request } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";
export interface CheckoutInput {
  addressId: string;
  method: "cod" | "sepay";
  variantIds: string[];
  couponCode?: string;
}
export interface PaymentInstructions {
  paymentId: string;
  status: "pending" | "paid" | "cancelled";
  amount: number;
  currency: string;
  bank?: string;
  accountNumber?: string;
  transferContent?: string;
  qrUrl?: string;
}
export const checkoutApi = {
  create: (data: CheckoutInput, key: string) =>
    request<Order>({ url: "/orders", method: "POST", data, headers: { "Idempotency-Key": key } }),
  payment: (id: string, signal?: AbortSignal) =>
    request<PaymentInstructions>({ url: `/orders/${id}/payment`, signal }),
};
