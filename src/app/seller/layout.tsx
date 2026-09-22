import { ManagementGuard } from "@/components/feature/management";
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <ManagementGuard role="seller_admin">{children}</ManagementGuard>;
}
