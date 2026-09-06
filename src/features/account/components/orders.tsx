"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountApi } from "../api/account.api";
import { useSessionStore } from "@/features/auth/store/session.store";
import { Button, Notice, Page, LoginRequired } from "@/components/ui";
import { formatVnd } from "@/lib/format";
const statuses = { pending: "Chờ xác nhận", processing: "Đang xử lý", delivered: "Đã giao", cancelled: "Đã hủy" };
export function OrdersView() {
  const user = useSessionStore(s => s.user); const [page, setPage] = useState(1);
  const orders = useQuery({ queryKey: ["orders", user?.id, page], queryFn: () => accountApi.orders({ page, limit: 20 }), enabled: !!user });
  return <Page title="Đơn hàng của tôi">{!user ? <LoginRequired/> : <>{orders.isPending && <Notice>Đang tải…</Notice>}{orders.error && <Notice error>{orders.error.message}</Notice>}{orders.data?.length === 0 && <Notice>Bạn chưa có đơn hàng ở trang này.</Notice>}<div className="space-y-4">{orders.data?.map(o => <Link href={`/orders/${o.id}`} key={o.id} className="flex flex-wrap justify-between gap-4 rounded-sm border border-zinc-200 bg-white p-6 hover:bg-zinc-50"><div><p className="font-semibold">Đơn #{o.id.slice(0, 8)}</p><p className="mt-2 text-sm text-zinc-500">{new Date(o.CreatedAt).toLocaleString("vi-VN")}</p></div><div className="text-right"><p className="font-semibold">{formatVnd(o.Total)}</p><p className="mt-2 text-sm text-[#ee4d2d]">{statuses[o.Status]}</p></div></Link>)}</div><div className="mt-6 flex gap-4"><Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</Button><Button disabled={orders.data?.length !== 20} onClick={() => setPage(p => p + 1)}>Tiếp</Button></div></>}</Page>;
}
export function OrderView({ id }: { id: string }) {
  const user = useSessionStore(s => s.user); const cache = useQueryClient();
  const detail = useQuery({ queryKey: ["order", user?.id, id], queryFn: () => accountApi.order(id), enabled: !!user });
  const cancel = useMutation({ mutationFn: () => accountApi.cancelOrder(id), onSettled: () => { void detail.refetch(); void cache.invalidateQueries({ queryKey: ["orders"] }); } });
  const data = detail.data; const address = data?.order.AddressSnapshot;
  return <Page title={`Đơn hàng #${id.slice(0, 8)}`}>{!user ? <LoginRequired/> : <>{detail.isPending && <Notice>Đang tải…</Notice>}{detail.error && <Notice error>{detail.error.message}</Notice>}{data && <div className="grid gap-8 md:grid-cols-[2fr_1fr]"><section><p className="mb-5 font-semibold text-[#ee4d2d]">{statuses[data.order.Status]}</p>{data.items.map(item => <article className="mb-3 rounded-sm border border-zinc-200 bg-white p-5" key={item.id}><h2 className="font-semibold">{item.ProductName}</h2><p className="mt-2 text-sm text-zinc-500">{item.VariantName} · {item.SKU} · Số lượng: {item.Quantity}</p><p className="mt-2">Đơn giá: {formatVnd(item.UnitPrice)}</p></article>)}{data.order.Status === "pending" && <Button disabled={cancel.isPending} onClick={() => { if (window.confirm("Bạn muốn hủy đơn hàng này?")) cancel.mutate(); }}>Hủy đơn hàng</Button>}{cancel.error && <Notice error>{cancel.error.message}</Notice>}</section><aside className="h-fit space-y-4 rounded-sm bg-zinc-50 p-6"><h2 className="font-semibold">Thông tin giao hàng</h2><p className="text-sm leading-6">{address?.RecipientName ?? "Không có thông tin"}<br/>{address?.Phone}<br/>{[address?.AddressLine, address?.Ward, address?.District, address?.Province].filter(Boolean).join(", ")}</p><hr className="border-zinc-200"/><p>Tổng cộng: <strong>{formatVnd(data.order.Total)}</strong></p><p className="text-sm text-zinc-500">COD · {data.payment.Status === "paid" ? "Đã thanh toán" : data.payment.Status === "cancelled" ? "Đã hủy" : "Chưa thanh toán"}</p></aside></div>}</>}</Page>;
}
