import { SidebarHeader } from './SidebarHeader';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import { useChat } from '../../../hooks/useChat';
import type { SuggestionChip, FilterProposal } from '../../../types/dashboard';

interface AISidebarProps {
  sessionId: string;
  onClose: () => void;
  onFiltersApplied?: (filters: FilterProposal) => void;
}

const DEFAULT_SUGGESTIONS: SuggestionChip[] = [
  {
    id: '1',
    label: 'Filter by location',
    prompt: 'Show only candidates in California'
  },
  {
    id: '2',
    label: 'Active developers',
    prompt: 'Show developers who were active in the last 3 months'
  },
  {
    id: '3',
    label: 'Draft email',
    prompt: 'Draft a recruitment email'
  },
];

export function AISidebar({ sessionId, onClose, onFiltersApplied }: AISidebarProps) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    confirmFilter,
    clearError,
  } = useChat({
    sessionId,
    onFiltersApplied,
  });

  const handleConfirmFilter = async (messageId: string, confirmed: boolean) => {
    await confirmFilter(messageId, confirmed);
  };

  const handleAnswerClarification = async (answer: string) => {
    await sendMessage(answer);
  };

  return (
    <>
      <SidebarHeader onClose={onClose} />

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <ChatArea
        messages={messages}
        onConfirmFilter={handleConfirmFilter}
        onAnswerClarification={handleAnswerClarification}
        disabled={isLoading}
      />

      <ChatInput
        suggestions={DEFAULT_SUGGESTIONS}
        onSendMessage={sendMessage}
        disabled={isLoading}
      />

      {isLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg px-4 py-2 shadow-lg">
            <p className="text-sm text-gray-700">Thinking...</p>
          </div>
        </div>
      )}
    </>
  );
}
