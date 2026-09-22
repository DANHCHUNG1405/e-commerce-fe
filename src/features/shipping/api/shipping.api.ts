import { request } from "@/lib/api/client";
import type { DriverProfile, Shipment, ShipmentEvent } from "@/lib/api/types";

export const shippingApi = {
  apply: (phone: string, vehiclePlate: string) =>
    request<DriverProfile>({
      url: "/drivers/apply",
      method: "POST",
      data: { phone, vehiclePlate },
    }),
  me: () => request<DriverProfile>({ url: "/drivers/me" }),
  create: (seller: string, order: string) =>
    request<Shipment>({ url: `/sellers/${seller}/orders/${order}/shipment`, method: "POST" }),
  assigned: (page = 1, status?: string) =>
    request<Shipment[]>({ url: "/drivers/me/shipments", params: { page, limit: 20, status } }),
  update: (
    id: string,
    body: { status: string; reason?: string; codCollected?: boolean },
    key: string,
  ) =>
    request<Record<string, never>>({
      url: `/drivers/me/shipments/${id}/status`,
      method: "PATCH",
      headers: { "Idempotency-Key": key },
      data: body,
    }),
  detail: (id: string) => request<Shipment>({ url: `/shipments/${id}` }),
  events: (id: string, page = 1) =>
    request<ShipmentEvent[]>({ url: `/shipments/${id}/events`, params: { page, limit: 20 } }),
};
