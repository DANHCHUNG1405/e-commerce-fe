"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { chatApi } from "../api/chat.api";
import { Button, Notice } from "@/components/ui";
export function ChatShopButton({ sellerId }: { sellerId: string }) {
  const router = useRouter();
  const open = useMutation({
    mutationFn: () => chatApi.open(sellerId),
    onSuccess: (c) => router.push(`/chat/${c.id}`),
  });
  return (
    <div className="my-4 flex flex-wrap items-center gap-3">
      <Button disabled={open.isPending} onClick={() => open.mutate()}>
        Chat với shop
      </Button>
      <Link className="text-sm text-orange-600" href={`/sellers/${sellerId}/vouchers`}>
        Voucher shop
      </Link>
      {open.error && <Notice error>{open.error.message}</Notice>}
    </div>
  );
}
