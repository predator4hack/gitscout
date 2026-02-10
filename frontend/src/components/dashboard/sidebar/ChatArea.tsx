import { useRef, useEffect, useState } from 'react';
import type { ChatMessage as ChatMessageType } from '../../../types/dashboard';
import { FilterProposalMessage } from './FilterProposalMessage';
import { ClarificationMessage } from './ClarificationMessage';
import { MultiClarificationMessage } from './MultiClarificationMessage';
import { EmailDraftMessage } from './EmailDraftMessage';
import { LoadingIndicator } from './LoadingIndicator';

interface ChatAreaProps {
  messages: ChatMessageType[];
  onConfirmFilter: (messageId: string, confirmed: boolean) => void;
  onAnswerClarification: (answer: string) => void;
  onAnswerMultiClarification?: (messageId: string, answers: Record<string, string>) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ChatArea({
  messages,
  onConfirmFilter,
  onAnswerClarification,
  onAnswerMultiClarification,
  disabled = false,
  isLoading = false
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const renderMessage = (message: ChatMessageType) => {
    const isUser = message.role === 'user';

    // User message
    if (isUser && message.text_content) {
      return (
        <div className="flex flex-col items-end">
          <div className="text-[10px] text-zinc-500 mb-1 mr-1">You</div>
          <div className="bg-white text-black text-xs p-3 rounded-xl rounded-tr-sm shadow-lg max-w-[90%] leading-relaxed font-medium">
            {message.text_content}
          </div>
        </div>
      );
    }

    // Assistant messages
    if (message.role === 'assistant') {
      return (
        <div className="flex flex-col items-start max-w-[95%]">
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-[10px] text-zinc-500 ml-1">AI Assistant</span>
            {message.text_content && (
              <button
                onClick={() => handleCopyMessage(message.message_id || '', message.text_content || '')}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {copiedMessageId === message.message_id ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <div className="w-full">
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

            {/* Multi Clarification Questions */}
            {message.type === 'multi_clarification' && message.multi_clarification_content && (
              <MultiClarificationMessage
                content={message.multi_clarification_content}
                messageId={message.message_id || ''}
                onAnswer={onAnswerMultiClarification || (() => {})}
                disabled={disabled}
              />
            )}

            {/* Email Draft */}
            {message.type === 'email_draft' && message.email_draft_content && (
              <EmailDraftMessage emailDraft={message.email_draft_content} />
            )}

            {/* Text Message */}
            {message.type === 'text' && message.text_content && (
              <div className="bg-[#1E2024] border border-white/5 text-zinc-300 rounded-xl rounded-tl-sm p-3 shadow-lg">
                <p className="text-xs whitespace-pre-wrap leading-relaxed">{message.text_content}</p>
              </div>
            )}

            {/* Step Indicator */}
            {message.type === 'step' && message.step_content && (
              <div className="bg-gs-purple/20 border border-gs-purple/30 text-gs-purple rounded-xl rounded-tl-sm p-3">
                <p className="text-xs flex items-center gap-2">
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

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex flex-col items-start max-w-[95%] animate-in fade-in duration-200">
              <div className="text-[10px] text-zinc-500 mb-1 ml-1">AI Assistant</div>
              <div className="bg-[#1E2024] border border-white/5 rounded-xl rounded-tl-sm p-3 shadow-lg">
                <LoadingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
