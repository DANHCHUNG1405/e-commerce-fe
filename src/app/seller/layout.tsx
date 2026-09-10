import { ManagementGuard } from "@/features/management/components/management-ui";
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <ManagementGuard role="seller_admin">{children}</ManagementGuard>;
}
