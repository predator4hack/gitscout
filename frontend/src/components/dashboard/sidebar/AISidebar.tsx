import { SidebarHeader } from './SidebarHeader';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import type { ChatMessage, SuggestionChip } from '../../../types/dashboard';

interface AISidebarProps {
  messages: ChatMessage[];
  suggestions: SuggestionChip[];
  onClose: () => void;
}

export function AISidebar({ messages, suggestions, onClose }: AISidebarProps) {
  return (
    <>
      <SidebarHeader onClose={onClose} />
      <ChatArea messages={messages} />
      <ChatInput suggestions={suggestions} />
    </>
  );
}
