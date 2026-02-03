"""Chat API routes for conversation and message management."""

import logging
from typing import List
from fastapi import APIRouter, HTTPException, Query
from app.models.chat import (
    SendMessageRequest,
    SendMessageResponse,
    ConfirmFilterRequest,
    ConversationHistoryResponse,
    ChatMessage,
    MessageRole,
    MessageType,
)
from app.models.requests import CandidateFilters
from app.services.chat.agent import get_chat_agent
from app.services.chat.chat_service import get_chat_service
from app.services.cache.search_cache import get_search_cache
from app.services.filtering.candidate_filter import filter_candidates
from app.services.firebase.auth import CurrentUser, FirebaseUser

logger = logging.getLogger("gitscout.chat")

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message", response_model=SendMessageResponse)
async def send_message(
    request: SendMessageRequest,
    current_user: CurrentUser,
):
    """Send a message in a conversation and get AI response.

    Args:
        request: Message request with conversation ID, session ID, and message
        current_user: Authenticated user

    Returns:
        SendMessageResponse with conversation state and messages
    """
    logger.info(
        f"POST /chat/message - user: {current_user.uid}, "
        f"session: {request.session_id}, "
        f"conversation: {request.conversation_id}"
    )
    logger.debug(f"Message: {request.message[:100]}...")

    try:
        # Validate session exists
        search_cache = get_search_cache()
        session_data = search_cache.get_session_data(request.session_id)
        if not session_data:
            raise HTTPException(
                status_code=404,
                detail=f"Search session {request.session_id} not found. Please start a new search first.",
            )

        # Process message through chat agent
        agent = get_chat_agent()
        response = await agent.process_message(
            conversation_id=request.conversation_id,
            session_id=request.session_id,
            user_id=current_user.uid,
            message=request.message,
        )

        logger.info(
            f"POST /chat/message complete - conversation: {response.conversation_id}, "
            f"messages: {len(response.messages)}, state: {response.state}"
        )

        return response

    except ValueError as e:
        logger.warning(f"POST /chat/message validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"POST /chat/message internal error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/filter/confirm")
async def confirm_filter(
    request: ConfirmFilterRequest,
    current_user: CurrentUser,
):
    """Confirm or reject a filter proposal.

    Args:
        request: Filter confirmation request
        current_user: Authenticated user

    Returns:
        Dict with applied filters or rejection message
    """
    logger.info(
        f"POST /chat/filter/confirm - user: {current_user.uid}, "
        f"conversation: {request.conversation_id}, "
        f"confirmed: {request.confirmed}"
    )

    try:
        chat_service = get_chat_service()

        # Get conversation
        conversation = await chat_service.get_conversation(request.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Verify user owns the conversation
        if conversation.user_id != current_user.uid:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Get the filter proposal message
        messages = await chat_service.get_messages(request.conversation_id)
        proposal_message = None
        for msg in messages:
            if msg.message_id == request.message_id:
                if msg.type != MessageType.FILTER_PROPOSAL:
                    raise HTTPException(
                        status_code=400,
                        detail="Message is not a filter proposal",
                    )
                proposal_message = msg
                break

        if not proposal_message:
            raise HTTPException(status_code=404, detail="Filter proposal message not found")

        if request.confirmed:
            # Use modified filters if provided, otherwise use original proposal
            filters = (
                request.modified_filters
                if request.modified_filters
                else proposal_message.filter_proposal_content
            )

            # Convert to CandidateFilters
            candidate_filters = CandidateFilters(
                location=filters.location,
                followers_min=filters.followers_min,
                followers_max=filters.followers_max,
                has_email=filters.has_email,
                has_any_contact=filters.has_any_contact,
                last_contribution=filters.last_contribution,
            )

            # Save confirmation message
            confirmation_text = f"Filters applied: {filters.explanation}"
            confirmation_message = ChatMessage(
                conversation_id=request.conversation_id,
                role=MessageRole.ASSISTANT,
                type=MessageType.TEXT,
                text_content=confirmation_text,
                tokens_used=len(confirmation_text) // 4,
            )
            await chat_service.save_message(request.conversation_id, confirmation_message)

            # Update conversation state
            from app.models.chat import ConversationState

            await chat_service.update_conversation_state(
                request.conversation_id,
                state=ConversationState.COMPLETED,
                current_filters=candidate_filters.model_dump(exclude_none=True),
            )

            logger.info(f"Filters confirmed and applied for conversation {request.conversation_id}")

            return {
                "status": "confirmed",
                "filters": candidate_filters.model_dump(exclude_none=True),
                "message": confirmation_text,
            }
        else:
            # User rejected the filters
            rejection_text = "Filters rejected. Please tell me what you'd like to change."
            rejection_message = ChatMessage(
                conversation_id=request.conversation_id,
                role=MessageRole.ASSISTANT,
                type=MessageType.TEXT,
                text_content=rejection_text,
                tokens_used=len(rejection_text) // 4,
            )
            await chat_service.save_message(request.conversation_id, rejection_message)

            # Reset state to gathering info
            from app.models.chat import ConversationState

            await chat_service.update_conversation_state(
                request.conversation_id,
                state=ConversationState.GATHERING_INFO,
            )

            logger.info(f"Filters rejected for conversation {request.conversation_id}")

            return {
                "status": "rejected",
                "message": rejection_text,
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"POST /chat/filter/confirm internal error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/conversation", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    conversation_id: str = Query(..., description="Conversation ID"),
    current_user: CurrentUser = None,
):
    """Get conversation history.

    Args:
        conversation_id: Conversation ID to retrieve
        current_user: Authenticated user

    Returns:
        ConversationHistoryResponse with metadata and messages
    """
    logger.info(f"GET /chat/conversation - user: {current_user.uid}, conversation: {conversation_id}")

    try:
        chat_service = get_chat_service()

        # Get conversation
        conversation = await chat_service.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Verify user owns the conversation
        if conversation.user_id != current_user.uid:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Get messages
        messages = await chat_service.get_messages(conversation_id)

        logger.info(
            f"GET /chat/conversation complete - {len(messages)} messages retrieved"
        )

        return ConversationHistoryResponse(
            conversation_id=conversation_id,
            metadata=conversation,
            messages=messages,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GET /chat/conversation internal error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/conversation/by-session")
async def get_conversation_by_session(
    session_id: str = Query(..., description="Search session ID"),
    current_user: CurrentUser = None,
):
    """Get the most recent conversation for a search session.

    Args:
        session_id: Search session ID
        current_user: Authenticated user

    Returns:
        Conversation metadata or null if not found
    """
    logger.info(
        f"GET /chat/conversation/by-session - user: {current_user.uid}, session: {session_id}"
    )

    try:
        chat_service = get_chat_service()

        # Get conversation
        conversation = await chat_service.get_conversation_by_session(
            session_id, current_user.uid
        )

        if not conversation:
            return None

        logger.info(
            f"GET /chat/conversation/by-session complete - conversation: {conversation.conversation_id}"
        )

        return conversation.model_dump()

    except Exception as e:
        logger.error(f"GET /chat/conversation/by-session internal error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
