import { useMemo } from 'react';
import { SidebarHeader } from './SidebarHeader';
import { ChatArea } from './ChatArea';
import { ChatInput } from './ChatInput';
import { useChat } from '../../../hooks/useChat';
import type { SuggestionChip, FilterProposal } from '../../../types/dashboard';
import type { CandidateContext } from '../../../types/candidate';

interface AISidebarProps {
  sessionId: string;
  onClose: () => void;
  onFiltersApplied?: (filters: FilterProposal) => void;
  initialContext?: CandidateContext | null;
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

export function AISidebar({ sessionId, onClose, onFiltersApplied, initialContext }: AISidebarProps) {
  const {
    messages,
    conversationId,
    isLoading,
    error,
    sendMessage,
    confirmFilter,
    answerMultiClarification,
    clearError,
    clearConversation,
    loadConversation,
  } = useChat({
    sessionId,
    onFiltersApplied,
  });

  // Generate suggestions based on whether we have candidate context
  const suggestions = useMemo(() => {
    if (initialContext) {
      const candidateName = initialContext.name || initialContext.login;
      return [
        {
          id: 'ctx-1',
          label: 'Draft outreach email',
          prompt: `Draft a recruitment outreach email to ${candidateName} (@${initialContext.login})`
        },
        {
          id: 'ctx-2',
          label: 'Summarize experience',
          prompt: `Summarize ${candidateName}'s experience and key skills`
        },
        {
          id: 'ctx-3',
          label: 'Compare to job',
          prompt: `How well does ${candidateName} match our job requirements?`
        },
      ];
    }
    return DEFAULT_SUGGESTIONS;
  }, [initialContext]);

  const handleConfirmFilter = async (messageId: string, confirmed: boolean) => {
    await confirmFilter(messageId, confirmed);
  };

  const handleAnswerClarification = async (answer: string) => {
    await sendMessage(answer);
  };

  const handleAnswerMultiClarification = async (messageId: string, answers: Record<string, string>) => {
    await answerMultiClarification(messageId, answers);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear this conversation? This cannot be undone.')) {
      clearConversation();
    }
  };

  const handleLoadConversation = async (convId: string) => {
    await loadConversation(convId);
  };

  const handleNewConversation = () => {
    clearConversation();
  };

  return (
    <>
      <SidebarHeader
        onClose={onClose}
        title={initialContext ? `Chat about @${initialContext.login}` : undefined}
      />

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
        onAnswerMultiClarification={handleAnswerMultiClarification}
        disabled={isLoading}
        isLoading={isLoading}
      />

      <ChatInput
        suggestions={suggestions}
        onSendMessage={sendMessage}
        onClearChat={handleClearChat}
        searchId={sessionId}
        conversationId={conversationId}
        onLoadConversation={handleLoadConversation}
        onNewConversation={handleNewConversation}
        disabled={isLoading}
      />
    </>
  );
}
