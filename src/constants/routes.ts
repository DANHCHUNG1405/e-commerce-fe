export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  ADMIN: "/admin",
  SELLER: "/seller",
  PRODUCTS: "/products",
  ORDERS: "/orders",
  ACCOUNT: "/account",
} as const;

export const ADMIN_NAVIGATION = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/categories", label: "Danh mục" },
  { href: "/admin/sellers", label: "Người bán" },
  { href: "/admin/reviews", label: "Đánh giá" },
  { href: "/admin/vouchers", label: "Voucher sàn" },
] as const;

export const SELLER_NAVIGATION = [
  { href: "/seller", label: "Tổng quan" },
  { href: "/seller/products", label: "Sản phẩm" },
  { href: "/seller/orders", label: "Đơn hàng" },
  { href: "/seller/inventory", label: "Tồn kho" },
  { href: "/seller/vouchers", label: "Voucher shop" },
] as const;
