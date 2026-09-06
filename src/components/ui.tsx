import Link from "next/link";
import { cn } from "@/lib/utils";
export const buttonClass = "inline-flex items-center justify-center gap-2 rounded-sm bg-[#ee4d2d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d83e20] disabled:cursor-not-allowed disabled:opacity-40";
export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={cn(buttonClass, className)} {...props} />; }
export function Page({ title, children }: { title: string; children: React.ReactNode }) { return <main id="main-content" className="mx-auto min-h-[65vh] max-w-7xl px-4 py-6 sm:px-6"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#ee4d2d]">Nova Market / Cửa hàng</p><h1 className="mb-8 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>{children}</main>; }
export function Notice({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <div role={error ? "alert" : "status"} className={cn("my-4 rounded-sm border p-5 text-sm", error ? "border-red-200 bg-red-50 text-red-800" : "border-zinc-200 bg-zinc-50 text-zinc-600")}>{children}</div>; }
export function LoginRequired() { return <Notice>Đăng nhập để tiếp tục. <Link className="font-semibold underline" href="/login">Đăng nhập</Link></Notice>; }
