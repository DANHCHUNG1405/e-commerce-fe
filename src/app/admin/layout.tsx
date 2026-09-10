import { ManagementGuard } from "@/features/management/components/management-ui";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ManagementGuard role="admin">{children}</ManagementGuard>;
}
