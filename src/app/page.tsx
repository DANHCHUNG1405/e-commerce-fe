import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  Heart,
  PackageCheck,
  MapPin,
  Sparkles,
  Truck,
  Wallet,
  Search,
} from "lucide-react";
import { ProductFeed } from "@/features/catalog/components/catalog";

const shortcuts = [
  {
    icon: ShoppingBag,
    label: "Tất cả sản phẩm",
    href: "/products",
    color: "bg-orange-50 text-orange-600",
  },
  { icon: Heart, label: "Yêu thích", href: "/wishlist", color: "bg-rose-50 text-rose-500" },
  { icon: PackageCheck, label: "Đơn của bạn", href: "/orders", color: "bg-blue-50 text-blue-600" },
  { icon: MapPin, label: "Sổ địa chỉ", href: "/account", color: "bg-emerald-50 text-emerald-600" },
];
export default function HomePage() {
  return (
    <main id="main-content" className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
      <section aria-label="Khám phá cửa hàng" className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="relative isolate overflow-hidden rounded-sm bg-[#fff0e5] px-6 py-10 sm:px-10 sm:py-12">
          <div className="relative z-10 max-w-sm">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#d34425]">
              <Sparkles size={14} /> NOVA MARKET · MỖI NGÀY MỘT KHÁM PHÁ
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#783221] sm:text-5xl">
              Thích là tìm.
              <br />
              Ưng là sắm.
            </h1>
            <p className="mb-6 mt-4 max-w-64 text-sm leading-6 text-[#925d4e]">
              Tìm những món đồ phù hợp với bạn, chỉ trong vài chạm.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-3 rounded-sm bg-[#ee4d2d] px-6 py-3 text-sm font-semibold text-white hover:bg-[#d83e20]"
            >
              Khám phá ngay <ArrowRight size={17} />
            </Link>
          </div>
          <div
            aria-hidden="true"
            className="absolute -right-12 bottom-0 -z-10 h-72 w-72 rounded-full bg-[#ffd2b9] sm:right-2 sm:h-80 sm:w-80"
          />
          <ShoppingBag
            aria-hidden="true"
            className="absolute right-8 top-20 -z-10 hidden size-48 rotate-12 text-[#f48760] sm:block"
            strokeWidth={0.8}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <Link
            href="/wishlist"
            className="group flex items-center justify-between gap-3 rounded-sm bg-[#f4ece2] p-5 sm:p-6"
          >
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-widest text-amber-700">
                GÓC CỦA RIÊNG BẠN
              </p>
              <h2 className="text-lg font-bold text-[#664b34] sm:text-2xl">Lưu điều bạn thích</h2>
              <p className="mt-3 flex items-center gap-2 text-xs text-[#80634a]">
                Mở bộ sưu tập <ArrowRight size={14} />
              </p>
            </div>
            <Heart
              aria-hidden="true"
              size={50}
              strokeWidth={1}
              className="hidden shrink-0 text-[#b89977] sm:block"
            />
          </Link>
          <Link
            href="/products"
            className="flex items-center justify-between gap-3 rounded-sm bg-[#e7f0ed] p-5 sm:p-6"
          >
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-widest text-emerald-700">
                TÌM KIẾM DỄ DÀNG
              </p>
              <h2 className="text-lg font-bold text-[#36594b] sm:text-2xl">Món đồ tiếp theo?</h2>
              <p className="mt-3 flex items-center gap-2 text-xs text-[#517565]">
                Tìm ngay hôm nay <ArrowRight size={14} />
              </p>
            </div>
            <Search
              aria-hidden="true"
              size={50}
              strokeWidth={1}
              className="hidden shrink-0 text-[#8bab9c] sm:block"
            />
          </Link>
        </div>
      </section>
      <nav
        aria-label="Tiện ích mua sắm"
        className="mb-6 mt-3 grid grid-cols-4 gap-2 bg-white px-2 py-6 shadow-xs"
      >
        {shortcuts.map(({ icon: Icon, label, href, color }) => (
          <Link
            href={href}
            key={href}
            className="group flex flex-col items-center gap-3 text-center"
          >
            <span className={`rounded-2xl p-3 transition group-hover:-translate-y-1 ${color}`}>
              <Icon size={25} strokeWidth={1.5} />
            </span>
            <span className="text-xs text-zinc-700 sm:text-sm">{label}</span>
          </Link>
        ))}
      </nav>
      <div className="mb-6 grid gap-px overflow-hidden rounded-sm border border-orange-100 bg-orange-100 sm:grid-cols-3">
        {[
          { icon: Truck, title: "Miễn phí vận chuyển", text: "Cho đơn hàng COD hiện tại" },
          { icon: Wallet, title: "Nhận hàng rồi thanh toán", text: "Mua sắm với phương thức COD" },
          {
            icon: PackageCheck,
            title: "Theo dõi đơn dễ dàng",
            text: "Cập nhật trạng thái trong tài khoản",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3 bg-[#fffaf7] px-5 py-4">
            <Icon size={24} className="shrink-0 text-[#ee4d2d]" />
            <div>
              <p className="text-sm font-semibold text-zinc-700">{title}</p>
              <p className="mt-1 text-xs text-zinc-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <section>
        <div className="mb-4 border-b-4 border-[#ee4d2d] bg-white p-5 text-center">
          <h2 className="text-lg font-medium uppercase tracking-wide text-[#ee4d2d]">
            Khám phá hôm nay
          </h2>
        </div>
        <ProductFeed />
        <div className="mt-6 text-center">
          <Link
            href="/products"
            className="inline-flex min-w-60 justify-center rounded-sm border border-zinc-300 bg-white px-8 py-3 text-sm text-zinc-600 hover:border-[#ee4d2d] hover:text-[#ee4d2d]"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
      </section>
    </main>
  );
}
