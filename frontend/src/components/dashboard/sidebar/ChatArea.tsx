import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '../../../types/dashboard';

interface ChatAreaProps {
  messages: ChatMessageType[];
}

export function ChatArea({ messages }: ChatAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 dashboard-scrollbar">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
}
