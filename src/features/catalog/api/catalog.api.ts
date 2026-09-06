import { request } from "@/lib/api/client";
import type { Category, Metadata, PageParams, Product, ProductDetail, Review, UUID, Variant } from "@/lib/api/types";
const query = (params: PageParams & { q?: string }) => { const search = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => value !== undefined && search.set(key, String(value))); return search.toString() ? `?${search}` : ""; };
export const catalogApi = {
  categories: (params: PageParams = {}) => request<Category[]>({ url: `/categories${query(params)}` }),
  products: (params: PageParams & { q?: string } = {}) => request<Product[]>({ url: `/products${query(params)}` }),
  product: (id: UUID) => request<ProductDetail>({ url: `/products/${id}` }),
  metadata: async (id: UUID) => (await request<{ data: Metadata }>({ url: `/products/${id}/metadata` })).data,
  reviews: (id: UUID, params: PageParams = {}) => request<Review[]>({ url: `/products/${id}/reviews${query(params)}` }),
  createReview: (body: { orderItemId: UUID; rating: number; comment?: string }) => request<Review>({ url: "/reviews", method: "POST", data: body }),
  createProduct: (seller: UUID, body: { name: string; slug: string; description: string; status: Product["Status"] }) => request<Product>({ url: `/sellers/${seller}/products`, method: "POST", data: body }),
  updateProduct: (seller: UUID, product: UUID, body: { name: string; slug: string; description: string; status: Product["Status"] }) => request<Product>({ url: `/sellers/${seller}/products/${product}`, method: "PUT", data: body }),
  createVariant: (seller: UUID, product: UUID, body: { sku: string; name: string; price: number; attributes?: Record<string, unknown> }) => request<Variant>({ url: `/sellers/${seller}/products/${product}/variants`, method: "POST", data: body }),
  updateMetadata: (seller: UUID, product: UUID, body: { specifications?: Record<string, unknown> | null; seo?: Record<string, unknown> | null }) => request<Record<string, never>>({ url: `/sellers/${seller}/products/${product}/metadata`, method: "PUT", data: body }),
};
