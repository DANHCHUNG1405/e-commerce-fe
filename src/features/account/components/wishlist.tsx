"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountApi } from "../api/account.api";
import { useSessionStore } from "@/features/auth/store/session.store";
import { ProductCard } from "@/features/catalog/components/catalog";
import { Button, Notice, Page, LoginRequired, EmptyState } from "@/components/ui";
import { Pagination } from "@/components/pagination";
export function WishlistView() {
  const user = useSessionStore((s) => s.user);
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: ["wishlist", user?.id, page],
    queryFn: () => accountApi.wishlist({ page, limit: 12 }),
    enabled: !!user,
  });
  const remove = useMutation({
    mutationFn: accountApi.removeWishlist,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["wishlist"] }),
  });
  return (
    <Page
      title="Danh sách yêu thích"
      description="Những món đồ bạn đã để mắt tới — lưu lại để chọn mua khi sẵn sàng."
      action={
        <Link href="/products" className="text-sm font-medium text-orange-600">
          Tiếp tục khám phá →
        </Link>
      }
    >
      {!user ? (
        <LoginRequired />
      ) : (
        <>
          {list.isPending && <Notice>Đang tải…</Notice>}
          {list.error && <Notice error>{list.error.message}</Notice>}
          {remove.error && <Notice error>{remove.error.message}</Notice>}
          {list.data?.length === 0 && (
            <EmptyState
              title="Lưu lại những món bạn thích"
              description="Chạm vào biểu tượng trái tim trên trang sản phẩm để tạo bộ sưu tập của riêng bạn."
              action={
                <Link href="/products" className="text-sm font-semibold text-orange-600">
                  Khám phá sản phẩm →
                </Link>
              }
            />
          )}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {list.data?.map((item) => (
              <div key={item.id} className="flex flex-col gap-3">
                <ProductCard id={item.ProductID} />
                <Button
                  variant="secondary"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(item.ProductID)}
                >
                  Bỏ yêu thích
                </Button>
              </div>
            ))}
          </div>
          {list.data && (list.data.length > 0 || page > 1) && (
            <Pagination
              page={page}
              hasNext={list.data.length === 12}
              busy={list.isFetching}
              onChange={setPage}
            />
          )}
        </>
      )}
    </Page>
  );
}
