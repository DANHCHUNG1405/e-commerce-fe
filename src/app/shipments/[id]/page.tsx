import { ShipmentDetailView } from "@/features/shipping/components/shipping-view";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShipmentDetailView id={id} />;
}
