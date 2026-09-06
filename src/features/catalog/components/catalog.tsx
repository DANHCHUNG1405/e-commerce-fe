"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, ChevronLeft, ChevronRight, SearchX, RotateCcw, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../api/catalog.api";
import { formatVnd } from "@/lib/format";
import { Button, Page } from "@/components/ui";

export function ProductCard({ id }: { id: string }) {
  const detail = useQuery({ queryKey: ["product", id], queryFn: () => catalogApi.product(id) });
  const product = detail.data;
  const [brokenImage, setBrokenImage] = useState(false);
  const inStock = product?.variants.some(v => v.Stock > 0);
  return <Link href={`/products/${id}`} className="group flex min-w-0 flex-col overflow-hidden rounded-sm border border-transparent bg-white shadow-xs transition duration-200 hover:-translate-y-1 hover:border-[#ee4d2d] hover:shadow-md">
    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#f8f8f8]">
      {product?.images[0]?.URL && !brokenImage ? <Image unoptimized src={product.images[0].URL} alt={product.product.Name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw" className="object-cover transition duration-300 group-hover:scale-105" onError={() => setBrokenImage(true)}/> : <div className="flex flex-col items-center gap-3 text-zinc-300"><Package size={48} strokeWidth={1}/><span className="text-[10px] tracking-widest">NOVA MARKET</span></div>}
      {product && !inStock && <span className="absolute bottom-2 left-2 rounded-sm bg-zinc-800/75 px-2 py-1 text-[10px] text-white">Tạm hết hàng</span>}
    </div>
    <div className="flex flex-1 flex-col p-3">
      <h2 className="line-clamp-2 min-h-10 text-sm leading-5 text-zinc-800">{product?.product.Name ?? (detail.isError ? "Sản phẩm chưa khả dụng" : "Đang tải sản phẩm…")}</h2>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-1"><p className="text-base font-medium text-[#ee4d2d] sm:text-lg">{product?.variants.length ? formatVnd(Math.min(...product.variants.map(v => v.Price))) : "Xem chi tiết"}</p>{(product?.variants.length ?? 0) > 1 && <span className="text-[10px] text-zinc-400">Giá từ</span>}</div>
      <p className="mt-2 text-[11px] text-zinc-400">{product ? `${product.variants.length} phiên bản` : "Khám phá sản phẩm"}</p>
    </div>
  </Link>;
}

export function ProductFeed({ q = "", page = 1, limit = 12 }: { q?: string; page?: number; limit?: number }) {
  const products = useQuery({ queryKey: ["products", page, q, limit], queryFn: () => catalogApi.products({ page, limit, q }) });
  return <ProductResults data={products.data} pending={products.isPending} error={products.error} retry={() => { void products.refetch(); }}/>;
}

function ProductResults({ data, pending, error, retry }: { data?: { id: string }[]; pending: boolean; error: Error | null; retry: () => void }) {
  if (pending) return <div role="status" aria-label="Đang tải sản phẩm" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{Array.from({length: 12}, (_, i) => <div key={i} aria-hidden="true" className="animate-pulse bg-white p-2 motion-reduce:animate-none"><div className="aspect-square bg-zinc-100"/><div className="mt-3 h-3 w-4/5 bg-zinc-100"/><div className="mb-3 mt-3 h-4 w-1/2 bg-zinc-100"/></div>)}</div>;
  if (error) return <div role="alert" className="flex flex-col items-center bg-white px-5 py-12 text-center"><Package size={38} strokeWidth={1} className="mb-4 text-zinc-400"/><h3 className="font-semibold text-zinc-700">Chưa thể tải sản phẩm</h3><p className="mb-5 mt-2 max-w-sm text-sm text-zinc-500">Vui lòng thử lại sau ít phút để tiếp tục mua sắm.</p><Button onClick={retry}><RotateCcw size={15}/>Thử lại</Button></div>;
  if (!data?.length) return <div className="flex flex-col items-center bg-white px-5 py-14 text-center"><SearchX size={44} strokeWidth={1} className="mb-4 text-zinc-400"/><h3 className="font-semibold">Chưa tìm thấy sản phẩm</h3><p className="mt-2 text-sm text-zinc-500">Thử từ khóa khác hoặc quay lại khám phá sau nhé.</p></div>;
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{data.map(p => <ProductCard key={p.id} id={p.id}/>)}</div>;
}

export function Catalog({ initialQuery = "" }: { initialQuery?: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialQuery);
  const [q, setQ] = useState(initialQuery);
  const products = useQuery({ queryKey: ["products", page, q, 18], queryFn: () => catalogApi.products({ page, limit: 18, q }) });
  return <Page title={q ? `Kết quả cho “${q}”` : "Tất cả sản phẩm"}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-sm bg-white p-4">
      <form className="flex w-full gap-2 sm:w-96" onSubmit={e => { e.preventDefault(); setQ(search.trim()); setPage(1); }}><input aria-label="Tên sản phẩm" placeholder="Tìm trong cửa hàng…" value={search} onChange={e => setSearch(e.target.value)}/><Button type="submit" aria-label="Tìm kiếm"><Search size={18}/></Button></form>
      <div className="flex items-center gap-3 text-sm text-zinc-500"><span>Trang <strong className="text-[#ee4d2d]">{page}</strong></span><button aria-label="Trang trước" className="border border-zinc-200 p-2 disabled:opacity-30" disabled={page === 1 || products.isFetching} onClick={() => setPage(p => p - 1)}><ChevronLeft size={18}/></button><button aria-label="Trang tiếp" className="border border-zinc-200 p-2 disabled:opacity-30" disabled={products.data?.length !== 18 || products.isFetching} onClick={() => setPage(p => p + 1)}><ChevronRight size={18}/></button></div>
    </div>
    <ProductResults data={products.data} pending={products.isPending} error={products.error} retry={() => { void products.refetch(); }}/>
    <div className="mt-8 flex items-center justify-center gap-5"><Button disabled={page === 1 || products.isFetching} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16}/>Trước</Button><span className="text-sm text-zinc-500">Trang {page}</span><Button disabled={products.data?.length !== 18 || products.isFetching} onClick={() => setPage(p => p + 1)}>Tiếp<ChevronRight size={16}/></Button></div>
  </Page>;
}
