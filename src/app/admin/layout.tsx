import { ManagementGuard } from "@/components/feature/management";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ManagementGuard role="admin">{children}</ManagementGuard>;
}
