"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "../api/cart.api";
import { accountApi } from "@/features/account/api/account.api";
import { createCheckoutAttempt } from "@/features/checkout/lib/attempt";
import { checkoutApi, type CheckoutInput } from "@/features/checkout/api/checkout.api";
import { vouchersApi } from "@/features/vouchers/api/vouchers.api";
import { ApiError } from "@/lib/api/client";
import { formatVnd } from "@/lib/format";
import { AddressForm } from "@/features/account/components/addresses";
import { useSessionStore } from "@/features/auth/store/session.store";
import { Button, Notice, Page, LoginRequired } from "@/components/ui";

type Attempt = { key: string; payload: CheckoutInput };
export function CartView({ initialCoupon = "" }: { initialCoupon?: string }) {
  const user = useSessionStore((s) => s.user);
  return (
    <Page title="Giỏ hàng của bạn">
      {user ? (
        <BuyerCart key={user.id} userId={user.id} initialCoupon={initialCoupon} />
      ) : (
        <LoginRequired />
      )}
    </Page>
  );
}
function BuyerCart({ userId, initialCoupon }: { userId: string; initialCoupon: string }) {
  const cache = useQueryClient();
  const router = useRouter();
  const storageKey = `checkout-attempt:${userId}`;
  const [attempt, setAttempt] = useState<Attempt | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
    } catch {
      return null;
    }
  });
  const submitting = useRef(false);
  const [addressId, setAddressId] = useState("");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [coupon, setCoupon] = useState(initialCoupon);
  const [code, setCode] = useState(initialCoupon);
  const [method, setMethod] = useState<"cod" | "sepay">("cod");
  const cart = useQuery({ queryKey: ["cart", userId], queryFn: cartApi.list });
  const addresses = useQuery({ queryKey: ["addresses", userId], queryFn: accountApi.addresses });
  const selected = (cart.data ?? []).filter((i) => !excluded.includes(i.VariantID));
  const ids = selected.map((i) => i.VariantID).sort();
  const update = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      quantity === 0 ? cartApi.removeItem(id) : cartApi.setItem(id, quantity),
    onSettled: () => cache.invalidateQueries({ queryKey: ["cart"] }),
  });
  const preview = useQuery({
    queryKey: ["voucher-preview", userId, code, selected.map((i) => [i.VariantID, i.Quantity])],
    queryFn: ({ signal }) => vouchersApi.preview(code, ids, signal),
    enabled: !!code && ids.length > 0 && !update.isPending && !cart.isFetching && !attempt,
    retry: false,
    staleTime: 0,
  });
  const previewData =
    code &&
    ids.length &&
    !preview.isFetching &&
    !preview.isError &&
    !update.isPending &&
    !cart.isFetching
      ? preview.data
      : undefined;
  const actualMethod = previewData?.total === 0 ? "cod" : method;
  const checkout = useMutation({
    mutationFn: (value: Attempt) => checkoutApi.create(value.payload, value.key),
    retry: false,
    onSuccess: (order) => {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
      setAttempt(null);
      void cache.invalidateQueries({ queryKey: ["cart"] });
      void cache.invalidateQueries({ queryKey: ["orders"] });
      router.push(`/orders/${order.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void cart.refetch();
        void preview.refetch();
      }
    },
    onSettled: () => {
      submitting.current = false;
    },
  });
  const placeOrder = () => {
    if (submitting.current) return;
    submitting.current = true;
    const next =
      attempt ??
      createCheckoutAttempt(
        { addressId, method: actualMethod, variantIds: ids, ...(code ? { couponCode: code } : {}) },
        crypto.randomUUID(),
      );
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* The attempt remains in memory if browser storage is unavailable. */
    }
    setAttempt(next);
    checkout.mutate(next);
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <section>
        {cart.isPending && <Notice>Đang tải giỏ hàng…</Notice>}
        {cart.error && <Notice error>{cart.error.message}</Notice>}
        {cart.data?.length === 0 && (
          <Notice>
            Giỏ hàng trống.{" "}
            <Link href="/products" className="underline">
              Mua sắm ngay
            </Link>
          </Notice>
        )}
        {!!cart.data?.length && (
          <label className="mb-4 flex items-center gap-3 bg-white p-4">
            <input
              className="!w-auto"
              type="checkbox"
              disabled={!!attempt}
              checked={selected.length === cart.data.length}
              onChange={(e) =>
                setExcluded(e.target.checked ? [] : cart.data!.map((i) => i.VariantID))
              }
            />
            Chọn tất cả ({selected.length})
          </label>
        )}
        {cart.data?.map((item) => (
          <div key={item.id} className="mb-4 border border-zinc-200 bg-white p-5">
            <label className="mb-3 flex items-start gap-3 break-all text-sm">
              <input
                className="!w-auto"
                type="checkbox"
                disabled={!!attempt}
                checked={!excluded.includes(item.VariantID)}
                onChange={(e) =>
                  setExcluded((current) =>
                    e.target.checked
                      ? current.filter((id) => id !== item.VariantID)
                      : [...current, item.VariantID],
                  )
                }
              />
              Phiên bản {item.VariantID}
            </label>
            <div className="flex items-center gap-3">
              <Button
                aria-label="Giảm số lượng"
                disabled={!!attempt || update.isPending || item.Quantity <= 1}
                onClick={() => update.mutate({ id: item.VariantID, quantity: item.Quantity - 1 })}
              >
                −
              </Button>
              <span>{item.Quantity}</span>
              <Button
                aria-label="Tăng số lượng"
                disabled={!!attempt || update.isPending || item.Quantity >= 10000}
                onClick={() => update.mutate({ id: item.VariantID, quantity: item.Quantity + 1 })}
              >
                +
              </Button>
              <button
                disabled={!!attempt || update.isPending}
                className="ml-auto text-sm text-red-600"
                onClick={() => update.mutate({ id: item.VariantID, quantity: 0 })}
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
        {update.error && <Notice error>{update.error.message}</Notice>}
        <Notice>
          Giỏ hàng hiện chưa cung cấp tên và giá sản phẩm. Tổng tiền chính thức được xác nhận trên
          đơn hàng.
        </Notice>
        <AddressForm />
      </section>
      <aside className="h-fit space-y-5 border border-zinc-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Đặt hàng</h2>
        <label className="block text-sm">
          Địa chỉ nhận hàng
          <select
            className="mt-2"
            disabled={!!attempt}
            value={attempt?.payload.addressId ?? addressId}
            onChange={(e) => setAddressId(e.target.value)}
          >
            <option value="">Chọn địa chỉ</option>
            {addresses.data?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.RecipientName} · {a.AddressLine}, {a.Province}
              </option>
            ))}
          </select>
        </label>
        {addresses.error && <Notice error>{addresses.error.message}</Notice>}
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setCode(coupon.trim().toUpperCase());
          }}
        >
          <label className="block text-sm">
            Mã voucher
            <input
              className="mt-2"
              maxLength={40}
              disabled={!!attempt}
              value={coupon}
              onChange={(e) => {
                setCoupon(e.target.value);
                setCode("");
              }}
            />
          </label>
          <div className="flex items-center gap-3">
            <Button disabled={!!attempt || !ids.length || update.isPending}>Áp dụng</Button>
            <Link href="/vouchers" className="text-sm text-orange-600">
              Xem voucher
            </Link>
          </div>
        </form>
        {!attempt && code && preview.isFetching && <Notice>Đang kiểm tra voucher…</Notice>}
        {!attempt && code && preview.error && (
          <Notice error>{preview.error.message}. Hãy chọn lại mã hoặc bỏ mã để tiếp tục.</Notice>
        )}
        {previewData && !attempt && (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Tạm tính</dt>
              <dd>{formatVnd(previewData.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-orange-600">
              <dt>Giảm giá</dt>
              <dd>−{formatVnd(previewData.discount)}</dd>
            </div>
            <div className="flex justify-between font-bold">
              <dt>Sau giảm (chưa phí ship)</dt>
              <dd>{formatVnd(previewData.total)}</dd>
            </div>
          </dl>
        )}
        <label className="block text-sm">
          Thanh toán
          <select
            className="mt-2"
            disabled={!!attempt || previewData?.total === 0}
            value={attempt?.payload.method ?? actualMethod}
            onChange={(e) => setMethod(e.target.value as "cod" | "sepay")}
          >
            <option value="cod">Khi nhận hàng (COD)</option>
            <option value="sepay">Chuyển khoản QR SePay</option>
          </select>
        </label>
        {previewData?.total === 0 && <Notice>Đơn có tổng bằng 0 sử dụng COD.</Notice>}
        {attempt && (
          <Notice>
            Lần đặt hàng đang chờ kết quả. Thử lại sẽ giữ nguyên lựa chọn, mã voucher và phương thức
            thanh toán.
          </Notice>
        )}
        <Button
          className="w-full"
          disabled={
            checkout.isPending ||
            (!attempt &&
              (!addressId ||
                !ids.length ||
                update.isPending ||
                cart.isFetching ||
                !!cart.error ||
                (!!code && !previewData)))
          }
          onClick={placeOrder}
        >
          {checkout.isPending
            ? "Đang đặt hàng…"
            : attempt
              ? "Thử lại lần đặt hàng này"
              : `Đặt ${ids.length} phiên bản đã chọn`}
        </Button>
        {checkout.error && <Notice error>{checkout.error.message}</Notice>}
        {attempt && !checkout.isPending && (
          <>
            <Link className="block text-sm text-orange-600 underline" href="/orders">
              Kiểm tra lịch sử đơn hàng
            </Link>
            <button
              className="text-sm underline"
              onClick={() => {
                if (
                  window.confirm(
                    "Chỉ tạo lần đặt mới sau khi đã kiểm tra lịch sử và chắc chắn lần cũ chưa tạo đơn. Tiếp tục?",
                  )
                ) {
                  sessionStorage.removeItem(storageKey);
                  setAttempt(null);
                  checkout.reset();
                }
              }}
            >
              Điều chỉnh và tạo lần đặt mới
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
