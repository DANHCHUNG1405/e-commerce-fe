"use client";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { checkoutApi } from "../api/checkout.api";
import { useSessionStore } from "@/features/auth/store/session.store";
import { Notice, Button } from "@/components/ui";
import { formatVnd } from "@/lib/format";
export function PaymentPanel({ id }: { id: string }) {
  const user = useSessionStore((s) => s.user);
  const payment = useQuery({
    queryKey: ["payment", user?.id, id],
    queryFn: ({ signal }) => checkoutApi.payment(id, signal),
    enabled: !!user,
    retry: false,
    refetchInterval: (q) => (q.state.error || q.state.data?.status !== "pending" ? false : 4000),
    refetchIntervalInBackground: false,
  });
  if (!user) return null;
  if (payment.error)
    return (
      <Notice error>
        {payment.error.message} <Button onClick={() => payment.refetch()}>Kiểm tra lại</Button>
      </Notice>
    );
  const data = payment.data;
  if (!data) return <Notice>Đang lấy thông tin thanh toán…</Notice>;
  if (data.status !== "pending")
    return (
      <Notice>
        {data.status === "paid"
          ? "Đã thanh toán thành công."
          : "Thanh toán đã hủy. Không chuyển khoản cho đơn này."}
      </Notice>
    );
  return (
    <section className="mt-6 space-y-4 border border-orange-200 bg-white p-5">
      <h2 className="font-semibold">Thanh toán chuyển khoản SePay</h2>
      {data.qrUrl && (
        <Image
          unoptimized
          src={data.qrUrl}
          width={240}
          height={240}
          alt="Mã QR thanh toán đơn hàng"
        />
      )}
      <dl className="space-y-2 break-words text-sm">
        <dt>Số tiền</dt>
        <dd className="font-bold text-orange-600">{formatVnd(data.amount)}</dd>
        <dt>Ngân hàng</dt>
        <dd>{data.bank}</dd>
        <dt>Số tài khoản</dt>
        <dd className="select-all font-semibold">{data.accountNumber}</dd>
        <dt>Nội dung chuyển khoản</dt>
        <dd className="select-all font-semibold">{data.transferContent}</dd>
      </dl>
      <p className="text-sm text-zinc-500">
        Chuyển đúng số tiền và nội dung trên. Trạng thái sẽ tự cập nhật khi thanh toán được xác
        nhận.
      </p>
    </section>
  );
}
