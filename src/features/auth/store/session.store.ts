"use client";
import { create } from "zustand";
import type { AppRole, TokenPair, User } from "@/lib/api/types";

function readRoles(token: string): AppRole[] {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      role?: string;
      roles?: string[];
    };
    const values = payload.roles ?? (payload.role ? [payload.role] : []);
    return values.filter((role): role is AppRole =>
      ["admin", "seller_admin", "customer", "driver"].includes(role),
    );
  } catch {
    return [];
  }
}
interface SessionState {
  user: User | null;
  tokens: TokenPair | null;
  roles: AppRole[];
  setSession: (user: User, tokens: TokenPair) => void;
  setTokens: (tokens: TokenPair) => void;
  clearSession: () => void;
}
export const useSessionStore = create<SessionState>()((set) => ({
  user: null,
  tokens: null,
  roles: [],
  setSession: (user, tokens) => set({ user, tokens, roles: readRoles(tokens.accessToken) }),
  setTokens: (tokens) => set({ tokens, roles: readRoles(tokens.accessToken) }),
  clearSession: () => set({ user: null, tokens: null, roles: [] }),
}));
