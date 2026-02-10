import { useState, useEffect, useRef } from 'react';
import { Icon } from '../../shared/Icon';
import { listConversationsBySearch, ConversationSummary } from '../../../api/chat';

interface ConversationDropdownProps {
  searchId: string;
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

export function ConversationDropdown({
  searchId,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Load conversations when dropdown opens
  useEffect(() => {
    if (isOpen && conversations.length === 0) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listConversationsBySearch(searchId);
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError((err as Error).message);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setIsOpen(false);
    onSelectConversation(conversationId);
  };

  const handleNewConversation = () => {
    setIsOpen(false);
    onNewConversation();
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gs-text-muted hover:text-white hover:bg-white/[0.06] rounded-md transition-colors border border-white/[0.06]"
      >
        <Icon icon="lucide:message-circle" className="w-3.5 h-3.5" />
        <span>Conversations</span>
        <Icon
          icon="lucide:chevron-down"
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 bg-[#1a1a1a] border border-white/[0.08] rounded-lg shadow-xl z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gs-purple hover:bg-gs-purple-dark text-white rounded-md transition-colors text-sm font-medium"
            >
              <Icon icon="lucide:plus" className="w-4 h-4" />
              New Conversation
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gs-purple"></div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="px-3 py-4 text-xs text-red-400 text-center">
                Failed to load conversations
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && conversations.length === 0 && (
              <div className="px-3 py-8 text-center">
                <Icon icon="lucide:message-circle" className="w-8 h-8 text-gs-text-muted mx-auto mb-2" />
                <p className="text-xs text-gs-text-muted">No past conversations</p>
              </div>
            )}

            {/* Conversations List */}
            {!isLoading && !error && conversations.length > 0 && (
              <div className="py-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => handleSelectConversation(conv.conversation_id)}
                    className={`w-full px-3 py-2.5 text-left hover:bg-white/[0.06] transition-colors border-l-2 ${
                      conv.conversation_id === currentConversationId
                        ? 'border-gs-purple bg-white/[0.04]'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-gs-text-main line-clamp-1">
                        {conv.title || 'Untitled Conversation'}
                      </span>
                      <span className="text-[10px] text-gs-text-muted flex-shrink-0">
                        {formatDate(conv.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gs-text-muted">
                      <span className="capitalize">{conv.state.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{conv.message_count} messages</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
