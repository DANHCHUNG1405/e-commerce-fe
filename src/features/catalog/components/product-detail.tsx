"use client";
import { useState } from "react";
import { ChatShopButton } from "@/features/chat/components/chat-shop-button";
import Image from "next/image";
import { Package, Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogApi } from "../api/catalog.api";
import { cartApi } from "@/features/cart/api/cart.api";
import { accountApi } from "@/features/account/api/account.api";
import { useSessionStore } from "@/features/auth/store/session.store";
import { Button, Notice, Page, LoginRequired } from "@/components/ui";
import { formatVnd } from "@/lib/format";
export function ProductDetailView({ id }: { id: string }) {
  const user = useSessionStore((s) => s.user);
  const cache = useQueryClient();
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const detail = useQuery({ queryKey: ["product", id], queryFn: () => catalogApi.product(id) });
  const reviews = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => catalogApi.reviews(id, { limit: 20 }),
  });
  const variant = detail.data?.variants.find((v) => v.id === variantId) ?? detail.data?.variants[0];
  const add = useMutation({
    mutationFn: () => cartApi.setItem(variant!.id, quantity),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["cart"] }),
    onError: () => {
      void detail.refetch();
    },
  });
  const wish = useMutation({
    mutationFn: () => accountApi.addWishlist(id),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["wishlist"] }),
  });
  if (!detail.data)
    return (
      <Page title="Chi tiết sản phẩm">
        <Notice error={detail.isError}>{detail.error?.message ?? "Đang tải…"}</Notice>
      </Page>
    );
  const { product, images, variants } = detail.data;
  return (
    <Page title={product.Name}>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-sm bg-zinc-100">
          {images[0]?.URL ? (
            <Image
              unoptimized
              src={images[0].URL}
              alt={product.Name}
              fill
              className="object-cover"
            />
          ) : (
            <Package size={100} className="text-zinc-300" />
          )}
        </div>
        <div>
          <ChatShopButton sellerId={product.SellerID} />
          <p className="mb-6 text-3xl font-bold">
            {variant ? formatVnd(variant.Price) : "Chưa có phiên bản bán"}
          </p>
          <p className="mb-8 whitespace-pre-line leading-7 text-zinc-600">{product.Description}</p>
          <label className="block text-sm font-medium">
            Phiên bản
            <select
              className="mt-2"
              value={variant?.id ?? ""}
              onChange={(e) => setVariantId(e.target.value)}
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.Name} · Còn {v.Stock}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-5 block text-sm font-medium">
            Số lượng trong giỏ
            <input
              className="mt-2"
              type="number"
              min={1}
              max={Math.min(10000, variant?.Stock ?? 0)}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          {user ? (
            <div className="mt-6 flex gap-3">
              <Button
                disabled={
                  !variant ||
                  quantity < 1 ||
                  !Number.isInteger(quantity) ||
                  quantity > Math.min(10000, variant.Stock) ||
                  add.isPending
                }
                onClick={() => add.mutate()}
              >
                Cập nhật giỏ hàng
              </Button>
              <Button
                aria-label="Thêm yêu thích"
                disabled={wish.isPending}
                onClick={() => wish.mutate()}
              >
                <Heart size={19} />
              </Button>
            </div>
          ) : (
            <LoginRequired />
          )}
          {add.isSuccess && <Notice>Đã cập nhật giỏ hàng.</Notice>}
          {wish.isSuccess && <Notice>Đã thêm vào yêu thích.</Notice>}
          {(add.error || wish.error) && <Notice error>{(add.error || wish.error)?.message}</Notice>}
        </div>
      </div>
      <section className="mt-14 border-t border-zinc-200 pt-8">
        <h2 className="text-xl font-bold">Đánh giá gần đây</h2>
        {reviews.error && <Notice error>{reviews.error.message}</Notice>}
        {reviews.data?.length === 0 && <Notice>Chưa có đánh giá.</Notice>}
        {reviews.data?.map((r) => (
          <article className="my-4 rounded-sm bg-zinc-50 p-5" key={r.id}>
            <p className="font-semibold">{r.Rating}/5 ★</p>
            <p className="mt-2 text-zinc-600">{r.Comment}</p>
          </article>
        ))}
      </section>
    </Page>
  );
}
