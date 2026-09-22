"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { authApi } from "../api/auth.api";
import { Button, Notice, Page } from "@/components/ui";

const newPassword = z.string().min(8, "Mật khẩu mới cần ít nhất 8 ký tự");
const changeSchema = z
  .object({ currentPassword: z.string().min(1, "Nhập mật khẩu hiện tại"), newPassword })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ["newPassword"],
    message: "Mật khẩu mới phải khác mật khẩu hiện tại",
  });
const forgotSchema = z.object({ email: z.email("Email không hợp lệ") });
const resetSchema = z.object({ newPassword });

export function ChangePasswordForm() {
  const form = useForm<z.infer<typeof changeSchema>>({ resolver: zodResolver(changeSchema) });
  const change = useMutation({
    mutationFn: (values: z.infer<typeof changeSchema>) =>
      authApi.changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => form.reset(),
  });
  return (
    <form
      className="rounded-xl border border-zinc-200 bg-white p-6"
      onSubmit={form.handleSubmit((v) => change.mutate(v))}
    >
      <h2 className="mb-4 text-xl font-semibold">Đổi mật khẩu</h2>
      <label className="block text-sm">
        Mật khẩu hiện tại
        <input
          className="mt-2"
          type="password"
          autoComplete="current-password"
          {...form.register("currentPassword")}
        />
      </label>
      <label className="mt-4 block text-sm">
        Mật khẩu mới
        <input
          className="mt-2"
          type="password"
          autoComplete="new-password"
          {...form.register("newPassword")}
        />
      </label>
      {Object.entries(form.formState.errors).map(([key, error]) => (
        <Notice error key={key}>
          {error.message}
        </Notice>
      ))}
      {change.error && <Notice error>{change.error.message}</Notice>}
      {change.isSuccess && <Notice>Đã đổi mật khẩu.</Notice>}
      <Button className="mt-5" disabled={change.isPending}>
        Đổi mật khẩu
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const form = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });
  const forgot = useMutation({
    mutationFn: (values: z.infer<typeof forgotSchema>) => authApi.forgotPassword(values.email),
  });
  return (
    <Page title="Quên mật khẩu">
      <form
        className="mx-auto max-w-md space-y-4 rounded-xl border border-zinc-200 bg-white p-6"
        onSubmit={form.handleSubmit((v) => forgot.mutate(v))}
      >
        <p className="text-sm text-zinc-600">
          Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
        </p>
        <label className="block text-sm">
          Email
          <input type="email" autoComplete="email" {...form.register("email")} />
        </label>
        {form.formState.errors.email && (
          <Notice error>{form.formState.errors.email.message}</Notice>
        )}
        {forgot.error && <Notice error>{forgot.error.message}</Notice>}
        {forgot.isSuccess && (
          <Notice>Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.</Notice>
        )}
        <Button disabled={forgot.isPending}>Gửi liên kết</Button>
        <p className="text-sm">
          <Link href="/login" className="text-orange-600 underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </form>
    </Page>
  );
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });
  const reset = useMutation({
    mutationFn: (values: z.infer<typeof resetSchema>) =>
      authApi.resetPassword(token!, values.newPassword),
    onSuccess: () => {
      form.reset();
      router.replace("/login");
    },
  });
  return (
    <Page title="Đặt lại mật khẩu">
      {!token ? (
        <Notice error>Liên kết đặt lại mật khẩu không hợp lệ.</Notice>
      ) : (
        <form
          className="mx-auto max-w-md space-y-4 rounded-xl border border-zinc-200 bg-white p-6"
          onSubmit={form.handleSubmit((v) => reset.mutate(v))}
        >
          <p className="text-sm text-zinc-600">Liên kết chỉ dùng một lần và hết hạn sau 30 phút.</p>
          <label className="block text-sm">
            Mật khẩu mới
            <input type="password" autoComplete="new-password" {...form.register("newPassword")} />
          </label>
          {form.formState.errors.newPassword && (
            <Notice error>{form.formState.errors.newPassword.message}</Notice>
          )}
          {reset.error && <Notice error>{reset.error.message}</Notice>}
          <Button disabled={reset.isPending}>Đặt lại mật khẩu</Button>
        </form>
      )}
    </Page>
  );
}
