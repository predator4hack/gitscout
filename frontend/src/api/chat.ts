import {
    SendMessageRequest,
    SendMessageResponse,
    FilterProposal,
    ConversationMetadata,
    ChatMessage,
} from "../types/dashboard";
import { config } from "../config";
import { auth } from "../lib/firebase";

/**
 * Get the current user's auth token for API requests
 */
async function getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
        return null;
    }
    return user.getIdToken();
}

/**
 * Send a chat message and get AI response
 */
export async function sendChatMessage(
    request: SendMessageRequest
): Promise<SendMessageResponse> {
    const token = await getAuthToken();
    if (!token) {
        throw new Error("User not authenticated");
    }

    const response = await fetch(`${config.apiBaseUrl}/api/chat/message`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
            error.detail || `HTTP error! status: ${response.status}`
        );
    }

    const data = await response.json();

    // Convert timestamp strings to Date objects
    return {
        ...data,
        messages: data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
        })),
    };
}

/**
 * Confirm or reject a filter proposal
 */
export async function confirmFilter(
    conversationId: string,
    messageId: string,
    confirmed: boolean,
    modifiedFilters?: FilterProposal
): Promise<{
    status: "confirmed" | "rejected";
    filters?: Record<string, any>;
    message: string;
}> {
    const token = await getAuthToken();
    if (!token) {
        throw new Error("User not authenticated");
    }

    const response = await fetch(`${config.apiBaseUrl}/api/chat/filter/confirm`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            conversation_id: conversationId,
            message_id: messageId,
            confirmed,
            modified_filters: modifiedFilters,
        }),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
            error.detail || `HTTP error! status: ${response.status}`
        );
    }

    return response.json();
}

/**
 * Get conversation history
 */
export async function getConversationHistory(
    conversationId: string
): Promise<{
    conversation_id: string;
    metadata: ConversationMetadata;
    messages: ChatMessage[];
}> {
    const token = await getAuthToken();
    if (!token) {
        throw new Error("User not authenticated");
    }

    const response = await fetch(
        `${config.apiBaseUrl}/api/chat/conversation?conversation_id=${conversationId}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
            error.detail || `HTTP error! status: ${response.status}`
        );
    }

    const data = await response.json();

    // Convert timestamp strings to Date objects
    return {
        ...data,
        metadata: {
            ...data.metadata,
            created_at: new Date(data.metadata.created_at),
            updated_at: new Date(data.metadata.updated_at),
        },
        messages: data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
        })),
    };
}

/**
 * Get conversation by session ID
 */
export async function getConversationBySession(
    sessionId: string
): Promise<ConversationMetadata | null> {
    const token = await getAuthToken();
    if (!token) {
        throw new Error("User not authenticated");
    }

    const response = await fetch(
        `${config.apiBaseUrl}/api/chat/conversation/by-session?session_id=${sessionId}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
            error.detail || `HTTP error! status: ${response.status}`
        );
    }

    const data = await response.json();

    if (!data) {
        return null;
    }

    // Convert timestamp strings to Date objects
    return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
    };
}

/**
 * Submit answers to clarification questions
 */
export async function answerClarification(
    conversationId: string,
    messageId: string,
    answers: Record<string, string>
): Promise<{
    status: string;
    session_id: string;
    total_found: number;
    message: string;
}> {
    const token = await getAuthToken();
    if (!token) {
        throw new Error("User not authenticated");
    }

    const response = await fetch(
        `${config.apiBaseUrl}/api/chat/clarification/answer`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                conversation_id: conversationId,
                message_id: messageId,
                answers,
            }),
        }
    );

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
            error.detail || `HTTP error! status: ${response.status}`
        );
    }

    return response.json();
}
