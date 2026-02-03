import { useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType } from '../../../types/dashboard';
import { FilterProposalMessage } from './FilterProposalMessage';
import { ClarificationMessage } from './ClarificationMessage';
import { EmailDraftMessage } from './EmailDraftMessage';

interface ChatAreaProps {
  messages: ChatMessageType[];
  onConfirmFilter: (messageId: string, confirmed: boolean) => void;
  onAnswerClarification: (answer: string) => void;
  disabled?: boolean;
}

export function ChatArea({
  messages,
  onConfirmFilter,
  onAnswerClarification,
  disabled = false
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderMessage = (message: ChatMessageType) => {
    const isUser = message.role === 'user';

    // User message
    if (isUser && message.text_content) {
      return (
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-blue-600 text-white rounded-lg px-4 py-2">
            <p className="text-sm">{message.text_content}</p>
          </div>
        </div>
      );
    }

    // Assistant messages
    if (message.role === 'assistant') {
      return (
        <div className="flex justify-start">
          <div className="max-w-[85%] space-y-2">
            {/* Filter Proposal */}
            {message.type === 'filter_proposal' && message.filter_proposal_content && (
              <FilterProposalMessage
                proposal={message.filter_proposal_content}
                messageId={message.message_id || ''}
                onConfirm={onConfirmFilter}
                disabled={disabled}
              />
            )}

            {/* Clarification Question */}
            {message.type === 'clarification' && message.clarification_content && (
              <ClarificationMessage
                clarification={message.clarification_content}
                onAnswer={onAnswerClarification}
                disabled={disabled}
              />
            )}

            {/* Email Draft */}
            {message.type === 'email_draft' && message.email_draft_content && (
              <EmailDraftMessage emailDraft={message.email_draft_content} />
            )}

            {/* Text Message */}
            {message.type === 'text' && message.text_content && (
              <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                <p className="text-sm whitespace-pre-wrap">{message.text_content}</p>
              </div>
            )}

            {/* Step Indicator */}
            {message.type === 'step' && message.step_content && (
              <div className="bg-purple-100 text-purple-900 rounded-lg px-4 py-2">
                <p className="text-sm flex items-center gap-2">
                  <span className="animate-pulse">⚙️</span>
                  {message.step_content}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 dashboard-scrollbar">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-gs-text-muted">
            <p className="text-sm mb-2">👋 Hi! I can help you with:</p>
            <ul className="text-xs space-y-1">
              <li>• Filtering candidates by location, followers, or activity</li>
              <li>• Drafting recruitment emails</li>
              <li>• Answering questions about candidates</li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div key={message.message_id || index}>
              {renderMessage(message)}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
