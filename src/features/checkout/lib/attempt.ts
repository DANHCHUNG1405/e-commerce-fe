import type { CheckoutInput } from "../api/checkout.api";
export interface CheckoutAttempt {
  key: string;
  payload: CheckoutInput;
}
export function createCheckoutAttempt(payload: CheckoutInput, key: string): CheckoutAttempt {
  if (!payload.addressId || !payload.variantIds.length)
    throw new Error("Chọn địa chỉ và ít nhất một sản phẩm");
  const variantIds = [...new Set(payload.variantIds)].sort();
  if (variantIds.length > 100) throw new Error("Tối đa 100 phiên bản");
  return {
    key,
    payload: {
      ...payload,
      variantIds,
      couponCode: payload.couponCode?.trim().toUpperCase() || undefined,
    },
  };
}
