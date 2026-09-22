import type { AppRole } from "@/lib/api/types";

export const PERMISSIONS = {
  ADMIN: { VIEW: "admin" },
  SELLER: { VIEW: "seller_admin" },
} as const satisfies Record<string, Record<string, AppRole>>;

export function hasRole(roles: AppRole[], role: AppRole) {
  return roles.includes(role);
}
