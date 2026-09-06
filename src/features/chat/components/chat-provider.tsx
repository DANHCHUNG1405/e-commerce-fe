"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "@/features/auth/store/session.store";
import { ApiError, refreshSession } from "@/lib/api/client";
import type { Envelope } from "@/lib/api/types";
type Frame = Envelope<unknown> & { event: string; requestId?: string };
type Listener = (frame: Frame) => void;
interface Connection {
  status: string;
  send: <T>(event: string, data: unknown) => Promise<T>;
  subscribe: (listener: Listener) => () => void;
}
const Context = createContext<Connection | null>(null);
export function useChat() {
  const chat = useContext(Context);
  if (!chat) throw new Error("Missing ChatProvider");
  return chat;
}
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const userId = useSessionStore((s) => s.user?.id);
  const cache = useQueryClient();
  const [status, setStatus] = useState("offline");
  const socket = useRef<WebSocket | null>(null);
  const ready = useRef(false);
  const blockedUntil = useRef(0);
  const listeners = useRef(new Set<Listener>());
  const pending = useRef(
    new Map<
      string,
      {
        resolve: (value: unknown) => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
      }
    >(),
  );
  useEffect(() => {
    if (!userId) return;
    let stopped = false;
    let retries = 0;
    let refreshedForAuth = false;
    let timer: ReturnType<typeof setTimeout>;
    let authTimer: ReturnType<typeof setTimeout>;
    const requests = pending.current;
    const cleanupRequests = () => {
      for (const item of requests.values()) {
        clearTimeout(item.timer);
        item.reject(new Error("Mất kết nối. Có thể thử lại tin nhắn."));
      }
      requests.clear();
    };
    const connect = () => {
      if (stopped || !useSessionStore.getState().tokens) return;
      setStatus("connecting");
      const fallback = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.hostname}:8080/api/v1/ws`;
      let ws: WebSocket;
      try {
        ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || fallback);
      } catch {
        setStatus("offline");
        return;
      }
      socket.current = ws;
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            event: "auth",
            data: { token: useSessionStore.getState().tokens?.accessToken },
          }),
        );
        authTimer = setTimeout(() => ws.close(), 5000);
      };
      ws.onmessage = (event) => {
        let frame: Frame;
        try {
          frame = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!frame || typeof frame !== "object" || !frame.data || typeof frame.event !== "string")
          return;
        if (frame.statusCode === 429) blockedUntil.current = Date.now() + 30000;
        if (
          frame.event === "auth:ok" &&
          !frame.error &&
          (frame.data.content as { userId?: string })?.userId === userId
        ) {
          clearTimeout(authTimer);
          ready.current = true;
          retries = 0;
          refreshedForAuth = false;
          setStatus("connected");
          void cache.invalidateQueries({ queryKey: ["chat-inbox"] });
        }
        if (frame.event === "ack" && frame.requestId) {
          const item = requests.get(frame.requestId);
          if (item) {
            clearTimeout(item.timer);
            requests.delete(frame.requestId);
            if (frame.error) item.reject(new ApiError(frame.statusCode, frame.data.msg));
            else item.resolve(frame.data.content);
          }
        }
        for (const listener of listeners.current) listener(frame);
        if (frame.event === "chat:message" || frame.event === "chat:read")
          void cache.invalidateQueries({ queryKey: ["chat-inbox"] });
      };
      ws.onclose = async (event) => {
        clearTimeout(authTimer);
        ready.current = false;
        cleanupRequests();
        if (stopped) return;
        setStatus("offline");
        if (event.code === 4401) {
          if (refreshedForAuth) {
            useSessionStore.getState().clearSession();
            return;
          }
          refreshedForAuth = true;
          try {
            await refreshSession();
          } catch {
            return;
          }
        }
        if (stopped) return;
        const delay =
          event.code === 1013
            ? 30000
            : Math.min(30000, 1000 * 2 ** Math.min(retries++, 5)) + Math.random() * 500;
        timer = setTimeout(connect, delay);
      };
    };
    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearTimeout(authTimer);
      ready.current = false;
      if (socket.current) {
        socket.current.onclose = null;
        socket.current.close();
        socket.current = null;
      }
      cleanupRequests();
    };
  }, [userId, cache]);
  const send = useCallback(
    <T,>(event: string, data: unknown): Promise<T> =>
      new Promise((resolve, reject) => {
        if (Date.now() < blockedUntil.current) {
          reject(new ApiError(429, "Gửi quá nhanh. Vui lòng đợi khoảng 30 giây."));
          return;
        }
        if (pending.current.size >= 24) {
          reject(new Error("Có nhiều yêu cầu đang chờ. Vui lòng thử lại sau."));
          return;
        }
        if (!ready.current || socket.current?.readyState !== WebSocket.OPEN) {
          reject(new Error("Chat chưa kết nối. Vui lòng thử lại."));
          return;
        }
        const requestId = crypto.randomUUID();
        const payload = JSON.stringify({ event, requestId, data });
        if (new TextEncoder().encode(payload).length > 32768) {
          reject(new Error("Tin nhắn vượt giới hạn khung truyền."));
          return;
        }
        const timer = setTimeout(() => {
          pending.current.delete(requestId);
          reject(new Error("Chưa nhận xác nhận. Thử lại sẽ không tạo trùng tin."));
        }, 10000);
        pending.current.set(requestId, { resolve: (value) => resolve(value as T), reject, timer });
        try {
          socket.current.send(payload);
        } catch {
          clearTimeout(timer);
          pending.current.delete(requestId);
          reject(new Error("Không gửi được tin. Vui lòng thử lại."));
        }
      }),
    [],
  );
  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);
  return (
    <Context.Provider value={{ status: userId ? status : "offline", send, subscribe }}>
      {children}
    </Context.Provider>
  );
}
