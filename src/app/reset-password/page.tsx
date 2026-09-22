import { ResetPasswordForm } from "@/features/auth/components/password-forms";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token} />;
}
