"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountApi } from "../api/account.api";
import { Button, Notice } from "@/components/ui";
const schema = z.object({ recipientName: z.string().trim().min(1).max(200), phone: z.string().trim().min(1).max(30), addressLine: z.string().trim().min(1).max(500), ward: z.string().trim().min(1).max(100), district: z.string().trim().min(1).max(100), province: z.string().trim().min(1).max(100), country: z.string().length(2), postalCode: z.string().max(20) });
const fields = { recipientName: "Người nhận", phone: "Điện thoại", addressLine: "Số nhà, tên đường", ward: "Phường / Xã", district: "Quận / Huyện", province: "Tỉnh / Thành phố", country: "Mã quốc gia", postalCode: "Mã bưu chính" } as const;
export function AddressForm() {
  const cache = useQueryClient(); const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { country: "VN", postalCode: "" } });
  const save = useMutation({ mutationFn: accountApi.createAddress, onSuccess: () => { form.reset(); void cache.invalidateQueries({ queryKey: ["addresses"] }); } });
  return <form className="space-y-4 rounded-sm border border-zinc-200 bg-white p-6" onSubmit={form.handleSubmit(v => save.mutate(v))}><h2 className="text-xl font-semibold">Thêm địa chỉ giao hàng</h2><div className="grid gap-4 sm:grid-cols-2">{(Object.keys(fields) as (keyof typeof fields)[]).map(key => <label key={key} className="text-sm">{fields[key]}<input className="mt-2" {...form.register(key)}/>{form.formState.errors[key] && <span className="text-red-600">Thông tin không hợp lệ</span>}</label>)}</div>{save.error && <Notice error>{save.error.message}</Notice>}{save.isSuccess && <Notice>Đã lưu địa chỉ.</Notice>}<Button disabled={save.isPending}>Lưu địa chỉ</Button></form>;
}
