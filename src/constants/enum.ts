export const USER_ROLES = {
  ADMIN: "admin",
  SELLER: "seller_admin",
  CUSTOMER: "customer",
} as const;

export const SELLER_STATUSES = ["pending", "approved", "rejected", "suspended"] as const;
export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
