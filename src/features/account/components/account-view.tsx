"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "@/features/auth/store/session.store";
import { authApi } from "@/features/auth/api/auth.api";
import { accountApi } from "../api/account.api";
import { AddressForm } from "./addresses";
import { Button, Notice, Page, LoginRequired } from "@/components/ui";
const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1)
    .refine((v) => new TextEncoder().encode(v).length <= 200, "Tên quá dài"),
});
export function AccountView() {
  const user = useSessionStore((s) => s.user);
  const cache = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    values: { fullName: user?.fullName ?? "" },
  });
  const addresses = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: accountApi.addresses,
    enabled: !!user,
  });
  const save = useMutation({
    mutationFn: async ({ fullName }: z.infer<typeof schema>) => {
      await accountApi.updateProfile(fullName);
      return authApi.me();
    },
    onSuccess: (profile) => {
      const tokens = useSessionStore.getState().tokens;
      if (tokens) useSessionStore.getState().setSession(profile, tokens);
    },
  });
  const remove = useMutation({
    mutationFn: accountApi.deleteAddress,
    onSuccess: () => cache.invalidateQueries({ queryKey: ["addresses"] }),
  });
  return (
    <Page title="Tài khoản của tôi">
      {!user ? (
        <LoginRequired />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <form
              className="mb-8 space-y-4 rounded-sm border border-zinc-200 bg-white p-6"
              onSubmit={form.handleSubmit((v) => save.mutate(v))}
            >
              <h2 className="text-xl font-semibold">Hồ sơ</h2>
              <p className="text-sm text-zinc-500">{user.email}</p>
              <label className="block text-sm">
                Họ tên
                <input className="mt-2" {...form.register("fullName")} />
              </label>
              {form.formState.errors.fullName && (
                <Notice error>{form.formState.errors.fullName.message}</Notice>
              )}
              <Button disabled={save.isPending}>Lưu hồ sơ</Button>
              {save.isSuccess && <Notice>Đã cập nhật hồ sơ.</Notice>}
              {save.error && <Notice error>{save.error.message}</Notice>}
            </form>
            <h2 className="mb-4 text-xl font-semibold">Địa chỉ đã lưu</h2>
            {addresses.error && <Notice error>{addresses.error.message}</Notice>}
            {addresses.data?.map((a) => (
              <article key={a.id} className="mb-3 rounded-sm border border-zinc-200 bg-white p-5">
                <p className="font-semibold">
                  {a.RecipientName} · {a.Phone}
                </p>
                <p className="my-3 text-sm text-zinc-500">
                  {a.AddressLine}, {a.Ward}, {a.District}, {a.Province}
                </p>
                <button
                  disabled={remove.isPending}
                  className="text-sm text-red-600"
                  onClick={() => {
                    if (window.confirm("Xóa địa chỉ này?")) remove.mutate(a.id);
                  }}
                >
                  Xóa địa chỉ
                </button>
              </article>
            ))}
            {remove.error && <Notice error>{remove.error.message}</Notice>}
          </div>
          <AddressForm />
        </div>
      )}
    </Page>
  );
}
