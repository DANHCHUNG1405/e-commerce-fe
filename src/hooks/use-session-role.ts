"use client";

import { useSessionStore } from "@/features/auth/store/session.store";
import type { AppRole } from "@/lib/api/types";

export function useSessionRole() {
  const roles = useSessionStore((state) => state.roles);
  return {
    roles,
    isAdmin: roles.includes("admin"),
    isSeller: roles.includes("seller_admin"),
    hasRole: (role: AppRole) => roles.includes(role),
  };
}
