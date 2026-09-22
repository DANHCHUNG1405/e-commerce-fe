"use client";

import { useAccountAccess } from "@/features/auth/hooks/use-account-access";
import type { AppRole } from "@/lib/api/types";

export function useSessionRole() {
  const access = useAccountAccess();
  const roles = access.permissions.data?.roles ?? [];
  return {
    roles,
    isAdmin: access.isAdmin,
    isSeller: access.isSeller,
    hasRole: (role: AppRole) => (role === "seller_admin" ? access.isSeller : roles.includes(role)),
  };
}
