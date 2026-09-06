import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronRight, Info, TriangleAlert, ShoppingBag } from "lucide-react";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-[#ee4d2d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d83e20] disabled:cursor-not-allowed disabled:opacity-40";
export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  return (
    <button
      className={cn(
        buttonClass,
        "min-h-11 rounded-lg active:translate-y-px",
        variant === "secondary" &&
          "border border-zinc-200 bg-white text-zinc-700 hover:border-orange-300 hover:bg-orange-50",
        className,
      )}
      {...props}
    />
  );
}
export function Page({
  title,
  children,
  description,
  action,
}: {
  title: string;
  children: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <main id="main-content" className="mx-auto min-h-[65vh] max-w-7xl px-4 py-6 sm:px-6">
      <nav aria-label="Đường dẫn" className="mb-6 flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/" className="hover:text-orange-600">
          Trang chủ
        </Link>
        <ChevronRight size={13} />
        <span aria-current="page" className="truncate">
          {title}
        </span>
      </nav>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </main>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "my-4 flex items-start gap-3 rounded-xl border p-4 text-sm leading-6",
        error
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-zinc-200 bg-zinc-50 text-zinc-600",
      )}
    >
      {error ? (
        <TriangleAlert className="mt-1 shrink-0" size={17} />
      ) : (
        <Info className="mt-1 shrink-0" size={17} />
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
export function LoginRequired() {
  return (
    <EmptyState
      title="Không gian mua sắm của bạn"
      description="Đăng nhập để xem giỏ hàng, lưu sản phẩm yêu thích và theo dõi đơn mua."
      action={
        <Link className={cn(buttonClass, "rounded-lg")} href="/login">
          Đăng nhập <ArrowRight size={16} />
        </Link>
      }
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-14 text-center">
      <div className="mb-5 rounded-full bg-orange-50 p-5 text-orange-500">
        <ShoppingBag size={32} strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-6 mt-2 max-w-sm text-sm leading-6 text-zinc-500">{description}</p>
      {action}
    </div>
  );
}
