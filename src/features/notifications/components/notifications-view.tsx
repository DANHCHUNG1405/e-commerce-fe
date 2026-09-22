"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "@/features/auth/store/session.store";
import { notificationsApi } from "../api/notifications.api";
import { Button, LoginRequired, Notice, Page } from "@/components/ui";
import { Pagination } from "@/components/pagination";
export function NotificationsView() {
  const user = useSessionStore((s) => s.user);
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ["notifications", user?.id, page],
    queryFn: () => notificationsApi.list(page),
    enabled: !!user,
  });
  const count = useQuery({
    queryKey: ["notification-count", user?.id],
    queryFn: notificationsApi.unreadCount,
    enabled: !!user,
  });
  const read = useMutation({
    mutationFn: (id: string) => notificationsApi.read(id),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["notifications"] });
      cache.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });
  const all = useMutation({
    mutationFn: notificationsApi.readAll,
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["notifications"] });
      cache.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });
  if (!user)
    return (
      <Page title="Thông báo">
        <LoginRequired />
      </Page>
    );
  return (
    <Page
      title="Thông báo"
      action={
        <Button disabled={!count.data?.count || all.isPending} onClick={() => all.mutate()}>
          Đánh dấu tất cả đã đọc
        </Button>
      }
    >
      <p className="mb-4 text-sm">Chưa đọc: {count.data?.count ?? "…"}</p>
      {(list.error || count.error || read.error || all.error) && (
        <Notice error>{(list.error || count.error || read.error || all.error)?.message}</Notice>
      )}
      {list.isPending && <Notice>Đang tải…</Notice>}
      {list.data?.length === 0 && <Notice>Chưa có thông báo.</Notice>}
      <div className="grid gap-3">
        {list.data?.map((n) => (
          <article
            key={n.id}
            className={`rounded-xl border p-5 ${n.readAt ? "bg-white" : "border-orange-200 bg-orange-50"}`}
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-semibold">{n.title}</h2>
                <p className="mt-1 text-sm">{n.body}</p>
                <time className="mt-2 block text-xs text-zinc-500">
                  {new Date(n.createdAt).toLocaleString("vi-VN")}
                </time>
              </div>
              {!n.readAt && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={read.isPending}
                  onClick={() => read.mutate(n.id)}
                >
                  Đã đọc
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      {list.data && (list.data.length > 0 || page > 1) && (
        <Pagination page={page} hasNext={list.data.length === 20} onChange={setPage} />
      )}
    </Page>
  );
}
