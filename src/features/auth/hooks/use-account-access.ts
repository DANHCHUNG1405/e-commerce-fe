"use client";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useSessionStore } from "../store/session.store";

export function useAccountAccess() {
  const userId = useSessionStore((s) => s.user?.id);
  const permissions = useQuery({
    queryKey: ["account-permissions", userId],
    queryFn: authApi.permissions,
    enabled: !!userId,
    retry: false,
  });
  const memberships = useQuery({
    queryKey: ["seller-memberships", userId],
    queryFn: authApi.memberships,
    enabled: !!userId,
    retry: false,
  });
  return {
    permissions,
    memberships,
    isAdmin: !!permissions.data?.roles.includes("admin"),
    isDriver: !!permissions.data?.roles.includes("driver"),
    isSeller: !!memberships.data?.length,
    membership: (sellerId: string) => memberships.data?.find((m) => m.sellerId === sellerId),
  };
}
