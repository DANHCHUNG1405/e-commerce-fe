export type UUID = string;
export type ISODate = string;
export type AppRole = "admin" | "seller_admin" | "customer";
export interface Envelope<T> {
  statusCode: number;
  error: boolean;
  responseTimestamp: ISODate;
  data: { msg: string; content: T };
}
export interface BaseEntity {
  id: UUID;
  CreatedAt: ISODate;
  UpdatedAt: ISODate;
}
export interface User extends BaseEntity {
  email: string;
  fullName: string;
}
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
export interface AuthResult {
  user: User;
  tokens: TokenPair;
}
export interface Category extends BaseEntity {
  ParentID: UUID | null;
  Name: string;
  Slug: string;
}
export interface Product extends BaseEntity {
  SellerID: UUID;
  Name: string;
  Slug: string;
  Description: string;
  Status: "draft" | "published" | "archived";
  MetadataID: UUID | null;
}
export interface Variant extends BaseEntity {
  ProductID: UUID;
  SKU: string;
  Name: string;
  Price: number;
  Stock: number;
  Attributes: Record<string, unknown> | null;
}
export interface ProductImage extends BaseEntity {
  ProductID: UUID;
  URL: string;
  SortOrder: number;
}
export interface ProductDetail {
  product: Product;
  variants: Variant[];
  images: ProductImage[];
}
export interface CartItem extends BaseEntity {
  CartID: UUID;
  VariantID: UUID;
  Quantity: number;
}
export interface Address extends BaseEntity {
  UserID: UUID;
  RecipientName: string;
  Phone: string;
  AddressLine: string;
  Ward: string;
  District: string;
  Province: string;
  Country: string;
  PostalCode: string;
}
export interface Order extends BaseEntity {
  UserID: UUID;
  IdempotencyKey: string;
  CouponCode?: string;
  ShippingAddressID: UUID;
  AddressSnapshot: Address;
  Currency: string;
  Status: "pending" | "processing" | "delivered" | "cancelled";
  Subtotal: number;
  Discount: number;
  ShippingFee: number;
  Total: number;
}
export interface SellerOrder extends BaseEntity {
  OrderID: UUID;
  SellerID: UUID;
  Status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
  Subtotal: number;
  Commission: number;
  Total: number;
}
export interface OrderItem extends BaseEntity {
  SellerOrderID: UUID;
  VariantID: UUID;
  ProductName: string;
  SKU: string;
  VariantName: string;
  UnitPrice: number;
  Quantity: number;
  Discount: number;
}
export interface Payment extends BaseEntity {
  OrderID: UUID;
  Method: "cod" | "sepay";
  Status: "pending" | "paid" | "cancelled";
  Amount: number;
}
export interface OrderDetail {
  order: Order;
  sellerOrders: SellerOrder[];
  items: OrderItem[];
  payment: Payment;
}
export interface WishlistItem extends BaseEntity {
  WishlistID: UUID;
  ProductID: UUID;
}
export interface Review extends BaseEntity {
  UserID: UUID;
  ProductID: UUID;
  OrderItemID: UUID | null;
  Rating: number;
  Comment: string;
  Status: string;
}
export interface Seller extends BaseEntity {
  Name: string;
  Slug: string;
  CommissionRate: number;
  Status: "pending" | "approved" | "rejected" | "suspended";
}
export interface Metadata {
  productId: UUID;
  specifications: Record<string, unknown> | null;
  seo: Record<string, unknown> | null;
}
export interface PageParams {
  page?: number;
  limit?: number;
}
