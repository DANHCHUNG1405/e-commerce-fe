"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { vouchersApi } from "../api/vouchers.api";
import { useSessionStore } from "@/features/auth/store/session.store";
import { Button, Notice, Page, LoginRequired } from "@/components/ui";
const safeMoney = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const schema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,40}$/),
    type: z.enum(["fixed", "percent"]),
    value: z.number().int().positive().max(1e12),
    maxDiscount: safeMoney.max(1e12),
    minOrder: safeMoney,
    usageLimit: z.number().int().min(0).max(1e9),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
  })
  .superRefine((v, ctx) => {
    if (v.type === "percent" && (v.value > 100 || v.maxDiscount <= 0))
      ctx.addIssue({
        code: "custom",
        message: "Phần trăm phải từ 1–100 và mức giảm tối đa phải lớn hơn 0",
        path: ["value"],
      });
    if (
      !Number.isFinite(Date.parse(v.startsAt)) ||
      !Number.isFinite(Date.parse(v.endsAt)) ||
      Date.parse(v.endsAt) <= Date.parse(v.startsAt)
    )
      ctx.addIssue({
        code: "custom",
        message: "Ngày kết thúc phải sau ngày bắt đầu",
        path: ["endsAt"],
      });
  });
const statusSchema = z.object({ id: z.uuid("UUID voucher không hợp lệ"), active: z.boolean() });
export function ManageVouchers() {
  const user = useSessionStore((s) => s.user);
  const [seller, setSeller] = useState("");
  const [scope, setScope] = useState("shop");
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { type: "fixed", maxDiscount: 0, minOrder: 0, usageLimit: 0 },
  });
  const statusForm = useForm<z.infer<typeof statusSchema>>({
    resolver: zodResolver(statusSchema),
    defaultValues: { active: true },
  });
  const create = useMutation({
    mutationFn: (v: z.infer<typeof schema>) =>
      vouchersApi.create(
        {
          ...v,
          maxDiscount: v.type === "fixed" ? 0 : v.maxDiscount,
          startsAt: new Date(v.startsAt).toISOString(),
          endsAt: new Date(v.endsAt).toISOString(),
        },
        scope === "shop" ? seller : undefined,
      ),
  });
  const status = useMutation({
    mutationFn: (v: z.infer<typeof statusSchema>) => vouchersApi.status(v.id, v.active),
  });
  const forbidden = (create.error as { status?: number } | null)?.status === 403;
  return (
    <Page title="Quản lý voucher">
      {!user ? (
        <LoginRequired />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            className="space-y-4 bg-white p-6"
            onSubmit={form.handleSubmit((v) => create.mutate(v))}
          >
            <h2 className="text-lg font-semibold">Tạo voucher</h2>
            <Notice>
              Voucher sàn cần quyền admin. Voucher shop cần owner/manager của shop đã duyệt.
            </Notice>
            <label className="block text-sm">
              Phạm vi
              <select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="shop">Shop</option>
                <option value="platform">Sàn</option>
              </select>
            </label>
            {scope === "shop" && (
              <label className="block text-sm">
                UUID shop
                <input value={seller} onChange={(e) => setSeller(e.target.value.trim())} />
              </label>
            )}
            <label className="block text-sm">
              Mã voucher
              <input {...form.register("code")} />
            </label>
            <label className="block text-sm">
              Loại giảm
              <select {...form.register("type")}>
                <option value="fixed">Số tiền cố định</option>
                <option value="percent">Phần trăm</option>
              </select>
            </label>
            {(
              [
                { key: "value", label: "Giá trị giảm" },
                { key: "maxDiscount", label: "Giảm tối đa (cho phần trăm)" },
                { key: "minOrder", label: "Đơn tối thiểu" },
                { key: "usageLimit", label: "Tổng lượt (0 = không giới hạn)" },
              ] as const
            ).map((f) => (
              <label key={f.key} className="block text-sm">
                {f.label}
                <input type="number" step="1" {...form.register(f.key, { valueAsNumber: true })} />
              </label>
            ))}
            <label className="block text-sm">
              Bắt đầu (giờ địa phương)
              <input type="datetime-local" {...form.register("startsAt")} />
            </label>
            <label className="block text-sm">
              Kết thúc (giờ địa phương)
              <input type="datetime-local" {...form.register("endsAt")} />
            </label>
            {Object.entries(form.formState.errors).map(([key, error]) => (
              <Notice error key={key}>
                {key}: {error.message}
              </Notice>
            ))}
            <Button
              disabled={
                create.isPending ||
                forbidden ||
                (scope === "shop" && !z.uuid().safeParse(seller).success)
              }
            >
              Tạo voucher
            </Button>
            {create.error && <Notice error>{create.error.message}</Notice>}
            {create.data && (
              <Notice>
                Đã tạo {create.data.Code}. UUID:{" "}
                <span className="select-all break-all">{create.data.id}</span>
              </Notice>
            )}
          </form>
          <form
            className="h-fit space-y-4 bg-white p-6"
            onSubmit={statusForm.handleSubmit((v) => status.mutate(v))}
          >
            <h2 className="text-lg font-semibold">Bật / tắt voucher</h2>
            <Notice>
              Nhập UUID voucher đã được cấp. Danh sách public chỉ gồm mã đang dùng được, không phải
              danh sách quản trị đầy đủ.
            </Notice>
            <label className="block text-sm">
              UUID voucher
              <input {...statusForm.register("id")} />
            </label>
            <label className="flex items-center gap-3">
              <input className="!w-auto" type="checkbox" {...statusForm.register("active")} />
              Cho phép sử dụng
            </label>
            {statusForm.formState.errors.id && (
              <Notice error>{statusForm.formState.errors.id.message}</Notice>
            )}
            <Button disabled={status.isPending}>Cập nhật trạng thái</Button>
            {status.error && <Notice error>{status.error.message}</Notice>}
            {status.isSuccess && <Notice>Đã cập nhật trạng thái.</Notice>}
          </form>
        </div>
      )}
    </Page>
  );
}
