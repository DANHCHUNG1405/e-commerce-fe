"use client";
import { Button, EmptyState, Page } from "@/components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Page title="Có chút gián đoạn">
      <EmptyState
        title="Trang này chưa tải được"
        description="Hãy thử lại để tiếp tục. Nếu bạn vừa đặt hàng, hãy kiểm tra lịch sử đơn mua trước khi đặt lại."
        action={<Button onClick={reset}>Thử tải lại</Button>}
      />
    </Page>
  );
}
