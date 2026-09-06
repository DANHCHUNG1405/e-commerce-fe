import { ChatView } from "@/features/chat/components/chat-view";
export default async function ChatThread({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatView conversationId={id} />;
}
