import { Catalog } from "@/features/catalog/components/catalog";
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  return <Catalog key={q} initialQuery={q}/>;
}
