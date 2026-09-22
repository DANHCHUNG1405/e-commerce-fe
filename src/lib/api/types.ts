export type UUID = string;
export type ISODate = string;
export type AppRole = "admin" | "customer" | "driver" | "seller_admin";
export interface AccountPermissions {
  roles: AppRole[];
  permissions: string[];
}
export interface SellerMembership {
  sellerId: UUID;
  sellerName: string;
  sellerSlug: string;
  sellerStatus: string;
  role: "owner" | "manager" | "staff";
}
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
  Description?: string;
  pickupAddress?: PickupAddress | null;
}
export interface AdminSeller extends Seller {
  ownerId?: UUID;
  ownerEmail?: string;
  description?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
}
export interface AdminStats {
  users: number;
  pendingSellers: number;
  orders: number;
  pendingOrders: number;
  deliveredOrders: number;
  revenue: number;
  pendingPayments: number;
}
export interface PickupAddress {
  recipientName: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  province: string;
}
export interface SellerMember extends BaseEntity {
  SellerID: UUID;
  UserID: UUID;
  Role: "owner" | "manager" | "staff";
}
export interface SellerStats {
  products: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  lowStockVariants: number;
  deliveredSales: number;
}
export interface InventoryMovement extends BaseEntity {
  VariantID: UUID;
  Quantity: number;
  Type: string;
  ReferenceID: UUID | null;
  Note: string;
}
export interface Shipment extends BaseEntity {
  SellerOrderID: UUID;
  driverId: UUID | null;
  Carrier: string;
  TrackingNumber: string;
  Status:
    | "pending"
    | "assigned"
    | "accepted"
    | "picked_up"
    | "delivering"
    | "failed"
    | "returned"
    | "delivered";
  addressSnapshot: Address | null;
  pickupSnapshot: PickupAddress | null;
  codAmount: number;
  codCollected: boolean;
  codSettled: boolean;
}
export interface ShipmentEvent extends BaseEntity {
  ShipmentID: UUID;
  Status: string;
  Description: string;
  actorId: UUID | null;
  requestId: string | null;
}
export interface SellerOrderDetail {
  sellerOrder: SellerOrder;
  items: OrderItem[];
  addressSnapshot: Address;
  shipment: Shipment | null;
  paymentMethod: string;
  paymentStatus: string;
}
export interface DriverProfile extends BaseEntity {
  UserID?: UUID;
  userId?: UUID;
  Phone?: string;
  phone?: string;
  VehiclePlate?: string;
  vehiclePlate?: string;
  Status?: string;
  status?: string;
}
export interface PaymentWebhookReceipt extends BaseEntity {
  Provider: string;
  ProviderTransactionID: string;
  PaymentID: UUID | null;
  Code: string;
  Bank: string;
  AccountNumber: string;
  Direction: string;
  Status: string;
  Amount: number;
}
export interface Notification {
  id: UUID;
  userId: UUID;
  eventId: UUID;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  createdAt: ISODate;
  readAt?: ISODate | null;
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
