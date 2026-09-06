"use client";
import { create } from "zustand";
import type { TokenPair, User } from "@/lib/api/types";
interface SessionState { user: User | null; tokens: TokenPair | null; setSession: (user: User, tokens: TokenPair) => void; setTokens: (tokens: TokenPair) => void; clearSession: () => void }
export const useSessionStore = create<SessionState>()((set) => ({ user: null, tokens: null, setSession: (user, tokens) => set({ user, tokens }), setTokens: (tokens) => set({ tokens }), clearSession: () => set({ user: null, tokens: null }) }));
