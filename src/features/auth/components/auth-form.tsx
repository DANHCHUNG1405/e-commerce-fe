"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "../api/auth.api";
import { useSessionStore } from "../store/session.store";
import { Button, Notice, Page } from "@/components/ui";
const schema = z.object({
  email: z.email("Email không hợp lệ"),
  password: z.string().refine((v) => {
    const n = new TextEncoder().encode(v).length;
    return n >= 8 && n <= 72;
  }, "Mật khẩu cần từ 8 đến 72 byte"),
  fullName: z.string().max(200).optional(),
});
export function AuthForm({ registerMode = false }: { registerMode?: boolean }) {
  const router = useRouter();
  const cache = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const submit = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      registerMode
        ? authApi.register({ ...values, fullName: values.fullName ?? "" })
        : authApi.login(values),
    onSuccess: (result) => {
      cache.clear();
      useSessionStore.getState().setSession(result.user, result.tokens);
      console.info("[Auth] Đăng nhập thành công", {
        user: result.user.email,
        roles: useSessionStore.getState().roles,
      });
      router.push("/products");
    },
  });
  return (
    <Page title={registerMode ? "Tạo tài khoản" : "Chào mừng trở lại"}>
      <form
        onSubmit={form.handleSubmit((values) => submit.mutate(values))}
        className="mx-auto max-w-md space-y-5 rounded-sm border border-zinc-200 bg-white p-7 shadow-sm"
      >
        {registerMode && (
          <label className="block text-sm">
            Họ tên
            <input className="mt-2" autoComplete="name" required {...form.register("fullName")} />
          </label>
        )}
        <label className="block text-sm">
          Email
          <input className="mt-2" autoComplete="email" {...form.register("email")} />
        </label>
        <label className="block text-sm">
          Mật khẩu
          <input
            className="mt-2"
            type="password"
            autoComplete={registerMode ? "new-password" : "current-password"}
            {...form.register("password")}
          />
        </label>
        {Object.entries(form.formState.errors).map(([key, error]) => (
          <Notice error key={key}>
            {error.message}
          </Notice>
        ))}
        {submit.error && <Notice error>{submit.error.message}</Notice>}
        <Button className="w-full" disabled={submit.isPending}>
          {submit.isPending ? "Đang xử lý…" : registerMode ? "Đăng ký" : "Đăng nhập"}
        </Button>
        <p className="text-center text-sm text-zinc-500">
          <Link className="underline" href={registerMode ? "/login" : "/register"}>
            {registerMode ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
          </Link>
        </p>
      </form>
    </Page>
  );
}
