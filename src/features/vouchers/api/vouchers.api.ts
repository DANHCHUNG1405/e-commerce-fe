import { request } from "@/lib/api/client";
import type { BaseEntity } from "@/lib/api/types";
export interface Voucher extends BaseEntity {
  Active: boolean;
  MaxDiscount: number;
  Code: string;
  Type: "fixed" | "percent";
  Value: number;
  StartsAt: string;
  EndsAt: string;
  UsageLimit: number;
  UsedCount: number;
  rules: (BaseEntity & { CouponID: string; MinOrder: number; SellerID: string | null })[];
}
export interface VoucherPreview {
  discount: number;
  subtotal: number;
  total: number;
  couponCode: string;
}
export interface VoucherInput {
  code: string;
  type: "fixed" | "percent";
  value: number;
  maxDiscount: number;
  minOrder: number;
  usageLimit: number;
  startsAt: string;
  endsAt: string;
}
export const vouchersApi = {
  list: (page = 1, seller?: string) =>
    request<Voucher[]>({
      url: seller ? `/sellers/${seller}/vouchers` : "/vouchers",
      params: { page, limit: 20 },
    }),
  preview: (code: string, variantIds: string[], signal?: AbortSignal) =>
    request<VoucherPreview>({
      url: "/vouchers/preview",
      method: "POST",
      data: { code, variantIds },
      signal,
    }),
  create: (data: VoucherInput, seller?: string) =>
    request<Voucher>({
      url: seller ? `/sellers/${seller}/vouchers` : "/admin/vouchers",
      method: "POST",
      data,
    }),
  status: (id: string, active: boolean) =>
    request<Record<string, never>>({
      url: `/vouchers/${id}/status`,
      method: "PATCH",
      data: { active },
    }),
};
