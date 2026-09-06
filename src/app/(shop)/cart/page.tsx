import { CartView } from "@/features/cart/components/cart-view";
export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ coupon?: string }>;
}) {
  const { coupon } = await searchParams;
  return <CartView key={coupon ?? ""} initialCoupon={coupon} />;
}
