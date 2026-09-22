"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/api/admin.api";
import { sellerApi } from "@/features/seller/api/seller.api";
import { shippingApi } from "@/features/shipping/api/shipping.api";
import { Button, Notice, Page } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { ManagementNav } from "./management-ui";
import { formatVnd } from "@/lib/format";
import type { PickupAddress } from "@/lib/api/types";
import { catalogApi } from "@/features/catalog/api/catalog.api";
import { useAccountAccess } from "@/features/auth/hooks/use-account-access";

const box = "rounded-xl border border-zinc-200 bg-white p-5";
function Feedback({ error, success }: { error?: Error | null; success?: boolean }) {
  return (
    <>
      {error && <Notice error>{error.message}</Notice>}
      {success && <Notice>Đã cập nhật.</Notice>}
    </>
  );
}
function ListPage({
  page,
  count,
  onChange,
}: {
  page: number;
  count: number;
  onChange: (v: number) => void;
}) {
  return (
    (count > 0 || page > 1) && <Pagination page={page} hasNext={count === 20} onChange={onChange} />
  );
}
export function AdminOperations({
  kind,
}: {
  kind: "drivers" | "shipments" | "receipts" | "vouchers" | "reviews";
}) {
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [productId, setProductId] = useState("");
  const [driverId, setDriverId] = useState("");
  const query = useQuery({
    queryKey: ["admin-operations", kind, page, status, productId],
    queryFn: async (): Promise<Record<string, unknown>[]> => {
      if (kind === "drivers")
        return (await adminApi.drivers(page, status || undefined)) as unknown as Record<
          string,
          unknown
        >[];
      if (kind === "shipments")
        return (await adminApi.shipments(page, status || undefined)) as unknown as Record<
          string,
          unknown
        >[];
      if (kind === "receipts")
        return (await adminApi.receipts(page, status || undefined)) as unknown as Record<
          string,
          unknown
        >[];
      if (kind === "vouchers")
        return (await adminApi.vouchers(page)) as unknown as Record<string, unknown>[];
      return (await adminApi.reviews(
        page,
        status || undefined,
        productId || undefined,
      )) as unknown as Record<string, unknown>[];
    },
  });
  const change = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      if (kind === "drivers")
        return adminApi.updateDriver(id, action as "approved" | "rejected" | "suspended");
      if (kind === "shipments" && action === "assign")
        return adminApi.assignDriver(id, driverId.trim());
      if (kind === "shipments") return adminApi.settleCod(id);
      return adminApi.deleteReview(id);
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: ["admin-operations", kind] }),
  });
  const title = {
    drivers: "Hồ sơ tài xế",
    shipments: "Vận đơn nội bộ",
    receipts: "Biên nhận SePay",
    vouchers: "Voucher sàn",
    reviews: "Đánh giá",
  }[kind];
  const statuses =
    kind === "drivers"
      ? ["pending", "approved", "rejected", "suspended"]
      : kind === "shipments"
        ? [
            "pending",
            "assigned",
            "accepted",
            "picked_up",
            "delivering",
            "failed",
            "returned",
            "delivered",
          ]
        : kind === "receipts"
          ? ["unmatched", "ignored", "requires_review", "applied"]
          : ["published", "hidden"];
  return (
    <Page title={title}>
      <ManagementNav kind="admin" />
      {kind !== "vouchers" && (
        <div className="mb-5 flex flex-wrap gap-3">
          <label className="text-sm">
            Trạng thái
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {kind === "reviews" && (
            <label className="text-sm">
              Product UUID
              <input
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setPage(1);
                }}
              />
            </label>
          )}
        </div>
      )}
      {kind === "shipments" && (
        <label className="mb-4 block max-w-md text-sm">
          UUID tài xế đã duyệt
          <input value={driverId} onChange={(e) => setDriverId(e.target.value)} />
        </label>
      )}
      {query.isPending && <Notice>Đang tải…</Notice>}
      <Feedback error={query.error || change.error} success={change.isSuccess} />
      {query.data?.length === 0 && <Notice>Không có dữ liệu.</Notice>}
      <div className="grid gap-3">
        {query.data?.map((item) => {
          const record = item as unknown as Record<string, unknown>;
          const id = String(record.id ?? "");
          return (
            <article className={box} key={id}>
              <p className="font-semibold">
                {String(
                  record.Code ??
                    record.title ??
                    record.Status ??
                    record.status ??
                    record.ProviderTransactionID ??
                    id,
                )}
              </p>
              <p className="mt-1 break-all text-xs text-zinc-500">{id}</p>
              {kind === "drivers" && (
                <p className="mt-2 text-sm">
                  User: {String(record.UserID ?? record.userId ?? "—")} ·{" "}
                  {String(record.Phone ?? record.phone ?? "")} ·{" "}
                  {String(record.VehiclePlate ?? record.vehiclePlate ?? "")}
                </p>
              )}
              {kind === "shipments" && (
                <p className="mt-2 text-sm">
                  Đơn: {String(record.SellerOrderID)} · Tài xế:{" "}
                  {String(record.driverId ?? "Chưa gán")} · COD:{" "}
                  {formatVnd(Number(record.codAmount ?? 0))}
                </p>
              )}
              {kind === "receipts" && (
                <p className="mt-2 text-sm">
                  {formatVnd(Number(record.Amount ?? 0))} · {String(record.Bank ?? "")} · Payment:{" "}
                  {String(record.PaymentID ?? "—")}
                </p>
              )}
              {kind === "vouchers" && (
                <p className="mt-2 text-sm">
                  {record.Active ? "Đang bật" : "Đang tắt"} · Hết hạn: {String(record.EndsAt ?? "")}
                </p>
              )}
              {kind === "reviews" && (
                <p className="mt-2 text-sm">
                  Sản phẩm: {String(record.ProductID)} · {String(record.Rating)}/5 ·{" "}
                  {String(record.Comment ?? "")}
                </p>
              )}
              {kind === "drivers" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["approved", "rejected", "suspended"] as const).map((action) => (
                    <Button
                      key={action}
                      type="button"
                      variant="secondary"
                      disabled={
                        change.isPending || String(record.Status ?? record.status) === action
                      }
                      onClick={() =>
                        change.mutate({ id: String(record.UserID ?? record.userId ?? id), action })
                      }
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              )}
              {kind === "shipments" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={
                      !driverId.trim() ||
                      change.isPending ||
                      !["pending", "assigned", "accepted"].includes(String(record.Status))
                    }
                    onClick={() => change.mutate({ id, action: "assign" })}
                  >
                    Gán tài xế
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      change.isPending ||
                      record.Status !== "delivered" ||
                      !!record.codSettled ||
                      (Number(record.codAmount) > 0 && !record.codCollected)
                    }
                    onClick={() => change.mutate({ id, action: "settle" })}
                  >
                    Quyết toán COD
                  </Button>
                </div>
              )}
              {kind === "reviews" && (
                <Button
                  className="mt-3"
                  type="button"
                  disabled={change.isPending || record.Status === "hidden"}
                  onClick={() => {
                    if (window.confirm("Ẩn đánh giá này?")) change.mutate({ id, action: "hide" });
                  }}
                >
                  Ẩn đánh giá
                </Button>
              )}
            </article>
          );
        })}
      </div>
      <ListPage page={page} count={query.data?.length ?? 0} onChange={setPage} />
    </Page>
  );
}

export function SellerProfile() {
  const cache = useQueryClient();
  const access = useAccountAccess();
  const [seller, setSeller] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState<PickupAddress>({
    recipientName: "",
    phone: "",
    addressLine: "",
    ward: "",
    district: "",
    province: "",
  });
  const [page, setPage] = useState(1);
  const [memberUser, setMemberUser] = useState("");
  const [memberRole, setMemberRole] = useState<"manager" | "staff">("staff");
  const membership = access.membership(seller);
  const canManage = membership?.role === "owner" || membership?.role === "manager";
  const profile = useQuery({
    queryKey: ["seller-profile", seller],
    queryFn: () => sellerApi.profile(seller),
    enabled: !!seller,
  });
  const stats = useQuery({
    queryKey: ["seller-dashboard", seller],
    queryFn: () => sellerApi.dashboard(seller),
    enabled: !!seller && canManage,
  });
  const members = useQuery({
    queryKey: ["seller-members", seller, page],
    queryFn: () => sellerApi.members(seller, page),
    enabled: !!seller,
  });
  const save = useMutation({
    mutationFn: () =>
      sellerApi.updateProfile(seller, {
        name: name.trim(),
        description,
        pickupAddress: Object.fromEntries(
          Object.entries(address).map(([key, value]) => [key, value.trim()]),
        ) as unknown as PickupAddress,
      }),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["seller-profile", seller] }),
  });
  const memberAction = useMutation({
    mutationFn: (action: "update" | "remove") =>
      action === "update"
        ? sellerApi.updateMember(seller, memberUser, memberRole)
        : sellerApi.removeMember(seller, memberUser),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["seller-members", seller] }),
  });
  return (
    <Page title="Hồ sơ và thành viên shop">
      <ManagementNav kind="seller" />
      <label className="block max-w-md text-sm">
        Shop
        <select
          value={seller}
          onChange={(e) => {
            setSeller(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Chọn shop</option>
          {access.memberships.data?.map((s) => (
            <option key={s.sellerId} value={s.sellerId}>
              {s.sellerName} · {s.role}
            </option>
          ))}
        </select>
      </label>
      <Feedback
        error={
          access.memberships.error ||
          profile.error ||
          stats.error ||
          members.error ||
          save.error ||
          memberAction.error
        }
        success={save.isSuccess || memberAction.isSuccess}
      />
      {seller && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className={box}>
            <h2 className="font-semibold">Hồ sơ hiện tại</h2>
            <p className="mt-2">
              {profile.data?.Name} · {profile.data?.Status}
            </p>
            <p className="text-sm text-zinc-500">{profile.data?.Description}</p>
            <p className="mt-2 text-sm">
              Địa chỉ lấy hàng: {profile.data?.pickupAddress?.addressLine ?? "Chưa có"}
            </p>
            <button
              type="button"
              className="mt-3 text-sm text-orange-600"
              onClick={() => {
                if (!profile.data) return;
                setName(profile.data.Name);
                setDescription(profile.data.Description ?? "");
                if (profile.data.pickupAddress) setAddress(profile.data.pickupAddress);
              }}
            >
              Đưa thông tin hiện tại vào biểu mẫu
            </button>
          </section>
          <section className={box}>
            <h2 className="font-semibold">Thống kê</h2>
            {!canManage && <Notice>Chỉ owner hoặc manager được xem thống kê.</Notice>}
            {stats.data && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {(
                  [
                    ["Sản phẩm", stats.data.products],
                    ["Đơn hàng", stats.data.totalOrders],
                    ["Chờ xử lý", stats.data.pendingOrders],
                    ["Đã giao", stats.data.deliveredOrders],
                    ["Đã huỷ", stats.data.cancelledOrders],
                    ["Variant sắp hết", stats.data.lowStockVariants],
                    ["Doanh số giao thành công", formatVnd(stats.data.deliveredSales)],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="rounded bg-zinc-50 p-3">
                    <p>{label}</p>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
          {canManage && (
            <form
              className={box}
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <h2 className="mb-3 font-semibold">Cập nhật shop</h2>
              <label>
                Tên
                <input
                  maxLength={200}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                Mô tả
                <textarea
                  maxLength={5000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              {(Object.keys(address) as (keyof PickupAddress)[]).map((key) => (
                <label className="block text-sm" key={key}>
                  {key}
                  <input
                    required
                    maxLength={300}
                    value={address[key]}
                    onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
                  />
                </label>
              ))}
              <Button className="mt-4" disabled={save.isPending}>
                Lưu hồ sơ
              </Button>
            </form>
          )}
          <section className={box}>
            <h2 className="font-semibold">Thành viên</h2>
            {members.data?.map((m) => (
              <div className="mt-3 border-t pt-3 text-sm" key={m.UserID}>
                <p className="break-all">
                  {m.UserID} · {m.Role}
                </p>
                {m.Role !== "owner" && (
                  <button
                    className="text-orange-600"
                    type="button"
                    onClick={() => {
                      setMemberUser(m.UserID);
                      setMemberRole(m.Role === "manager" ? "manager" : "staff");
                    }}
                  >
                    Chọn thành viên
                  </button>
                )}
              </div>
            ))}
            <ListPage page={page} count={members.data?.length ?? 0} onChange={setPage} />
            {membership?.role === "owner" && (
              <form
                className="mt-4 space-y-3 border-t pt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  memberAction.mutate("update");
                }}
              >
                <label className="block text-sm">
                  User UUID
                  <input
                    required
                    value={memberUser}
                    onChange={(e) => setMemberUser(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  Vai trò
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as typeof memberRole)}
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                </label>
                <div className="flex gap-2">
                  <Button disabled={memberAction.isPending || !memberUser}>Lưu vai trò</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={memberAction.isPending || !memberUser}
                    onClick={() => {
                      if (window.confirm("Xoá thành viên khỏi shop?"))
                        memberAction.mutate("remove");
                    }}
                  >
                    Xoá
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </Page>
  );
}

export function SellerCatalog() {
  const cache = useQueryClient();
  const access = useAccountAccess();
  const [seller, setSeller] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [product, setProduct] = useState("");
  const [variant, setVariant] = useState("");
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [attributes, setAttributes] = useState("{}");
  const [specifications, setSpecifications] = useState("{}");
  const [seo, setSeo] = useState("{}");
  const products = useQuery({
    queryKey: ["seller-products", seller, page, status],
    queryFn: () =>
      sellerApi.products(
        seller,
        page,
        status ? (status as "draft" | "published" | "archived") : undefined,
      ),
    enabled: !!seller,
  });
  const detail = useQuery({
    queryKey: ["seller-product", seller, product],
    queryFn: () => sellerApi.product(seller, product),
    enabled: !!seller && !!product,
  });
  const updateVariant = useMutation({
    mutationFn: () =>
      sellerApi.updateVariant(seller, product, variant, {
        sku: sku.trim(),
        name: name.trim(),
        price,
        attributes: JSON.parse(attributes) as Record<string, unknown>,
      }),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["seller-product", seller, product] }),
  });
  const updateMetadata = useMutation({
    mutationFn: () =>
      catalogApi.updateMetadata(seller, product, {
        specifications: JSON.parse(specifications),
        seo: JSON.parse(seo),
      }),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["product-metadata", product] }),
  });
  return (
    <Page title="Danh sách sản phẩm shop">
      <ManagementNav kind="seller" />
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">
          Shop
          <select
            value={seller}
            onChange={(e) => {
              setSeller(e.target.value);
              setProduct("");
              setPage(1);
            }}
          >
            <option value="">Chọn shop</option>
            {access.memberships.data?.map((s) => (
              <option key={s.sellerId} value={s.sellerId}>
                {s.sellerName} · {s.role}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Trạng thái
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả</option>
            {["draft", "published", "archived"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <Feedback
        error={products.error || detail.error || updateVariant.error || updateMetadata.error}
        success={updateVariant.isSuccess || updateMetadata.isSuccess}
      />
      {products.data?.length === 0 && <Notice>Không có sản phẩm.</Notice>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {products.data?.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`${box} text-left hover:border-orange-300`}
            onClick={() => {
              setProduct(p.id);
              setVariant("");
            }}
          >
            <strong>{p.Name}</strong>
            <p className="text-sm">{p.Status}</p>
            <p className="break-all text-xs text-zinc-500">{p.id}</p>
          </button>
        ))}
      </div>
      <ListPage page={page} count={products.data?.length ?? 0} onChange={setPage} />
      {detail.data && (
        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className={box}>
            <h2 className="font-semibold">{detail.data.product.Name}</h2>
            <p className="text-sm text-zinc-500">{detail.data.product.Description}</p>
            <h3 className="mt-4 font-medium">Phiên bản</h3>
            {detail.data.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                className="mt-2 block w-full rounded border p-3 text-left text-sm"
                onClick={() => {
                  setVariant(v.id);
                  setSku(v.SKU);
                  setName(v.Name);
                  setPrice(v.Price);
                  setAttributes(JSON.stringify(v.Attributes ?? {}, null, 2));
                }}
              >
                {v.Name} · {formatVnd(v.Price)} · Tồn {v.Stock}
              </button>
            ))}
            <p className="mt-3 text-sm">{detail.data.images.length} ảnh sản phẩm</p>
          </div>
          <div className="space-y-5">
            <form
              className={box}
              onSubmit={(e) => {
                e.preventDefault();
                updateVariant.mutate();
              }}
            >
              <h3 className="font-semibold">Sửa phiên bản</h3>
              <p className="break-all text-xs">{variant}</p>
              <label className="block text-sm">
                SKU
                <input required value={sku} onChange={(e) => setSku(e.target.value)} />
              </label>
              <label className="block text-sm">
                Tên
                <input required value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="block text-sm">
                Giá
                <input
                  type="number"
                  min={0}
                  max={1000000000000}
                  step={1}
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </label>
              <label className="block text-sm">
                Attributes JSON
                <textarea value={attributes} onChange={(e) => setAttributes(e.target.value)} />
              </label>
              <Button disabled={!variant || updateVariant.isPending}>Lưu phiên bản</Button>
            </form>
            <form
              className={box}
              onSubmit={(e) => {
                e.preventDefault();
                updateMetadata.mutate();
              }}
            >
              <h3 className="font-semibold">Metadata sản phẩm</h3>
              <label className="block text-sm">
                Specifications JSON
                <textarea
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                SEO JSON
                <textarea value={seo} onChange={(e) => setSeo(e.target.value)} />
              </label>
              <Button disabled={updateMetadata.isPending}>Lưu metadata</Button>
            </form>
          </div>
        </section>
      )}
    </Page>
  );
}

export function SellerFulfillment() {
  const cache = useQueryClient();
  const access = useAccountAccess();
  const [seller, setSeller] = useState("");
  const [order, setOrder] = useState("");
  const orders = useQuery({
    queryKey: ["seller-orders", seller],
    queryFn: () => sellerApi.orders(seller),
    enabled: !!seller,
  });
  const detail = useQuery({
    queryKey: ["seller-order", seller, order],
    queryFn: () => sellerApi.order(seller, order),
    enabled: !!seller && !!order,
  });
  const create = useMutation({
    mutationFn: () => shippingApi.create(seller, order),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["seller-order", seller, order] });
      cache.invalidateQueries({ queryKey: ["seller-orders", seller] });
    },
  });
  return (
    <Page title="Chi tiết đơn và vận chuyển">
      <ManagementNav kind="seller" />
      <label className="block max-w-md text-sm">
        Shop
        <select
          value={seller}
          onChange={(e) => {
            setSeller(e.target.value);
            setOrder("");
          }}
        >
          <option value="">Chọn shop</option>
          {access.memberships.data?.map((s) => (
            <option key={s.sellerId} value={s.sellerId}>
              {s.sellerName} · {s.role}
            </option>
          ))}
        </select>
      </label>
      <Feedback error={orders.error || detail.error || create.error} success={create.isSuccess} />
      <div className="mt-4 grid gap-3">
        {orders.data?.map((o) => (
          <button
            type="button"
            key={o.id}
            className={`${box} text-left`}
            onClick={() => setOrder(o.id)}
          >
            <strong>{o.Status}</strong> · {formatVnd(o.Total)}
            <p className="break-all text-xs text-zinc-500">Seller order: {o.id}</p>
          </button>
        ))}
      </div>
      {detail.data && (
        <section className={`${box} mt-5 space-y-3`}>
          <h2 className="font-semibold">Đơn {order}</h2>
          <p>
            Thanh toán: {detail.data.paymentMethod} · {detail.data.paymentStatus}
          </p>
          <p>Vận đơn: {detail.data.shipment?.Status ?? "Chưa tạo"}</p>
          <p>
            Địa chỉ: {detail.data.addressSnapshot?.AddressLine},{" "}
            {detail.data.addressSnapshot?.District}
          </p>
          {detail.data.items.map((i) => (
            <p key={i.id} className="border-t pt-2 text-sm">
              {i.ProductName} · {i.VariantName} · {i.SKU} · {i.Quantity} × {formatVnd(i.UnitPrice)}
            </p>
          ))}
          <Button
            type="button"
            disabled={
              create.isPending ||
              detail.data.sellerOrder.Status !== "confirmed" ||
              (!!detail.data.shipment && detail.data.shipment.Carrier !== "internal") ||
              (detail.data.paymentMethod !== "cod" && detail.data.paymentStatus !== "paid")
            }
            onClick={() => create.mutate()}
          >
            {detail.data.shipment ? "Xem lại vận đơn nội bộ" : "Tạo vận đơn nội bộ"}
          </Button>
          {detail.data.shipment && (
            <a className="ml-3 text-orange-600" href={`/shipments/${detail.data.shipment.id}`}>
              Theo dõi vận đơn
            </a>
          )}
        </section>
      )}
    </Page>
  );
}

export function SellerInventoryHistory() {
  const access = useAccountAccess();
  const [seller, setSeller] = useState("");
  const [variant, setVariant] = useState("");
  const [page, setPage] = useState(1);
  const history = useQuery({
    queryKey: ["inventory-history", seller, variant, page],
    queryFn: () => sellerApi.inventory(seller, variant, page),
    enabled: !!seller && !!variant,
  });
  return (
    <Page title="Lịch sử tồn kho">
      <ManagementNav kind="seller" />
      <div className="grid max-w-xl gap-3">
        <label className="text-sm">
          Shop
          <select value={seller} onChange={(e) => setSeller(e.target.value)}>
            <option value="">Chọn shop</option>
            {access.memberships.data?.map((s) => (
              <option key={s.sellerId} value={s.sellerId}>
                {s.sellerName} · {s.role}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Variant UUID
          <input
            value={variant}
            onChange={(e) => {
              setVariant(e.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>
      <Feedback error={history.error} />
      {history.data?.length === 0 && <Notice>Chưa có biến động tồn kho.</Notice>}
      <div className="mt-4 grid gap-3">
        {history.data?.map((m) => (
          <article className={box} key={m.id}>
            <strong>
              {m.Quantity > 0 ? "+" : ""}
              {m.Quantity} · {m.Type}
            </strong>
            <p className="text-sm">{m.Note}</p>
            <p className="text-xs text-zinc-500">
              {m.CreatedAt} · {m.ReferenceID}
            </p>
          </article>
        ))}
      </div>
      <ListPage page={page} count={history.data?.length ?? 0} onChange={setPage} />
    </Page>
  );
}
