import { useState, useCallback, useEffect } from "react";
import {
    ChatMessage,
    ConversationState,
    FilterProposal,
    SendMessageRequest,
} from "../types/dashboard";
import {
    sendChatMessage,
    confirmFilter as confirmFilterAPI,
    answerClarification as answerClarificationAPI,
    getConversationBySession,
    getConversationHistory,
} from "../api/chat";

interface UseChatOptions {
    sessionId: string;
    onFiltersApplied?: (filters: FilterProposal) => void;
}

interface UseChatReturn {
    messages: ChatMessage[];
    conversationId: string | undefined;
    conversationState: ConversationState;
    isLoading: boolean;
    error: string | null;
    requiresUserAction: boolean;
    sendMessage: (message: string) => Promise<void>;
    confirmFilter: (
        messageId: string,
        confirmed: boolean,
        modifiedFilters?: FilterProposal
    ) => Promise<void>;
    answerMultiClarification: (messageId: string, answers: Record<string, string>) => Promise<void>;
    clearError: () => void;
    clearConversation: () => void;
    loadConversation: (conversationId: string) => Promise<void>;
}

/**
 * Hook for managing chat state and interactions
 */
export function useChat(options: UseChatOptions): UseChatReturn {
    const { sessionId, onFiltersApplied } = options;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversationId, setConversationId] = useState<string | undefined>();
    const [conversationState, setConversationState] =
        useState<ConversationState>("idle");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requiresUserAction, setRequiresUserAction] = useState(false);

    // Load existing conversation on mount
    useEffect(() => {
        const loadConversation = async () => {
            try {
                const conversation = await getConversationBySession(sessionId);
                if (conversation) {
                    setConversationId(conversation.conversation_id);
                    setConversationState(conversation.state);
                }
            } catch (err) {
                // No existing conversation, will create one on first message
                console.log("No existing conversation for session");
            }
        };

        loadConversation();
    }, [sessionId]);

    const sendMessage = useCallback(
        async (message: string) => {
            setIsLoading(true);
            setError(null);

            // Optimistic update: Add user message immediately
            const optimisticUserMessage: ChatMessage = {
                conversation_id: conversationId || 'pending',
                role: 'user',
                type: 'text',
                timestamp: new Date(),
                tokens_used: 0,
                text_content: message,
            };
            setMessages((prev) => [...prev, optimisticUserMessage]);

            try {
                const request: SendMessageRequest = {
                    conversation_id: conversationId,
                    session_id: sessionId,
                    message,
                };

                const response = await sendChatMessage(request);

                // Update state
                setConversationId(response.conversation_id);
                setConversationState(response.state);
                setRequiresUserAction(response.requires_user_action);

                // Filter out user message from response (we already added it)
                const assistantMessages = response.messages.filter(
                    msg => msg.role !== 'user'
                );

                // Add only assistant messages
                setMessages((prev) => [...prev, ...assistantMessages]);
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Failed to send message";
                setError(errorMessage);

                // Rollback: Remove optimistic message on error
                setMessages((prev) =>
                    prev.filter(msg => msg !== optimisticUserMessage)
                );
            } finally {
                setIsLoading(false);
            }
        },
        [conversationId, sessionId]
    );

    const confirmFilter = useCallback(
        async (
            messageId: string,
            confirmed: boolean,
            modifiedFilters?: FilterProposal
        ) => {
            if (!conversationId) {
                setError("No active conversation");
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await confirmFilterAPI(
                    conversationId,
                    messageId,
                    confirmed,
                    modifiedFilters
                );

                if (response.status === "confirmed" && response.filters) {
                    // Convert backend filters to FilterProposal format
                    const filterProposal: FilterProposal = {
                        location: response.filters.location,
                        followers_min: response.filters.followers_min,
                        followers_max: response.filters.followers_max,
                        has_email: response.filters.has_email,
                        has_any_contact: response.filters.has_any_contact,
                        last_contribution: response.filters.last_contribution,
                        explanation: response.message,
                    };

                    // Notify parent component to apply filters
                    onFiltersApplied?.(filterProposal);

                    // Add confirmation message
                    const confirmationMessage: ChatMessage = {
                        conversation_id: conversationId,
                        role: "assistant",
                        type: "text",
                        timestamp: new Date(),
                        tokens_used: 0,
                        text_content: response.message,
                    };
                    setMessages((prev) => [...prev, confirmationMessage]);
                    setConversationState("completed");
                } else {
                    // Add rejection message
                    const rejectionMessage: ChatMessage = {
                        conversation_id: conversationId,
                        role: "assistant",
                        type: "text",
                        timestamp: new Date(),
                        tokens_used: 0,
                        text_content: response.message,
                    };
                    setMessages((prev) => [...prev, rejectionMessage]);
                    setConversationState("gathering_info");
                }

                setRequiresUserAction(false);
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : "Failed to confirm filter";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [conversationId, onFiltersApplied]
    );

    const answerMultiClarification = useCallback(
        async (messageId: string, answers: Record<string, string>) => {
            if (!conversationId) {
                setError("No active conversation");
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await answerClarificationAPI(
                    conversationId,
                    messageId,
                    answers,
                    sessionId
                );

                // Add confirmation message
                const confirmationMessage: ChatMessage = {
                    conversation_id: conversationId,
                    role: "assistant",
                    type: "text",
                    timestamp: new Date(),
                    tokens_used: 0,
                    text_content: response.message,
                };
                setMessages((prev) => [...prev, confirmationMessage]);
                setConversationState("completed");
                setRequiresUserAction(false);

                // Trigger filters applied callback to refresh candidate table
                // The backend has already updated the session with new candidates
                onFiltersApplied?.({
                    explanation: response.message,
                    estimated_count: response.total_found,
                });
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : "Failed to process clarification answers";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [conversationId, sessionId, onFiltersApplied]
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const clearConversation = useCallback(() => {
        setMessages([]);
        setConversationId(undefined);
        setConversationState("idle");
        setRequiresUserAction(false);
        setError(null);
    }, []);

    const loadConversation = useCallback(async (convId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const history = await getConversationHistory(convId);
            setConversationId(history.conversation_id);
            setMessages(history.messages);
            setConversationState(history.metadata.state);
            setRequiresUserAction(false);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load conversation";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        messages,
        conversationId,
        conversationState,
        isLoading,
        error,
        requiresUserAction,
        sendMessage,
        confirmFilter,
        answerMultiClarification,
        clearError,
        clearConversation,
        loadConversation,
    };
}
