import { ProductDetailView } from "@/features/catalog/components/product-detail";
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailView id={id} />;
}
