import type { ChatMessage } from "../api/chat.api";
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) map.set(message.id, message);
  return [...map.values()].sort((a, b) => a.sequence - b.sequence);
}
export function validMessage(body: string) {
  return (
    body.trim().length > 0 &&
    [...body].length <= 5000 &&
    new TextEncoder().encode(body).length <= 20000
  );
}
