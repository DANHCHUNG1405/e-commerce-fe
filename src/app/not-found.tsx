import Link from "next/link";
import { EmptyState, Page } from "@/components/ui";
export default function NotFound() {
  return (
    <Page title="Không tìm thấy trang">
      <EmptyState
        title="Có vẻ bạn đã đi lạc"
        description="Trang này không còn tồn tại hoặc đường dẫn chưa chính xác. Cùng quay lại tìm món đồ bạn thích nhé."
        action={
          <Link
            href="/products"
            className="rounded-lg bg-[#ee4d2d] px-6 py-3 text-sm font-semibold text-white"
          >
            Khám phá sản phẩm
          </Link>
        }
      />
    </Page>
  );
}
