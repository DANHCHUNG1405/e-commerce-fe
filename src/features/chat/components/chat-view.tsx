"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi, type ChatMessage } from "../api/chat.api";
import { useChat } from "./chat-provider";
import { mergeMessages, validMessage } from "../lib/messages";
import { useSessionStore } from "@/features/auth/store/session.store";
import { Button, Notice, Page, LoginRequired } from "@/components/ui";
export function ChatView({ conversationId }: { conversationId?: string }) {
  const user = useSessionStore((s) => s.user);
  return (
    <Page title="Tin nhắn">
      {user ? (
        <Inbox key={user.id} userId={user.id} conversationId={conversationId} />
      ) : (
        <LoginRequired />
      )}
    </Page>
  );
}
function Inbox({ userId, conversationId }: { userId: string; conversationId?: string }) {
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ["chat-inbox", userId, page],
    queryFn: () => chatApi.inbox(page),
    retry: false,
  });
  return (
    <div className="grid gap-5 md:grid-cols-[260px_1fr]">
      <aside className="bg-white p-4">
        <h2 className="mb-4 font-semibold">Hội thoại</h2>
        {list.error && <Notice error>{list.error.message}</Notice>}
        {list.data?.length === 0 && <Notice>Chưa có hội thoại. Mở chat từ trang sản phẩm.</Notice>}
        {list.data?.map((c) => (
          <Link
            className={`mb-2 block break-all border p-3 text-sm ${c.id === conversationId ? "border-orange-400 bg-orange-50" : "border-zinc-200"}`}
            key={c.id}
            href={`/chat/${c.id}`}
          >
            Shop {c.sellerId.slice(0, 8)}
            <span className="mt-1 block text-xs text-zinc-500">
              {c.unreadCount > 0 ? `${c.unreadCount} tin chưa đọc` : "Đã đọc"}
            </span>
          </Link>
        ))}
        <div className="flex gap-2">
          <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <Button disabled={list.data?.length !== 20} onClick={() => setPage((p) => p + 1)}>
            Tiếp
          </Button>
        </div>
      </aside>
      {conversationId ? (
        <Thread key={conversationId} id={conversationId} userId={userId} />
      ) : (
        <Notice>Chọn một hội thoại để bắt đầu.</Notice>
      )}
    </div>
  );
}
function Thread({ id, userId }: { id: string; userId: string }) {
  const chat = useChat();
  const subscribe = chat.subscribe;
  const cache = useQueryClient();
  const [body, setBody] = useState("");
  const [attempt, setAttempt] = useState<{ clientMessageId: string; body: string } | null>(null);
  const [typing, setTyping] = useState(false);
  const [oldDone, setOldDone] = useState(false);
  const typingExpiry = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const typingStop = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastTyping = useRef(0);
  const cursor = useRef<number | undefined>(undefined);
  const sentRead = useRef(0);
  const viewport = useRef<HTMLDivElement>(null);
  const queryKey = ["chat-messages", userId, id];
  const history = useQuery({
    queryKey,
    retry: false,
    staleTime: 0,
    refetchInterval: 15000,
    queryFn: async ({ signal }) => {
      let merged = cache.getQueryData<ChatMessage[]>(["chat-messages", userId, id]) ?? [];
      let after = cursor.current;
      while (true) {
        const page = await chatApi.messages(id, after === undefined ? {} : { after }, signal);
        merged = mergeMessages(merged, page);
        if (page.length) {
          after = page[page.length - 1].sequence;
        } else if (after === undefined) after = 0;
        if (page.length < 50 || signal.aborted) break;
      }
      if (!signal.aborted) cursor.current = after;
      return mergeMessages(
        cache.getQueryData<ChatMessage[]>(["chat-messages", userId, id]) ?? [],
        merged,
      );
    },
  });
  useEffect(() => {
    const unsubscribe = subscribe((frame) => {
      const data = frame.data?.content as
        { conversationId?: string; userId?: string; typing?: boolean } | undefined;
      if (
        frame.event === "auth:ok" ||
        (frame.event === "chat:message" && data?.conversationId === id)
      )
        void cache.invalidateQueries({ queryKey: ["chat-messages", userId, id] });
      if (frame.event === "chat:typing" && data?.conversationId === id && data.userId !== userId) {
        setTyping(!!data.typing);
        clearTimeout(typingExpiry.current);
        typingExpiry.current = setTimeout(() => setTyping(false), 4000);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(typingExpiry.current);
      clearTimeout(typingStop.current);
    };
  }, [subscribe, cache, id, userId]);
  const last = history.data?.at(-1)?.sequence ?? 0;
  useEffect(() => {
    const markRead = () => {
      const view = viewport.current;
      if (
        !view ||
        view.scrollHeight - view.scrollTop - view.clientHeight > 30 ||
        document.visibilityState !== "visible" ||
        !document.hasFocus() ||
        last <= sentRead.current
      )
        return;
      sentRead.current = last;
      void chatApi
        .read(id, last)
        .then(() => cache.invalidateQueries({ queryKey: ["chat-inbox"] }))
        .catch(() => {
          sentRead.current = 0;
        });
    };
    const timer = setTimeout(markRead, 700);
    const view = viewport.current;
    view?.addEventListener("scroll", markRead);
    document.addEventListener("visibilitychange", markRead);
    window.addEventListener("focus", markRead);
    return () => {
      clearTimeout(timer);
      view?.removeEventListener("scroll", markRead);
      document.removeEventListener("visibilitychange", markRead);
      window.removeEventListener("focus", markRead);
    };
  }, [last, id, cache]);
  const older = useMutation({
    mutationFn: () => chatApi.messages(id, { before: history.data![0].sequence }),
    onSuccess: (page) => {
      if (page.length < 50) setOldDone(true);
      cache.setQueryData<ChatMessage[]>(queryKey, (old) => mergeMessages(old ?? [], page));
    },
  });
  const send = useMutation({
    mutationFn: (data: { clientMessageId: string; body: string }) =>
      chat.send<ChatMessage>("chat:send", { conversationId: id, ...data }),
    retry: false,
    onSuccess: () => {
      setBody("");
      setAttempt(null);
      void history.refetch();
    },
    onError: () => {
      void history.refetch();
    },
  });
  const notifyTyping = () => {
    if (chat.status !== "connected") return;
    if (Date.now() - lastTyping.current > 1500) {
      lastTyping.current = Date.now();
      void chat.send("chat:typing", { conversationId: id, typing: true }).catch(() => {});
    }
    clearTimeout(typingStop.current);
    typingStop.current = setTimeout(() => {
      void chat.send("chat:typing", { conversationId: id, typing: false }).catch(() => {});
    }, 2000);
  };
  return (
    <section className="min-w-0 bg-white p-4">
      <div className="mb-4 flex justify-between">
        <h2 className="font-semibold">Hội thoại #{id.slice(0, 8)}</h2>
        <span className="text-xs text-zinc-500">
          {chat.status === "connected" ? "Đã kết nối chat" : "Đang kết nối lại…"}
        </span>
      </div>
      {history.error && <Notice error>{history.error.message}</Notice>}
      <Button
        disabled={!history.data?.length || oldDone || older.isPending || history.isFetching}
        onClick={() => older.mutate()}
      >
        Tải tin cũ hơn
      </Button>
      <button
        className="ml-3 text-sm text-orange-600"
        onClick={() => {
          viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: "smooth" });
        }}
      >
        Đến tin mới nhất
      </button>
      {older.error && <Notice error>{older.error.message}</Notice>}
      <div
        ref={viewport}
        className="my-4 max-h-[50vh] space-y-3 overflow-y-auto border-y border-zinc-100 py-4"
        aria-label="Lịch sử tin nhắn"
      >
        {history.isPending && <Notice>Đang tải tin nhắn…</Notice>}
        {history.data?.map((message) => (
          <article
            key={message.id}
            className={`max-w-[85%] whitespace-pre-wrap break-words rounded-lg p-3 text-sm ${message.senderId === userId ? "ml-auto bg-orange-50" : "bg-zinc-100"}`}
          >
            <p>{message.body}</p>
            <time className="mt-2 block text-[10px] text-zinc-400">
              {new Date(message.CreatedAt).toLocaleString("vi-VN")}
            </time>
          </article>
        ))}
      </div>
      {typing && chat.status === "connected" && (
        <p className="mb-2 text-xs text-zinc-500">Đang nhập…</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!validMessage(body) || send.isPending) return;
          const next = attempt ?? { clientMessageId: crypto.randomUUID(), body };
          setAttempt(next);
          send.mutate(next);
        }}
      >
        <textarea
          aria-label="Tin nhắn"
          placeholder="Nhập tin nhắn…"
          rows={3}
          value={body}
          disabled={!!attempt}
          onChange={(e) => {
            setBody(e.target.value);
            notifyTyping();
          }}
        />
        {body && !validMessage(body) && (
          <Notice error>Tin nhắn cần có nội dung, tối đa 5000 ký tự và 20000 byte.</Notice>
        )}
        <Button
          className="mt-3"
          disabled={send.isPending || !validMessage(body) || chat.status !== "connected"}
        >
          {send.isPending ? "Đang gửi…" : attempt ? "Thử lại tin nhắn" : "Gửi tin nhắn"}
        </Button>
        {send.error && <Notice error>{send.error.message}</Notice>}
      </form>
    </section>
  );
}
