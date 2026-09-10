"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/api/admin.api";
import { sellerApi } from "@/features/seller/api/seller.api";
import { catalogApi } from "@/features/catalog/api/catalog.api";
import { vouchersApi } from "@/features/vouchers/api/vouchers.api";
import { useSessionStore } from "@/features/auth/store/session.store";
import type { AppRole } from "@/lib/api/types";
import { Button, Notice, Page } from "@/components/ui";

const adminLinks = [
  ["/admin", "Tổng quan"],
  ["/admin/categories", "Danh mục"],
  ["/admin/sellers", "Người bán"],
  ["/admin/reviews", "Đánh giá"],
  ["/admin/vouchers", "Voucher sàn"],
] as const;
const sellerLinks = [
  ["/seller", "Tổng quan"],
  ["/seller/products", "Sản phẩm"],
  ["/seller/orders", "Đơn hàng"],
  ["/seller/inventory", "Tồn kho"],
  ["/seller/vouchers", "Voucher shop"],
] as const;

export function ManagementGuard({ role, children }: { role: AppRole; children: React.ReactNode }) {
  const router = useRouter();
  const { user, roles } = useSessionStore();
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [router, user]);
  if (!user)
    return (
      <Page title="Đang kiểm tra phiên đăng nhập">
        <Notice>Đang tải…</Notice>
      </Page>
    );
  if (!roles.includes(role))
    return (
      <Page title="Không có quyền truy cập">
        <Notice error>Bạn không có quyền sử dụng khu vực này.</Notice>
      </Page>
    );
  return <>{children}</>;
}

export function ManagementNav({ kind }: { kind: "admin" | "seller" }) {
  const pathname = usePathname();
  const links = kind === "admin" ? adminLinks : sellerLinks;
  return (
    <nav
      className="mb-6 flex gap-2 overflow-x-auto rounded-xl bg-white p-2 shadow-sm"
      aria-label={`Khu vực ${kind}`}
    >
      {links.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm ${pathname === href ? "bg-orange-100 font-semibold text-orange-700" : "text-zinc-600 hover:bg-zinc-50"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <input
        className="mt-2"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function ErrorNotice({ error }: { error: unknown }) {
  return error ? (
    <Notice error>{error instanceof Error ? error.message : "Thao tác thất bại"}</Notice>
  ) : null;
}
function Shell({
  kind,
  title,
  children,
}: {
  kind: "admin" | "seller";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Page title={title}>
      <ManagementNav kind={kind} />
      {children}
    </Page>
  );
}
function Card({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-orange-300 hover:shadow-sm"
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-zinc-500">{text}</p>
    </Link>
  );
}

export function AdminDashboard() {
  return (
    <Shell kind="admin" title="Quản trị hệ thống">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card href="/admin/categories" title="Danh mục" text="Tạo danh mục sản phẩm." />
        <Card href="/admin/sellers" title="Người bán" text="Duyệt hoặc thay đổi trạng thái shop." />
        <Card href="/admin/reviews" title="Đánh giá" text="Xoá đánh giá vi phạm bằng UUID." />
        <Card href="/admin/vouchers" title="Voucher sàn" text="Tạo và bật/tắt voucher toàn sàn." />
      </div>
      <Notice>Dashboard chưa hiển thị số liệu vì backend hiện chưa có API thống kê.</Notice>
    </Shell>
  );
}

export function AdminCategories() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const mutation = useMutation({
    mutationFn: () => adminApi.createCategory({ name, slug, parentId: parentId || null }),
  });
  return (
    <Shell kind="admin" title="Quản lý danh mục">
      <form
        className="mx-auto max-w-xl space-y-4 rounded-xl bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <Field label="Tên danh mục" value={name} onChange={setName} />
        <Field label="Slug" value={slug} onChange={setSlug} />
        <Field label="Parent UUID (tuỳ chọn)" value={parentId} onChange={setParentId} />
        <Button disabled={mutation.isPending || !name || !slug}>
          {mutation.isPending ? "Đang tạo…" : "Tạo danh mục"}
        </Button>
        <ErrorNotice error={mutation.error} />
        {mutation.data && <Notice>Đã tạo danh mục {mutation.data.Name}.</Notice>}
      </form>
    </Shell>
  );
}

export function AdminSellers() {
  const [id, setId] = useState("");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "suspended">(
    "approved",
  );
  const mutation = useMutation({ mutationFn: () => sellerApi.updateStatus(id, status) });
  return (
    <Shell kind="admin" title="Quản lý người bán">
      <form
        className="mx-auto max-w-xl space-y-4 rounded-xl bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <Notice>Nhập seller UUID vì hiện chưa có API danh sách seller dành cho admin.</Notice>
        <Field
          label="Seller UUID"
          value={id}
          onChange={setId}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <label className="block text-sm font-medium">
          Trạng thái
          <select
            className="mt-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="approved">Duyệt</option>
            <option value="rejected">Từ chối</option>
            <option value="suspended">Tạm khoá</option>
            <option value="pending">Chờ duyệt</option>
          </select>
        </label>
        <Button disabled={mutation.isPending || !id}>
          {mutation.isPending ? "Đang cập nhật…" : "Cập nhật trạng thái"}
        </Button>
        <ErrorNotice error={mutation.error} />
        {mutation.isSuccess && <Notice>Đã cập nhật trạng thái seller.</Notice>}
      </form>
    </Shell>
  );
}

export function AdminReviews() {
  const [id, setId] = useState("");
  const mutation = useMutation({ mutationFn: () => adminApi.deleteReview(id) });
  return (
    <Shell kind="admin" title="Quản lý đánh giá">
      <form
        className="mx-auto max-w-xl space-y-4 rounded-xl bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (window.confirm("Bạn chắc chắn muốn xoá đánh giá này?")) mutation.mutate();
        }}
      >
        <Notice>Nhập review UUID vì hiện chưa có API danh sách review dành cho admin.</Notice>
        <Field label="Review UUID" value={id} onChange={setId} />
        <Button disabled={mutation.isPending || !id}>
          {mutation.isPending ? "Đang xoá…" : "Xoá đánh giá"}
        </Button>
        <ErrorNotice error={mutation.error} />
        {mutation.isSuccess && <Notice>Đã xoá đánh giá.</Notice>}
      </form>
    </Shell>
  );
}

export function SellerDashboard() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const shops = useQuery({ queryKey: ["my-sellers"], queryFn: sellerApi.mine });
  const create = useMutation({
    mutationFn: () => sellerApi.create({ name, slug }),
    onSuccess: () => shops.refetch(),
  });
  return (
    <Shell kind="seller" title="Kênh người bán">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card href="/seller/products" title="Sản phẩm" text="Tạo sản phẩm, variant và metadata." />
        <Card href="/seller/orders" title="Đơn hàng" text="Theo dõi và cập nhật trạng thái đơn." />
        <Card href="/seller/inventory" title="Tồn kho" text="Điều chỉnh tồn kho theo variant." />
        <Card
          href="/seller/vouchers"
          title="Voucher shop"
          text="Tạo và quản lý voucher của shop."
        />
      </div>
      <section className="mt-6 rounded-xl bg-white p-6">
        <h2 className="text-lg font-semibold">Shop của tôi</h2>
        {shops.isLoading && <Notice>Đang tải shop…</Notice>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {shops.data?.map((shop) => (
            <article key={shop.id} className="rounded-lg border border-zinc-200 p-4">
              <p className="font-semibold">{shop.Name}</p>
              <p className="mt-1 text-sm text-zinc-500">{shop.id}</p>
              <p className="mt-2 text-sm">
                Trạng thái: <strong>{shop.Status}</strong>
              </p>
            </article>
          ))}
        </div>
        {shops.data?.length === 0 && (
          <Notice>Bạn chưa có shop. Tạo shop bên dưới để gửi yêu cầu duyệt.</Notice>
        )}
        <form
          className="mt-6 grid gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Field label="Tên shop" value={name} onChange={setName} />
          <Field label="Slug" value={slug} onChange={setSlug} />
          <Button disabled={create.isPending || !name || !slug}>
            {create.isPending ? "Đang tạo…" : "Tạo shop"}
          </Button>
        </form>
        <ErrorNotice error={shops.error || create.error} />
      </section>
    </Shell>
  );
}

export function SellerProducts() {
  const [seller, setSeller] = useState("");
  const [product, setProduct] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [sku, setSku] = useState("");
  const [variantName, setVariantName] = useState("");
  const [price, setPrice] = useState(0);
  const body = { name, slug, description, status };
  const create = useMutation({ mutationFn: () => catalogApi.createProduct(seller, body) });
  const update = useMutation({ mutationFn: () => catalogApi.updateProduct(seller, product, body) });
  const variant = useMutation({
    mutationFn: () => catalogApi.createVariant(seller, product, { sku, name: variantName, price }),
  });
  return (
    <Shell kind="seller" title="Quản lý sản phẩm">
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-xl bg-white p-6"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <h2 className="text-lg font-semibold">Tạo sản phẩm</h2>
          <Field label="Seller UUID" value={seller} onChange={setSeller} />
          <Field label="Tên" value={name} onChange={setName} />
          <Field label="Slug" value={slug} onChange={setSlug} />
          <Field label="Mô tả" value={description} onChange={setDescription} />
          <Button disabled={create.isPending || !seller || !name || !slug}>Tạo sản phẩm</Button>
          <ErrorNotice error={create.error} />
          {create.data && <Notice>Đã tạo sản phẩm: {create.data.id}</Notice>}
        </form>
        <form
          className="space-y-4 rounded-xl bg-white p-6"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate();
          }}
        >
          <h2 className="text-lg font-semibold">Cập nhật sản phẩm</h2>
          <Field label="Product UUID" value={product} onChange={setProduct} />
          <Field label="Seller UUID" value={seller} onChange={setSeller} />
          <Field label="Tên" value={name} onChange={setName} />
          <Field label="Slug" value={slug} onChange={setSlug} />
          <Field label="Mô tả" value={description} onChange={setDescription} />
          <label className="block text-sm font-medium">
            Trạng thái
            <select
              className="mt-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="draft">Nháp</option>
              <option value="published">Đang bán</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </label>
          <Button disabled={update.isPending || !seller || !product}>Cập nhật</Button>
          <ErrorNotice error={update.error} />
        </form>
        <form
          className="space-y-4 rounded-xl bg-white p-6"
          onSubmit={(e) => {
            e.preventDefault();
            variant.mutate();
          }}
        >
          <h2 className="text-lg font-semibold">Thêm variant</h2>
          <Field label="Seller UUID" value={seller} onChange={setSeller} />
          <Field label="Product UUID" value={product} onChange={setProduct} />
          <Field label="SKU" value={sku} onChange={setSku} />
          <Field label="Tên variant" value={variantName} onChange={setVariantName} />
          <Field label="Giá" type="number" value={price} onChange={(v) => setPrice(Number(v))} />
          <Button disabled={variant.isPending || !seller || !product || !sku || !variantName}>
            Thêm variant
          </Button>
          <ErrorNotice error={variant.error} />
          {variant.data && <Notice>Đã tạo variant: {variant.data.id}</Notice>}
        </form>
      </div>
    </Shell>
  );
}

export function SellerOrders() {
  const [seller, setSeller] = useState("");
  const [order, setOrder] = useState("");
  const [status, setStatus] = useState<"confirmed" | "shipping" | "delivered">("confirmed");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const orders = useQuery({
    queryKey: ["seller-orders", seller],
    queryFn: () => sellerApi.orders(seller),
    enabled: seller.length > 0,
  });
  const update = useMutation({
    mutationFn: () =>
      sellerApi.updateOrderStatus(seller, order, {
        status,
        carrier: carrier || undefined,
        trackingNumber: trackingNumber || undefined,
      }),
    onSuccess: () => orders.refetch(),
  });
  return (
    <Shell kind="seller" title="Đơn hàng của shop">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-xl bg-white p-6">
          <Field label="Seller UUID" value={seller} onChange={setSeller} />
          {orders.isLoading && <Notice>Đang tải đơn hàng…</Notice>}
          {orders.data?.map((item) => (
            <article key={item.id} className="mt-4 rounded-lg border border-zinc-200 p-4">
              <p className="font-medium">Đơn hàng: {item.OrderID}</p>
              <p className="text-sm text-zinc-500">
                {item.Status} · Tổng: {item.Total}
              </p>
              <button
                className="mt-2 text-sm text-orange-600 underline"
                onClick={() => setOrder(item.id)}
              >
                Chọn đơn này
              </button>
            </article>
          ))}
          <ErrorNotice error={orders.error} />
        </section>
        <form
          className="space-y-4 rounded-xl bg-white p-6"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate();
          }}
        >
          <h2 className="font-semibold">Cập nhật trạng thái</h2>
          <Field label="Seller order UUID" value={order} onChange={setOrder} />
          <label className="block text-sm font-medium">
            Trạng thái
            <select
              className="mt-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="confirmed">Đã xác nhận</option>
              <option value="shipping">Đang giao</option>
              <option value="delivered">Đã giao</option>
            </select>
          </label>
          <Field label="Đơn vị vận chuyển" value={carrier} onChange={setCarrier} />
          <Field label="Mã vận đơn" value={trackingNumber} onChange={setTrackingNumber} />
          <Button disabled={update.isPending || !seller || !order}>Cập nhật</Button>
          <ErrorNotice error={update.error} />
          {update.isSuccess && <Notice>Đã cập nhật đơn hàng.</Notice>}
        </form>
      </div>
    </Shell>
  );
}

export function SellerInventory() {
  const [seller, setSeller] = useState("");
  const [variant, setVariant] = useState("");
  const [delta, setDelta] = useState(0);
  const [note, setNote] = useState("");
  const mutation = useMutation({
    mutationFn: () => sellerApi.changeInventory(seller, variant, delta, note),
  });
  return (
    <Shell kind="seller" title="Quản lý tồn kho">
      <form
        className="mx-auto max-w-xl space-y-4 rounded-xl bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <Notice>Dùng số dương để nhập thêm, số âm để giảm tồn kho.</Notice>
        <Field label="Seller UUID" value={seller} onChange={setSeller} />
        <Field label="Variant UUID" value={variant} onChange={setVariant} />
        <Field
          label="Thay đổi số lượng"
          type="number"
          value={delta}
          onChange={(v) => setDelta(Number(v))}
        />
        <Field label="Ghi chú" value={note} onChange={setNote} />
        <Button disabled={mutation.isPending || !seller || !variant || delta === 0}>
          Cập nhật tồn kho
        </Button>
        <ErrorNotice error={mutation.error} />
        {mutation.isSuccess && <Notice>Đã cập nhật tồn kho.</Notice>}
      </form>
    </Shell>
  );
}

export function SellerVouchers() {
  const [seller, setSeller] = useState("");
  const [code, setCode] = useState("");
  const [value, setValue] = useState(0);
  const [minOrder, setMinOrder] = useState(0);
  const [usageLimit, setUsageLimit] = useState(0);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [voucherId, setVoucherId] = useState("");
  const [active, setActive] = useState(true);
  const list = useQuery({
    queryKey: ["seller-vouchers", seller],
    queryFn: () => vouchersApi.list(1, seller),
    enabled: seller.length > 0,
  });
  const create = useMutation({
    mutationFn: () =>
      vouchersApi.create(
        {
          code,
          type: "fixed",
          value,
          maxDiscount: 0,
          minOrder,
          usageLimit,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
        },
        seller,
      ),
    onSuccess: () => list.refetch(),
  });
  const toggle = useMutation({
    mutationFn: () => vouchersApi.status(voucherId, active),
    onSuccess: () => list.refetch(),
  });
  return (
    <Shell kind="seller" title="Voucher shop">
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-xl bg-white p-6"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Field label="Seller UUID" value={seller} onChange={setSeller} />
          <Field label="Mã voucher" value={code} onChange={setCode} />
          <Field
            label="Giá trị giảm"
            type="number"
            value={value}
            onChange={(v) => setValue(Number(v))}
          />
          <Field
            label="Đơn tối thiểu"
            type="number"
            value={minOrder}
            onChange={(v) => setMinOrder(Number(v))}
          />
          <Field
            label="Giới hạn lượt dùng"
            type="number"
            value={usageLimit}
            onChange={(v) => setUsageLimit(Number(v))}
          />
          <Field label="Bắt đầu" type="datetime-local" value={startsAt} onChange={setStartsAt} />
          <Field label="Kết thúc" type="datetime-local" value={endsAt} onChange={setEndsAt} />
          <Button disabled={create.isPending || !seller || !code || !startsAt || !endsAt}>
            Tạo voucher
          </Button>
          <ErrorNotice error={create.error} />
        </form>
        <section className="rounded-xl bg-white p-6">
          <Field label="Seller UUID để xem voucher" value={seller} onChange={setSeller} />
          {list.data?.map((voucher) => (
            <article key={voucher.id} className="mt-3 rounded-lg border border-zinc-200 p-4">
              <p className="font-semibold">{voucher.Code}</p>
              <p className="text-sm text-zinc-500">
                UUID: {voucher.id} · {voucher.Active ? "Đang bật" : "Đang tắt"}
              </p>
            </article>
          ))}
          <form
            className="mt-6 space-y-4 border-t pt-5"
            onSubmit={(e) => {
              e.preventDefault();
              toggle.mutate();
            }}
          >
            <Field label="Voucher UUID" value={voucherId} onChange={setVoucherId} />
            <label className="flex items-center gap-2 text-sm">
              <input
                className="!w-auto"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />{" "}
              Cho phép sử dụng
            </label>
            <Button variant="secondary" disabled={toggle.isPending || !voucherId}>
              Cập nhật trạng thái
            </Button>
            <ErrorNotice error={list.error || toggle.error} />
          </form>
        </section>
      </div>
    </Shell>
  );
}
