import { ManageVouchers } from "@/features/vouchers/components/manage-vouchers";
import { AdminOperations } from "@/features/management/components/operations";
export default function AdminVouchersPage() {
  return (
    <>
      <ManageVouchers />
      <AdminOperations kind="vouchers" />
    </>
  );
}
