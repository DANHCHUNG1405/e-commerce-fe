"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shippingApi } from "../api/shipping.api";
import { useSessionStore } from "@/features/auth/store/session.store";
import { Button, LoginRequired, Notice, Page } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { formatVnd } from "@/lib/format";
import type { Shipment } from "@/lib/api/types";

const nextStatus: Record<string, string[]> = {
  assigned: ["accepted"],
  accepted: ["picked_up"],
  picked_up: ["delivering"],
  delivering: ["delivered", "failed"],
  failed: ["delivering", "returned"],
};
export function DriverView() {
  const user = useSessionStore((s) => s.user);
  const cache = useQueryClient();
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const profile = useQuery({
    queryKey: ["driver-me", user?.id],
    queryFn: shippingApi.me,
    enabled: !!user,
    retry: false,
  });
  const approved = (profile.data?.Status ?? profile.data?.status) === "approved";
  const shipments = useQuery({
    queryKey: ["driver-shipments", page, status],
    queryFn: () => shippingApi.assigned(page, status || undefined),
    enabled: approved,
  });
  const apply = useMutation({
    mutationFn: () => shippingApi.apply(phone.trim(), plate.trim()),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["driver-me"] }),
  });
  if (!user)
    return (
      <Page title="Kênh tài xế">
        <LoginRequired />
      </Page>
    );
  return (
    <Page title="Kênh tài xế">
      {profile.isPending && <Notice>Đang tải hồ sơ…</Notice>}
      {profile.error && (profile.error as { status?: number }).status !== 404 && (
        <Notice error>{profile.error.message}</Notice>
      )}
      {profile.data ? (
        <Notice>Hồ sơ: {profile.data.Status ?? profile.data.status}</Notice>
      ) : (
        (profile.error as { status?: number } | null)?.status === 404 && (
          <form
            className="max-w-xl space-y-3 rounded-xl bg-white p-5"
            onSubmit={(e) => {
              e.preventDefault();
              apply.mutate();
            }}
          >
            <h2 className="font-semibold">Đăng ký tài xế</h2>
            <label className="block text-sm">
              Số điện thoại
              <input
                required
                minLength={8}
                maxLength={20}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Biển số xe
              <input
                required
                minLength={3}
                maxLength={30}
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
              />
            </label>
            <Button disabled={apply.isPending}>Gửi đăng ký</Button>
            {apply.error && <Notice error>{apply.error.message}</Notice>}
          </form>
        )
      )}
      {approved && (
        <>
          <label className="block max-w-xs text-sm">
            Trạng thái
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              {[
                "assigned",
                "accepted",
                "picked_up",
                "delivering",
                "failed",
                "returned",
                "delivered",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {shipments.error && <Notice error>{shipments.error.message}</Notice>}
          {shipments.data?.length === 0 && <Notice>Chưa có vận đơn.</Notice>}
          <div className="mt-4 grid gap-4">
            {shipments.data?.map((s) => (
              <DriverShipment key={s.id} shipment={s} />
            ))}
          </div>
          {shipments.data && (shipments.data.length > 0 || page > 1) && (
            <Pagination page={page} hasNext={shipments.data.length === 20} onChange={setPage} />
          )}
        </>
      )}
    </Page>
  );
}
function DriverShipment({ shipment: s }: { shipment: Shipment }) {
  const cache = useQueryClient();
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [collected, setCollected] = useState(false);
  const [retry, setRetry] = useState<{ fingerprint: string; key: string } | null>(null);
  const change = useMutation({
    mutationFn: ({
      body,
      key,
    }: {
      body: { status: string; reason?: string; codCollected?: boolean };
      key: string;
    }) => shippingApi.update(s.id, body, key),
    onSuccess: () => {
      setRetry(null);
      setTarget("");
      cache.invalidateQueries({ queryKey: ["driver-shipments"] });
      cache.invalidateQueries({ queryKey: ["shipment", s.id] });
    },
  });
  const submit = () => {
    const body = {
      status: target,
      ...(target === "failed" ? { reason: reason.trim() } : {}),
      ...(target === "delivered" && s.codAmount > 0 ? { codCollected: collected } : {}),
    };
    const fingerprint = JSON.stringify(body);
    const key = retry?.fingerprint === fingerprint ? retry.key : crypto.randomUUID();
    setRetry({ fingerprint, key });
    change.mutate({ body, key });
  };
  return (
    <article className="rounded-xl border bg-white p-5">
      <h2 className="font-semibold">
        {s.Status} · {s.TrackingNumber || s.id}
      </h2>
      <p className="mt-1 break-all text-xs text-zinc-500">{s.id}</p>
      <p className="mt-2 text-sm">COD: {formatVnd(s.codAmount)}</p>
      <a href={`/shipments/${s.id}`} className="text-sm text-orange-600">
        Chi tiết và lịch sử
      </a>
      {(nextStatus[s.Status] ?? []).length > 0 && (
        <div className="mt-4 grid max-w-md gap-3">
          <label className="text-sm">
            Chuyển trạng thái
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Chọn trạng thái</option>
              {nextStatus[s.Status].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          {target === "failed" && (
            <label className="text-sm">
              Lý do
              <input
                maxLength={1000}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          )}
          {target === "delivered" && s.codAmount > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <input
                className="!w-auto"
                type="checkbox"
                checked={collected}
                onChange={(e) => setCollected(e.target.checked)}
              />
              Đã thu COD
            </label>
          )}
          <Button
            type="button"
            disabled={
              !target ||
              (target === "failed" && !reason.trim()) ||
              (target === "delivered" && s.codAmount > 0 && !collected) ||
              change.isPending
            }
            onClick={submit}
          >
            Cập nhật
          </Button>
          {change.error && <Notice error>{change.error.message}</Notice>}
        </div>
      )}
    </article>
  );
}
export function ShipmentDetailView({ id }: { id: string }) {
  const user = useSessionStore((s) => s.user);
  const [page, setPage] = useState(1);
  const detail = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => shippingApi.detail(id),
    enabled: !!user,
  });
  const events = useQuery({
    queryKey: ["shipment-events", id, page],
    queryFn: () => shippingApi.events(id, page),
    enabled: !!user,
  });
  if (!user)
    return (
      <Page title="Theo dõi vận đơn">
        <LoginRequired />
      </Page>
    );
  return (
    <Page title="Theo dõi vận đơn">
      {detail.error && <Notice error>{detail.error.message}</Notice>}
      {detail.data && (
        <section className="rounded-xl bg-white p-5">
          <h2 className="font-semibold">{detail.data.Status}</h2>
          <p className="break-all text-sm">Mã vận đơn: {detail.data.id}</p>
          <p className="text-sm">Đơn shop: {detail.data.SellerOrderID}</p>
          <p className="text-sm">Tài xế: {detail.data.driverId ?? "Chưa gán"}</p>
          <p className="text-sm">
            COD: {formatVnd(detail.data.codAmount)} ·{" "}
            {detail.data.codCollected ? "Đã thu" : "Chưa thu"} ·{" "}
            {detail.data.codSettled ? "Đã quyết toán" : "Chưa quyết toán"}
          </p>
        </section>
      )}
      <h2 className="mt-6 font-semibold">Lịch sử trạng thái</h2>
      {events.error && <Notice error>{events.error.message}</Notice>}
      {events.data?.map((e) => (
        <article key={e.id} className="mt-3 rounded-xl border bg-white p-4">
          <strong>{e.Status}</strong>
          <p className="text-sm">{e.Description}</p>
          <time className="text-xs text-zinc-500">
            {new Date(e.CreatedAt).toLocaleString("vi-VN")}
          </time>
        </article>
      ))}
      {events.data && (events.data.length > 0 || page > 1) && (
        <Pagination page={page} hasNext={events.data.length === 20} onChange={setPage} />
      )}
    </Page>
  );
}
