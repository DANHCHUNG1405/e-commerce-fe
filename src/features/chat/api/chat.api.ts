import { request } from "@/lib/api/client";
import type { BaseEntity } from "@/lib/api/types";
export interface Conversation extends BaseEntity {
  buyerId: string;
  sellerId: string;
  lastSequence: number;
}
export interface ConversationSummary extends Conversation {
  unreadCount: number;
  lastReadSequence: number;
}
export interface ChatMessage extends BaseEntity {
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  sequence: number;
  body: string;
}
export interface ChatRead {
  conversationId: string;
  userId: string;
  lastSequence: number;
  updatedAt: string;
}
export const chatApi = {
  open: (sellerId: string) =>
    request<Conversation>({ url: "/chat/conversations", method: "POST", data: { sellerId } }),
  inbox: (page = 1) =>
    request<ConversationSummary[]>({ url: "/chat/conversations", params: { page, limit: 20 } }),
  messages: (
    id: string,
    params: { after?: number; before?: number; limit?: number } = {},
    signal?: AbortSignal,
  ) =>
    request<ChatMessage[]>({
      url: `/chat/conversations/${id}/messages`,
      params: { limit: 50, ...params },
      signal,
    }),
  send: (id: string, data: { clientMessageId: string; body: string }) =>
    request<ChatMessage>({ url: `/chat/conversations/${id}/messages`, method: "POST", data }),
  read: (id: string, sequence: number) =>
    request<ChatRead>({ url: `/chat/conversations/${id}/read`, method: "PUT", data: { sequence } }),
};
