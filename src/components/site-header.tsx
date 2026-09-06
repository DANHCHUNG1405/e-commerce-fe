"use client";

import Link from "next/link";
import { Heart, LogOut, ShoppingBag, UserRound, Search, House, Grid2X2, ClipboardList } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { authApi } from "@/features/auth/api/auth.api";
import { cartApi } from "@/features/cart/api/cart.api";
import { useSessionStore } from "@/features/auth/store/session.store";

const navigation = [
  { href: "/", label: "Trang chủ", icon: House },
  { href: "/products", label: "Khám phá", icon: Grid2X2 },
  { href: "/wishlist", label: "Yêu thích", icon: Heart },
  { href: "/orders", label: "Đơn hàng", icon: ClipboardList },
  { href: "/account", label: "Tài khoản", icon: UserRound },
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const cache = useQueryClient();
  const [logoutError, setLogoutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [search, setSearch] = useState("");
  const { user, tokens, clearSession } = useSessionStore();
  const cart = useQuery({ queryKey: ["cart", user?.id], queryFn: cartApi.list, enabled: !!user });
  const count = cart.data?.reduce((total, item) => total + item.Quantity, 0) ?? 0;
  const signOut = async () => {
    setSigningOut(true);
    try { if (tokens) await authApi.logout(tokens.refreshToken); }
    catch { setLogoutError("Đã đăng xuất trên thiết bị. Chưa xác nhận thu hồi phiên trên máy chủ."); }
    finally { clearSession(); cache.clear(); setSigningOut(false); router.push("/"); }
  };
  return <>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3">Đến nội dung chính</a>
    <header className="sticky top-0 z-30 bg-gradient-to-b from-[#ed4025] to-[#ff6537] text-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="hidden h-9 items-center justify-between text-xs md:flex">
          <p>Mua sắm mỗi ngày · Khám phá điều bạn thích</p>
          <div className="flex items-center gap-5">
            <Link href="/orders">Theo dõi đơn hàng</Link><Link href="/wishlist">Yêu thích</Link>
            {user ? <><Link href="/account">{user.fullName || user.email}</Link><button disabled={signingOut} onClick={signOut} aria-label="Đăng xuất"><LogOut size={14}/></button></> : <><Link href="/register">Đăng ký</Link><span className="opacity-40">|</span><Link href="/login">Đăng nhập</Link></>}
          </div>
        </div>
        <div className="flex items-center gap-3 py-4 sm:gap-8 md:pb-2">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Nova Market - Trang chủ"><ShoppingBag className="size-8 sm:size-10" strokeWidth={1.5}/><span className="hidden text-3xl font-semibold tracking-tight sm:block">nova<span className="text-lg font-normal">market</span></span></Link>
          <form role="search" className="flex min-w-0 flex-1 items-center rounded-sm bg-white p-1 shadow-sm" onSubmit={e => { e.preventDefault(); router.push(`/products?q=${encodeURIComponent(search.trim())}`); }}>
            <input aria-label="Tìm sản phẩm" placeholder="Bạn đang tìm sản phẩm gì?" value={search} onChange={e => setSearch(e.target.value)} className="min-w-0 !border-0 !bg-transparent !py-2 text-sm text-zinc-800 !outline-offset-0"/>
            <button type="submit" aria-label="Tìm kiếm" className="rounded-sm bg-[#ee4d2d] px-4 py-2.5 transition hover:bg-[#d83e20] sm:px-6"><Search size={20}/></button>
          </form>
          <Link href="/cart" aria-label={`Giỏ hàng, ${count} sản phẩm`} className="relative shrink-0 px-2 py-2 sm:px-5"><ShoppingBag size={27}/>{count > 0 && <span className="absolute -right-1 top-0 min-w-5 rounded-full border border-[#ee4d2d] bg-white px-1 text-center text-xs font-semibold text-[#ee4d2d] sm:right-1">{count > 99 ? "99+" : count}</span>}</Link>
        </div>
        <div className="hidden gap-6 pb-3 text-xs md:flex md:pl-64"><Link href="/products">Tất cả sản phẩm</Link><Link href="/wishlist">Bộ sưu tập của bạn</Link><Link href="/account">Địa chỉ giao hàng</Link></div>
      </div>
      {logoutError && <p role="alert" className="bg-amber-50 p-3 text-center text-sm text-amber-900">{logoutError}</p>}
    </header>
    <nav aria-label="Điều hướng chính" className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-sm md:hidden">
      {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[10px] ${pathname === href ? "text-[#ee4d2d]" : "text-zinc-500"}`}><Icon size={21}/>{label}</Link>)}
    </nav>
  </>;
}
