import { VouchersView } from "@/features/vouchers/components/vouchers-view";
export default async function SellerVouchers({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VouchersView seller={id} />;
}
