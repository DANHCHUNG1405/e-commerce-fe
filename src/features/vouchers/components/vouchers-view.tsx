"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Ticket, ArrowRight, Clock3, ShieldCheck, ShoppingBag } from "lucide-react";
import { vouchersApi, type Voucher } from "../api/vouchers.api";
import { Button, Notice, Page, EmptyState } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { formatVnd } from "@/lib/format";

function VoucherCard({ voucher: v }: { voucher: Voucher }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(v.Code);
      setCopied(true);
      setCopyError(false);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };
  return (
    <article className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-orange-300 hover:shadow-md">
      <div className="flex">
        <div className="relative flex w-24 shrink-0 flex-col items-center justify-center gap-3 border-r border-dashed border-orange-200 bg-orange-50 px-3 text-orange-600 sm:w-32">
          <Ticket size={34} strokeWidth={1.5} />
          <span className="text-center text-[10px] font-bold uppercase tracking-widest">
            {v.rules.some((r) => r.SellerID) ? "Voucher shop" : "Nova voucher"}
          </span>
        </div>
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            Giảm {v.Type === "percent" ? `${v.Value}%` : formatVnd(v.Value)}
          </h2>
          {v.Type === "percent" && (
            <p className="mt-1 text-sm text-zinc-600">Tối đa {formatVnd(v.MaxDiscount)}</p>
          )}
          {v.rules.map((r) => (
            <p className="mt-1 text-xs leading-5 text-zinc-500" key={r.id}>
              Đơn từ {formatVnd(r.MinOrder)}
              {r.SellerID ? " tại shop áp dụng" : ""}
            </p>
          ))}
          <div className="mt-4 flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2">
            <span className="min-w-0 select-all break-all font-mono text-sm font-semibold tracking-wider">
              {v.Code}
            </span>
            <button
              type="button"
              onClick={copy}
              aria-label={`Sao chép mã ${v.Code}`}
              className="shrink-0 rounded-md p-2 text-orange-600 hover:bg-orange-100"
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
          </div>
          <span role="status" className="text-xs text-orange-700">
            {copied ? "Đã sao chép mã" : copyError ? "Chọn mã bên trên để sao chép thủ công." : ""}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Clock3 size={13} />
          HSD: {new Date(v.EndsAt).toLocaleDateString("vi-VN")}
        </p>
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#ee4d2d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d83e20]"
          href={`/cart?coupon=${encodeURIComponent(v.Code)}`}
        >
          Dùng ngay
          <ArrowRight size={14} />
        </Link>
      </div>
      <details className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500">
        <summary className="cursor-pointer font-medium text-zinc-600">Điều kiện sử dụng</summary>
        <ul className="mt-3 list-disc space-y-2 pl-4 leading-5">
          <li>Mỗi tài khoản dùng mã tối đa một lần. Mỗi đơn áp dụng một mã.</li>
          <li>Hiệu lực đến {new Date(v.EndsAt).toLocaleString("vi-VN")}.</li>
          <li>
            Điều kiện và lượt sử dụng được kiểm tra khi đặt hàng. Hủy đơn không hoàn lại lượt
            voucher.
          </li>
        </ul>
      </details>
    </article>
  );
}
export function VouchersView({ seller }: { seller?: string }) {
  const [page, setPage] = useState(1);
  const vouchers = useQuery({
    queryKey: ["vouchers", seller, page],
    queryFn: () => vouchersApi.list(page, seller),
    retry: false,
  });
  return (
    <Page
      title={seller ? "Voucher của shop" : "Ưu đãi cho giỏ hàng của bạn"}
      description="Chọn mã phù hợp, thêm vào giỏ và tận hưởng niềm vui mua sắm."
      action={
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-orange-600"
          href="/cart"
        >
          <ShoppingBag size={17} />
          Đến giỏ hàng
          <ArrowRight size={16} />
        </Link>
      }
    >
      <section className="mb-7 grid overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-white md:grid-cols-[1.3fr_1fr]">
        <div className="p-6 sm:p-8">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-orange-600">
            <Ticket size={14} />
            Kho voucher Nova
          </span>
          <h2 className="text-2xl font-semibold tracking-tight">
            Mua món bạn thích.
            <br />
            <span className="text-orange-600">Tiết kiệm thêm một chút.</span>
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
            Mã ưu đãi đang có sẵn từ cửa hàng. Kiểm tra điều kiện để chọn ưu đãi phù hợp với đơn
            mua.
          </p>
        </div>
        <ol className="flex flex-col justify-center gap-4 border-t border-orange-100 p-6 md:border-l md:border-t-0">
          {[
            "Chọn voucher phù hợp",
            "Áp dụng vào sản phẩm đã chọn",
            "Xem mức giảm trước khi đặt hàng",
          ].map((step, i) => (
            <li key={step} className="flex items-center gap-3 text-sm text-zinc-600">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Voucher đang áp dụng</h2>
        <p className="flex items-center gap-1.5 text-xs text-zinc-500">
          <ShieldCheck size={14} />
          Một mã cho mỗi đơn hàng
        </p>
      </div>
      {vouchers.isPending && (
        <div role="status" aria-label="Đang tải voucher" className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="flex h-56 animate-pulse gap-5 rounded-xl border border-zinc-200 bg-white p-5 motion-reduce:animate-none"
            >
              <div className="w-24 rounded-lg bg-orange-50" />
              <div className="flex-1 space-y-5 py-3">
                <div className="h-5 w-3/4 rounded bg-zinc-100" />
                <div className="h-3 w-1/2 rounded bg-zinc-100" />
                <div className="h-10 rounded bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      )}
      {vouchers.error && (
        <EmptyState
          title="Chưa thể tải voucher"
          description="Kết nối có thể đang gián đoạn. Thử tải lại để xem những mã đang áp dụng."
          action={
            <Button disabled={vouchers.isFetching} onClick={() => vouchers.refetch()}>
              Tải lại
            </Button>
          }
        />
      )}
      {vouchers.data?.length === 0 && (
        <EmptyState
          title="Chưa có voucher tại đây"
          description="Bạn có thể tiếp tục khám phá sản phẩm và quay lại xem ưu đãi sau."
          action={
            <Link className="font-medium text-orange-600" href="/products">
              Khám phá sản phẩm →
            </Link>
          }
        />
      )}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {vouchers.data?.map((v) => (
          <VoucherCard key={v.id} voucher={v} />
        ))}
      </div>
      {vouchers.data && (vouchers.data.length > 0 || page > 1) && (
        <Pagination
          page={page}
          hasNext={vouchers.data.length === 20}
          busy={vouchers.isFetching}
          onChange={setPage}
        />
      )}
      <Notice>
        Voucher hiển thị có thể chưa phù hợp với giỏ hàng của bạn. Mức giảm chính thức sẽ được xác
        nhận khi đặt đơn.
      </Notice>
    </Page>
  );
}
