"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/api/admin.api";
import { sellerApi } from "@/features/seller/api/seller.api";
import { catalogApi } from "@/features/catalog/api/catalog.api";
import { vouchersApi } from "@/features/vouchers/api/vouchers.api";
import { useSessionStore } from "@/features/auth/store/session.store";
import { useAccountAccess } from "@/features/auth/hooks/use-account-access";
import type { AppRole } from "@/lib/api/types";
import { Button, Notice, Page } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { formatVnd } from "@/lib/format";

const adminLinks = [
  ["/admin", "Tổng quan"],
  ["/admin/categories", "Danh mục"],
  ["/admin/sellers", "Người bán"],
  ["/admin/reviews", "Đánh giá"],
  ["/admin/vouchers", "Voucher sàn"],
  ["/admin/drivers", "Tài xế"],
  ["/admin/shipments", "Vận đơn"],
  ["/admin/receipts", "Biên nhận"],
] as const;
const sellerLinks = [
  ["/seller", "Tổng quan"],
  ["/seller/products", "Sản phẩm"],
  ["/seller/orders", "Đơn hàng"],
  ["/seller/inventory", "Tồn kho"],
  ["/seller/vouchers", "Voucher shop"],
  ["/seller/profile", "Hồ sơ shop"],
  ["/seller/catalog", "Danh sách sản phẩm"],
  ["/seller/fulfillment", "Vận chuyển"],
  ["/seller/inventory/history", "Lịch sử tồn kho"],
] as const;

export function ManagementGuard({ role, children }: { role: AppRole; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const access = useAccountAccess();
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [router, user]);
  if (!user)
    return (
      <Page title="Đang kiểm tra phiên đăng nhập">
        <Notice>Đang tải…</Notice>
      </Page>
    );
  const checking = role === "admin" ? access.permissions.isPending : access.memberships.isPending;
  const error = role === "admin" ? access.permissions.error : access.memberships.error;
  if (checking)
    return (
      <Page title="Đang kiểm tra quyền shop">
        <Notice>Đang tải…</Notice>
      </Page>
    );
  if (error)
    return (
      <Page title="Không thể kiểm tra quyền">
        <Notice error>{error.message}</Notice>
      </Page>
    );
  if (
    (role === "admin" && !access.isAdmin) ||
    (role === "seller_admin" && !access.isSeller && pathname !== "/seller")
  )
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
function SellerPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const access = useAccountAccess();
  return (
    <label className="block text-sm font-medium text-zinc-700">
      Shop
      <select className="mt-2" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Chọn shop</option>
        {access.memberships.data?.map((shop) => (
          <option key={shop.sellerId} value={shop.sellerId}>
            {shop.sellerName} · {shop.role} · {shop.sellerStatus}
          </option>
        ))}
      </select>
    </label>
  );
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
  const stats = useQuery({ queryKey: ["admin-dashboard"], queryFn: adminApi.dashboard });
  return (
    <Shell kind="admin" title="Quản trị hệ thống">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card href="/admin/categories" title="Danh mục" text="Tạo danh mục sản phẩm." />
        <Card href="/admin/sellers" title="Người bán" text="Duyệt hoặc thay đổi trạng thái shop." />
        <Card href="/admin/reviews" title="Đánh giá" text="Xem và ẩn đánh giá." />
        <Card href="/admin/vouchers" title="Voucher sàn" text="Tạo và bật/tắt voucher toàn sàn." />
        <Card href="/admin/drivers" title="Tài xế" text="Duyệt hồ sơ tài xế." />
        <Card href="/admin/shipments" title="Vận đơn" text="Gán tài xế và quyết toán COD." />
        <Card href="/admin/receipts" title="Biên nhận" text="Theo dõi biên nhận SePay." />
      </div>
      {stats.isPending && <Notice>Đang tải số liệu…</Notice>}
      <ErrorNotice error={stats.error} />
      {stats.data && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Tài khoản", stats.data.users],
              ["Shop chờ duyệt", stats.data.pendingSellers],
              ["Đơn hàng", stats.data.orders],
              ["Đơn chờ xử lý", stats.data.pendingOrders],
              ["Đơn đã giao", stats.data.deliveredOrders],
              ["Doanh thu", formatVnd(stats.data.revenue)],
              ["Thanh toán chờ xử lý", stats.data.pendingPayments],
            ] as const
          ).map(([label, value]) => (
            <div className="rounded-xl bg-white p-5" key={label}>
              <p className="text-sm text-zinc-500">{label}</p>
              <strong className="mt-2 block text-xl">{value}</strong>
            </div>
          ))}
        </div>
      )}
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
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"" | "pending" | "approved" | "rejected" | "suspended">(
    "pending",
  );
  const list = useQuery({
    queryKey: ["admin-sellers", page, filter],
    queryFn: () => adminApi.sellers(page, filter || undefined),
  });
  const mutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "rejected" | "suspended" | "pending";
    }) => sellerApi.updateStatus(id, status),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["admin-sellers"] });
      cache.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
  return (
    <Shell kind="admin" title="Quản lý người bán">
      <label className="block max-w-xs text-sm">
        Trạng thái
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as typeof filter);
            setPage(1);
          }}
        >
          <option value="">Tất cả</option>
          {["pending", "approved", "rejected", "suspended"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {list.isPending && <Notice>Đang tải shop…</Notice>}
      <ErrorNotice error={list.error || mutation.error} />
      {list.data?.length === 0 && <Notice>Không có shop ở trạng thái này.</Notice>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {list.data?.map((shop) => (
          <article className="rounded-xl border border-zinc-200 bg-white p-5" key={shop.id}>
            <h2 className="font-semibold">{shop.Name}</h2>
            <p className="mt-1 text-sm">
              {shop.Status} · {shop.Slug}
            </p>
            <p className="text-sm text-zinc-500">
              Owner: {shop.ownerEmail ?? shop.ownerId ?? "Chưa xác định"}
            </p>
            <p className="break-all text-xs text-zinc-500">{shop.id}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["approved", "rejected", "suspended", "pending"] as const).map((status) => (
                <Button
                  type="button"
                  variant="secondary"
                  key={status}
                  disabled={mutation.isPending || shop.Status === status}
                  onClick={() => mutation.mutate({ id: shop.id, status })}
                >
                  {status}
                </Button>
              ))}
            </div>
          </article>
        ))}
      </div>
      {list.data && (list.data.length > 0 || page > 1) && (
        <Pagination
          page={page}
          hasNext={list.data.length === 20}
          busy={list.isFetching}
          onChange={setPage}
        />
      )}
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
  const cache = useQueryClient();
  const access = useAccountAccess();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sellerId, setSellerId] = useState("");
  const stats = useQuery({
    queryKey: ["seller-dashboard", sellerId],
    queryFn: () => sellerApi.dashboard(sellerId),
    enabled: !!sellerId && ["owner", "manager"].includes(access.membership(sellerId)?.role ?? ""),
  });
  const create = useMutation({
    mutationFn: () => sellerApi.create({ name, slug }),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["seller-memberships"] }),
  });
  return (
    <Shell kind="seller" title="Kênh người bán">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card href="/seller/products" title="Sản phẩm" text="Tạo sản phẩm, variant và metadata." />
        <Card href="/seller/orders" title="Đơn hàng" text="Theo dõi và cập nhật trạng thái đơn." />
        <Card href="/seller/inventory" title="Tồn kho" text="Điều chỉnh tồn kho theo variant." />
        <Card
          href="/seller/profile"
          title="Hồ sơ shop"
          text="Địa chỉ lấy hàng, thành viên và thống kê."
        />
        <Card
          href="/seller/catalog"
          title="Danh sách sản phẩm"
          text="Xem sản phẩm nháp và sửa variant."
        />
        <Card href="/seller/fulfillment" title="Vận chuyển" text="Xem đơn và tạo vận đơn nội bộ." />
        <Card
          href="/seller/vouchers"
          title="Voucher shop"
          text="Tạo và quản lý voucher của shop."
        />
      </div>
      <section className="mt-6 rounded-xl bg-white p-6">
        <h2 className="text-lg font-semibold">Shop của tôi</h2>
        {access.memberships.isPending && <Notice>Đang tải shop…</Notice>}
        <ErrorNotice error={access.memberships.error} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {access.memberships.data?.map((shop) => (
            <button
              type="button"
              onClick={() => setSellerId(shop.sellerId)}
              key={shop.sellerId}
              className="rounded-lg border border-zinc-200 p-4 text-left hover:border-orange-300"
            >
              <p className="font-semibold">{shop.sellerName}</p>
              <p className="mt-1 text-sm text-zinc-500">{shop.sellerId}</p>
              <p className="mt-2 text-sm">
                Trạng thái: <strong>{shop.sellerStatus}</strong> · Vai trò:{" "}
                <strong>{shop.role}</strong>
              </p>
            </button>
          ))}
        </div>
        {access.memberships.data?.length === 0 && (
          <Notice>Bạn chưa có shop. Tạo shop bên dưới để gửi yêu cầu duyệt.</Notice>
        )}
        {sellerId && (
          <div className="mt-5 rounded-xl bg-zinc-50 p-5">
            <h3 className="font-semibold">Thống kê {access.membership(sellerId)?.sellerName}</h3>
            {access.membership(sellerId)?.role === "staff" ? (
              <Notice>Chỉ owner hoặc manager được xem thống kê.</Notice>
            ) : stats.data ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["Sản phẩm", stats.data.products],
                    ["Đơn shop", stats.data.totalOrders],
                    ["Chờ xử lý", stats.data.pendingOrders],
                    ["Đã giao", stats.data.deliveredOrders],
                    ["Doanh số", formatVnd(stats.data.deliveredSales)],
                    ["Variant sắp hết", stats.data.lowStockVariants],
                  ] as const
                ).map(([label, value]) => (
                  <p key={label} className="rounded bg-white p-3 text-sm">
                    {label}: <strong>{value}</strong>
                  </p>
                ))}
              </div>
            ) : stats.isPending ? (
              <Notice>Đang tải số liệu…</Notice>
            ) : (
              <ErrorNotice error={stats.error} />
            )}
          </div>
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
        <ErrorNotice error={create.error} />
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
          <SellerPicker value={seller} onChange={setSeller} />
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
          <SellerPicker value={seller} onChange={setSeller} />
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
          <SellerPicker value={seller} onChange={setSeller} />
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
          <SellerPicker value={seller} onChange={setSeller} />
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
        <SellerPicker value={seller} onChange={setSeller} />
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
  const [page, setPage] = useState(1);
  const [code, setCode] = useState("");
  const [value, setValue] = useState(0);
  const [minOrder, setMinOrder] = useState(0);
  const [usageLimit, setUsageLimit] = useState(0);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [voucherId, setVoucherId] = useState("");
  const [active, setActive] = useState(true);
  const list = useQuery({
    queryKey: ["seller-vouchers", seller, page],
    queryFn: () => vouchersApi.manage(page, seller),
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
          <SellerPicker value={seller} onChange={setSeller} />
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
          <SellerPicker value={seller} onChange={setSeller} />
          {list.data?.map((voucher) => (
            <article key={voucher.id} className="mt-3 rounded-lg border border-zinc-200 p-4">
              <p className="font-semibold">{voucher.Code}</p>
              <p className="text-sm text-zinc-500">
                UUID: {voucher.id} · {voucher.Active ? "Đang bật" : "Đang tắt"}
              </p>
            </article>
          ))}
          {list.data && (list.data.length > 0 || page > 1) && (
            <Pagination
              page={page}
              hasNext={list.data.length === 20}
              busy={list.isFetching}
              onChange={setPage}
            />
          )}
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
