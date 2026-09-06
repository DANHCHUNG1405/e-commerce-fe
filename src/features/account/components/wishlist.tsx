"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountApi } from "../api/account.api";
import { useSessionStore } from "@/features/auth/store/session.store";
import { ProductCard } from "@/features/catalog/components/catalog";
import { Button, Notice, Page, LoginRequired } from "@/components/ui";
export function WishlistView() {
  const user = useSessionStore(s => s.user); const cache = useQueryClient(); const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: ["wishlist", user?.id, page], queryFn: () => accountApi.wishlist({ page, limit: 12 }), enabled: !!user });
  const remove = useMutation({ mutationFn: accountApi.removeWishlist, onSuccess: () => cache.invalidateQueries({ queryKey: ["wishlist"] }) });
  return <Page title="Danh sách yêu thích">{!user ? <LoginRequired/> : <>{list.isPending && <Notice>Đang tải…</Notice>}{list.error && <Notice error>{list.error.message}</Notice>}{remove.error && <Notice error>{remove.error.message}</Notice>}{list.data?.length === 0 && <Notice>Chưa có sản phẩm yêu thích.</Notice>}<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{list.data?.map(item => <div key={item.id} className="flex flex-col gap-3"><ProductCard id={item.ProductID}/><Button disabled={remove.isPending} onClick={() => remove.mutate(item.ProductID)}>Bỏ yêu thích</Button></div>)}</div><div className="mt-6 flex gap-4"><Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</Button><Button disabled={list.data?.length !== 12} onClick={() => setPage(p => p + 1)}>Tiếp</Button></div></>}</Page>;
}
