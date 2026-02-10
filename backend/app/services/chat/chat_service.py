"""Chat service for managing conversations and messages in Firestore."""

from typing import Optional, List, Dict, Any
from datetime import datetime
from app.services.firebase.firestore_service import get_firestore_service
from app.models.chat import (
    ConversationMetadata,
    ChatMessage,
    ConversationState,
    ChatIntent,
    MessageRole,
)


class ChatService:
    """Service for managing chat conversations and messages in Firestore."""

    JOB_SEARCHES_COLLECTION = "job_searches"
    CONVERSATIONS_SUBCOLLECTION = "conversations"
    MESSAGES_SUBCOLLECTION = "messages"

    def __init__(self):
        """Initialize the chat service."""
        self.firestore = get_firestore_service()

    async def create_conversation(
        self,
        user_id: str,
        session_id: str,
        job_description: Optional[str] = None,
    ) -> str:
        """Create a new conversation under a job search subcollection.

        Args:
            user_id: User ID who owns the conversation
            session_id: Associated search session ID (same as job_search_id)
            job_description: Optional job description from search

        Returns:
            Conversation ID
        """
        conversation_data = {
            "userId": user_id,
            "sessionId": session_id,
            "state": ConversationState.IDLE.value,
            "intent": None,
            "totalTokensUsed": 0,
            "clarificationCount": 0,
            "jobDescription": job_description,
            "currentFilters": None,
            "updatedAt": self.firestore.get_server_timestamp(),
        }

        # Create conversation under job search subcollection
        conversation_id = await self.firestore.create_subcollection_document(
            collection=self.JOB_SEARCHES_COLLECTION,
            document_id=session_id,  # Parent job search ID
            subcollection=self.CONVERSATIONS_SUBCOLLECTION,
            data=conversation_data,
        )

        return conversation_id

    async def get_conversation(
        self, conversation_id: str, job_search_id: str
    ) -> Optional[ConversationMetadata]:
        """Get conversation metadata by ID from nested subcollection.

        Args:
            conversation_id: Conversation ID
            job_search_id: Parent job search ID

        Returns:
            ConversationMetadata or None if not found
        """
        # Get document from nested subcollection
        doc_data = await self.firestore.get_document(
            collection=f"{self.JOB_SEARCHES_COLLECTION}/{job_search_id}/{self.CONVERSATIONS_SUBCOLLECTION}",
            document_id=conversation_id
        )

        if not doc_data:
            return None

        # Convert Firestore document to ConversationMetadata
        return ConversationMetadata(
            conversation_id=doc_data.get("id"),
            user_id=doc_data.get("userId"),
            session_id=doc_data.get("sessionId"),
            state=ConversationState(doc_data.get("state", ConversationState.IDLE.value)),
            intent=ChatIntent(doc_data["intent"]) if doc_data.get("intent") else None,
            total_tokens_used=doc_data.get("totalTokensUsed", 0),
            clarification_count=doc_data.get("clarificationCount", 0),
            job_description=doc_data.get("jobDescription"),
            current_filters=doc_data.get("currentFilters"),
            created_at=doc_data.get("createdAt"),
            updated_at=doc_data.get("updatedAt"),
        )

    async def get_conversations_for_search(
        self, job_search_id: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get all conversations for a job search from subcollection.

        Args:
            job_search_id: Job search ID
            limit: Maximum number of conversations to retrieve

        Returns:
            List of conversation dictionaries ordered by most recent
        """
        conversations = await self.firestore.get_subcollection_documents(
            collection=self.JOB_SEARCHES_COLLECTION,
            document_id=job_search_id,
            subcollection=self.CONVERSATIONS_SUBCOLLECTION,
            order_by="updatedAt",
            limit=limit,
        )

        return conversations

    async def get_conversation_by_session(
        self, session_id: str, user_id: str
    ) -> Optional[ConversationMetadata]:
        """Get the most recent conversation for a session (DEPRECATED - use get_conversations_for_search).

        Args:
            session_id: Search session ID (same as job_search_id)
            user_id: User ID

        Returns:
            ConversationMetadata or None if not found
        """
        # Get conversations from subcollection
        conversations = await self.get_conversations_for_search(session_id, limit=1)

        if not conversations:
            return None

        doc_data = conversations[0]

        # Verify user owns this conversation
        if doc_data.get("userId") != user_id:
            return None

        return ConversationMetadata(
            conversation_id=doc_data.get("id"),
            user_id=doc_data.get("userId"),
            session_id=doc_data.get("sessionId"),
            state=ConversationState(doc_data.get("state", ConversationState.IDLE.value)),
            intent=ChatIntent(doc_data["intent"]) if doc_data.get("intent") else None,
            total_tokens_used=doc_data.get("totalTokensUsed", 0),
            clarification_count=doc_data.get("clarificationCount", 0),
            job_description=doc_data.get("jobDescription"),
            current_filters=doc_data.get("currentFilters"),
            created_at=doc_data.get("createdAt"),
            updated_at=doc_data.get("updatedAt"),
        )

    async def save_message(
        self, job_search_id: str, conversation_id: str, message: ChatMessage
    ) -> str:
        """Save a message to a conversation in nested subcollection.

        Args:
            job_search_id: Job search ID (parent)
            conversation_id: Conversation ID
            message: ChatMessage to save

        Returns:
            Message ID
        """
        # Convert ChatMessage to Firestore document
        message_data = {
            "conversationId": conversation_id,
            "role": message.role.value,
            "type": message.type.value,
            "timestamp": message.timestamp,
            "tokensUsed": message.tokens_used,
        }

        # Add content fields based on type
        if message.text_content is not None:
            message_data["textContent"] = message.text_content

        if message.filter_proposal_content is not None:
            message_data["filterProposalContent"] = message.filter_proposal_content.model_dump()

        if message.clarification_content is not None:
            message_data["clarificationContent"] = message.clarification_content.model_dump()

        if message.multi_clarification_content is not None:
            message_data["multiClarificationContent"] = message.multi_clarification_content.model_dump()

        if message.email_draft_content is not None:
            message_data["emailDraftContent"] = message.email_draft_content.model_dump()

        if message.step_content is not None:
            message_data["stepContent"] = message.step_content

        # Save to nested subcollection: job_searches/{id}/conversations/{id}/messages
        message_id = await self.firestore.create_subcollection_document(
            collection=f"{self.JOB_SEARCHES_COLLECTION}/{job_search_id}/{self.CONVERSATIONS_SUBCOLLECTION}",
            document_id=conversation_id,
            subcollection=self.MESSAGES_SUBCOLLECTION,
            data=message_data,
        )

        return message_id

    async def get_messages(
        self, job_search_id: str, conversation_id: str, limit: Optional[int] = None
    ) -> List[ChatMessage]:
        """Get messages for a conversation from nested subcollection.

        Args:
            job_search_id: Job search ID (parent)
            conversation_id: Conversation ID
            limit: Optional maximum number of messages to retrieve

        Returns:
            List of ChatMessage objects
        """
        # Get messages from nested subcollection
        message_docs = await self.firestore.get_subcollection_documents(
            collection=f"{self.JOB_SEARCHES_COLLECTION}/{job_search_id}/{self.CONVERSATIONS_SUBCOLLECTION}",
            document_id=conversation_id,
            subcollection=self.MESSAGES_SUBCOLLECTION,
            order_by="timestamp",
            limit=limit,
        )

        messages = []
        for doc in message_docs:
            # Reconstruct ChatMessage from Firestore document
            message = ChatMessage(
                message_id=doc.get("id"),
                conversation_id=doc.get("conversationId"),
                role=MessageRole(doc.get("role")),
                type=doc.get("type"),
                timestamp=doc.get("timestamp"),
                tokens_used=doc.get("tokensUsed", 0),
                text_content=doc.get("textContent"),
                filter_proposal_content=doc.get("filterProposalContent"),
                clarification_content=doc.get("clarificationContent"),
                multi_clarification_content=doc.get("multiClarificationContent"),
                email_draft_content=doc.get("emailDraftContent"),
                step_content=doc.get("stepContent"),
            )
            messages.append(message)

        return messages

    async def update_conversation_state(
        self,
        job_search_id: str,
        conversation_id: str,
        state: Optional[ConversationState] = None,
        intent: Optional[ChatIntent] = None,
        tokens_used: Optional[int] = None,
        current_filters: Optional[Dict[str, Any]] = None,
        increment_clarifications: bool = False,
    ) -> bool:
        """Update conversation state and metadata in nested subcollection.

        Args:
            job_search_id: Job search ID (parent)
            conversation_id: Conversation ID
            state: New conversation state
            intent: New intent
            tokens_used: Tokens to add to total
            current_filters: Current filter state
            increment_clarifications: Whether to increment clarification count

        Returns:
            True if successful
        """
        update_data: Dict[str, Any] = {}

        if state is not None:
            update_data["state"] = state.value

        if intent is not None:
            update_data["intent"] = intent.value

        if current_filters is not None:
            update_data["currentFilters"] = current_filters

        # Get current conversation to update tokens
        if tokens_used is not None:
            conv = await self.get_conversation(conversation_id, job_search_id)
            if conv:
                update_data["totalTokensUsed"] = conv.total_tokens_used + tokens_used

        # Increment clarification count if needed
        if increment_clarifications:
            conv = await self.get_conversation(conversation_id, job_search_id)
            if conv:
                update_data["clarificationCount"] = conv.clarification_count + 1

        if update_data:
            # Update document in nested subcollection
            await self.firestore.update_document(
                collection=f"{self.JOB_SEARCHES_COLLECTION}/{job_search_id}/{self.CONVERSATIONS_SUBCOLLECTION}",
                document_id=conversation_id,
                data=update_data,
            )

        return True

    async def check_token_limit(
        self, job_search_id: str, conversation_id: str, max_tokens: int
    ) -> bool:
        """Check if conversation has exceeded token limit.

        Args:
            job_search_id: Job search ID (parent)
            conversation_id: Conversation ID
            max_tokens: Maximum allowed tokens

        Returns:
            True if under limit, False if exceeded
        """
        conversation = await self.get_conversation(conversation_id, job_search_id)
        if not conversation:
            return True

        return conversation.total_tokens_used < max_tokens

    async def check_clarification_limit(
        self, job_search_id: str, conversation_id: str, max_clarifications: int
    ) -> bool:
        """Check if conversation has exceeded clarification limit.

        Args:
            job_search_id: Job search ID (parent)
            conversation_id: Conversation ID
            max_clarifications: Maximum allowed clarifications

        Returns:
            True if under limit, False if exceeded
        """
        conversation = await self.get_conversation(conversation_id, job_search_id)
        if not conversation:
            return True

        return conversation.clarification_count < max_clarifications

    async def save_candidate_snapshot(
        self,
        job_search_id: str,
        conversation_id: str,
        candidates: List[Dict[str, Any]]
    ) -> bool:
        """Save snapshot of candidates at time of conversation.

        Args:
            job_search_id: Job search ID (parent)
            conversation_id: Conversation ID
            candidates: List of candidate dictionaries to snapshot

        Returns:
            True if successful, False otherwise
        """
        try:
            await self.firestore.update_document(
                collection=f"{self.JOB_SEARCHES_COLLECTION}/{job_search_id}/{self.CONVERSATIONS_SUBCOLLECTION}",
                document_id=conversation_id,
                data={"candidateSnapshot": candidates}
            )
            return True
        except Exception as e:
            # Log error but don't fail the conversation creation
            print(f"Failed to save candidate snapshot: {e}")
            return False


# Global service instance
_chat_service: Optional[ChatService] = None


def get_chat_service() -> ChatService:
    """Get the global ChatService instance.

    Returns:
        ChatService instance
    """
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service
