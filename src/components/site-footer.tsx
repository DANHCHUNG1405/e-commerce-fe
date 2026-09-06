import Link from "next/link";
import { ShoppingBag } from "lucide-react";
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t-4 border-[#ee4d2d] bg-white pb-24 pt-10 md:pb-8">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 text-xl font-bold text-[#ee4d2d]">
            <ShoppingBag size={24} /> nova market
          </p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-500">
            Không gian mua sắm mỗi ngày.
            <br />
            Tìm điều bạn thích, lưu món bạn yêu.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase text-zinc-700">Mua sắm cùng Nova</h2>
          <div className="flex flex-col gap-3 text-sm text-zinc-500">
            <Link href="/products">Khám phá sản phẩm</Link>
            <Link href="/vouchers">Voucher</Link>
            <Link href="/chat">Tin nhắn</Link>
            <Link href="/manage/vouchers">Quản lý voucher</Link>
            <Link href="/wishlist">Danh sách yêu thích</Link>
            <Link href="/cart">Giỏ hàng của bạn</Link>
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase text-zinc-700">Tài khoản của bạn</h2>
          <div className="flex flex-col gap-3 text-sm text-zinc-500">
            <Link href="/account">Hồ sơ & địa chỉ</Link>
            <Link href="/orders">Đơn mua</Link>
            <Link href="/login">Đăng nhập</Link>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-7xl border-t border-zinc-100 px-6 pt-6 text-xs text-zinc-400">
        © 2026 Nova Market.
      </p>
    </footer>
  );
}
