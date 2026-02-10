"""Chat agent orchestrator for managing conversation flow."""
from typing import List, Optional, Dict, Any
from datetime import datetime


from app.models.chat import (
   ChatMessage,
   MessageRole,
   MessageType,
   ConversationState,
   ChatIntent,
   FilterProposal,
   SendMessageResponse,
   MultiClarificationContent,
)
from app.models.requests import CandidateFilters
from app.models.responses import Candidate
from app.config import config
from app.services.chat.chat_service import get_chat_service
from app.services.chat.intent_classifier import get_intent_classifier
from app.services.chat.filter_extractor import get_filter_extractor
from app.services.chat.email_generator import get_email_generator
from app.services.chat.clarification_generator import get_clarification_generator
from app.services.cache.search_cache import get_search_cache
from app.services.filtering.candidate_filter import filter_candidates




class ChatAgent:
   """Main orchestrator for chat agent functionality."""


   def __init__(self):
       """Initialize the chat agent."""
       self.chat_service = get_chat_service()
       self.intent_classifier = get_intent_classifier()
       self.filter_extractor = get_filter_extractor()
       self.email_generator = get_email_generator()
       self.clarification_generator = get_clarification_generator(
           provider=config.LLM_PROVIDER,
           model=config.LLM_MODEL or None
       )
       self.search_cache = get_search_cache()


   async def process_message(
       self,
       conversation_id: Optional[str],
       session_id: str,
       user_id: str,
       message: str,
   ) -> SendMessageResponse:
       """Process a user message and generate response.


       Args:
           conversation_id: Existing conversation ID or None
           session_id: Search session ID (same as job_search_id)
           user_id: User ID
           message: User message text


       Returns:
           SendMessageResponse with conversation state and messages
       """
       # session_id IS the job_search_id (they're the same value)
       job_search_id = session_id

       # Get or create conversation
       if conversation_id:
           conversation = await self.chat_service.get_conversation(conversation_id, job_search_id)
           if not conversation:
               raise ValueError(f"Conversation {conversation_id} not found")
       else:
           # Get job description from search session
           session_data = self.search_cache.get_session_data(session_id)
           job_description = session_data.get("query") if session_data else None


           # Create new conversation
           conversation_id = await self.chat_service.create_conversation(
               user_id, session_id, job_description
           )
           conversation = await self.chat_service.get_conversation(conversation_id, job_search_id)


       # Check token limit
       if not await self.chat_service.check_token_limit(
           job_search_id, conversation_id, config.CHAT_MAX_TOKENS
       ):
           # Send token limit message
           error_message = ChatMessage(
               conversation_id=conversation_id,
               role=MessageRole.ASSISTANT,
               type=MessageType.TEXT,
               text_content="Token limit exceeded for this conversation. Please start a new conversation.",
               tokens_used=0,
           )
           message_id = await self.chat_service.save_message(job_search_id, conversation_id, error_message)
           error_message.message_id = message_id


           return SendMessageResponse(
               conversation_id=conversation_id,
               messages=[error_message],
               state=ConversationState.COMPLETED,
               requires_user_action=False,
           )


       # Save user message
       user_message = ChatMessage(
           conversation_id=conversation_id,
           role=MessageRole.USER,
           type=MessageType.TEXT,
           text_content=message,
           tokens_used=self._estimate_tokens(message),
       )
       message_id = await self.chat_service.save_message(job_search_id, conversation_id, user_message)
       user_message.message_id = message_id


       # Update token count
       await self.chat_service.update_conversation_state(
           job_search_id, conversation_id, tokens_used=user_message.tokens_used
       )


       # Classify intent if not already set or if state is idle
       if conversation.state == ConversationState.IDLE or conversation.intent is None:
           intent = self.intent_classifier.classify(message, conversation.intent)
           await self.chat_service.update_conversation_state(
               job_search_id,
               conversation_id,
               state=ConversationState.GATHERING_INFO,
               intent=intent,
           )
       else:
           intent = conversation.intent


       # Route to appropriate handler
       if intent == ChatIntent.FILTER_CANDIDATES:
           response_messages = await self._handle_filter_request(
               conversation_id, job_search_id, message, conversation.state
           )
       elif intent == ChatIntent.DRAFT_EMAIL:
           response_messages = await self._handle_email_request(
               conversation_id, job_search_id, conversation.job_description
           )
       elif intent == ChatIntent.CANDIDATE_INFO:
           response_messages = await self._handle_info_request(conversation_id, job_search_id, message)
       elif intent == ChatIntent.COMPARE_CANDIDATES:
           response_messages = await self._handle_compare_request(conversation_id, job_search_id)
       else:  # OUT_OF_SCOPE
           response_messages = await self._handle_out_of_scope(conversation_id, job_search_id)


       # Get updated conversation state
       updated_conversation = await self.chat_service.get_conversation(conversation_id, job_search_id)


       # Determine if user action is required
       requires_action = any(
           msg.type
           in [MessageType.FILTER_PROPOSAL, MessageType.CLARIFICATION]
           for msg in response_messages
       )


       return SendMessageResponse(
           conversation_id=conversation_id,
           messages=[user_message] + response_messages,
           state=updated_conversation.state,
           requires_user_action=requires_action,
       )


   async def _handle_filter_request(
       self, conversation_id: str, job_search_id: str, message: str, current_state: ConversationState
   ) -> List[ChatMessage]:
       """Handle filter-related requests using LLM-powered clarification generation.


       Args:
           conversation_id: Conversation ID
           job_search_id: Job search ID (parent)
           message: User message
           current_state: Current conversation state


       Returns:
           List of response messages
       """
       # Get conversation and session data for context
       conversation = await self.chat_service.get_conversation(conversation_id, job_search_id)
       session_data = self.search_cache.get_session_data(conversation.session_id)


       if not session_data:
           error_message = ChatMessage(
               conversation_id=conversation_id,
               role=MessageRole.ASSISTANT,
               type=MessageType.TEXT,
               text_content="I couldn't find the search session data. Please try refreshing the page.",
               tokens_used=20,
           )
           message_id = await self.chat_service.save_message(job_search_id, conversation_id, error_message)
           error_message.message_id = message_id
           return [error_message]


       # Get context
       candidates = session_data.get("candidates", [])
       candidate_count = len(candidates)
       job_description = conversation.job_description or session_data.get("jd_text", "")


       # Get conversation history for context
       messages = await self.chat_service.get_messages(job_search_id, conversation_id)
       conversation_history = [
           {
               "role": msg.role.value,
               "content": msg.text_content or ""
           }
           for msg in messages[-5:]  # Last 5 messages
           if msg.text_content
       ]


       try:
           # Generate clarifications using LLM
           multi_clarification = await self.clarification_generator.generate_clarifications(
               user_query=message,
               job_description=job_description,
               candidate_count=candidate_count,
               conversation_history=conversation_history
           )


           # Create multi-clarification message
           clarification_message = ChatMessage(
               conversation_id=conversation_id,
               role=MessageRole.ASSISTANT,
               type=MessageType.MULTI_CLARIFICATION,
               multi_clarification_content=multi_clarification,
               tokens_used=self._estimate_tokens(
                   " ".join([q.question for q in multi_clarification.questions])
               ),
           )
           message_id = await self.chat_service.save_message(job_search_id, conversation_id, clarification_message)
           clarification_message.message_id = message_id


           # Update state to gathering info
           await self.chat_service.update_conversation_state(
               job_search_id,
               conversation_id,
               state=ConversationState.GATHERING_INFO,
               tokens_used=clarification_message.tokens_used,
           )


           return [clarification_message]


       except Exception as e:
           # If LLM fails, fallback to asking for more information
           error_text = "I'd like to help refine your search. Could you provide more details about what you're looking for?"
           fallback_message = ChatMessage(
               conversation_id=conversation_id,
               role=MessageRole.ASSISTANT,
               type=MessageType.TEXT,
               text_content=error_text,
               tokens_used=self._estimate_tokens(error_text),
           )
           message_id = await self.chat_service.save_message(job_search_id, conversation_id, fallback_message)
           fallback_message.message_id = message_id
           await self.chat_service.update_conversation_state(
               job_search_id, conversation_id, tokens_used=fallback_message.tokens_used
           )


           return [fallback_message]


   async def _handle_email_request(
       self, conversation_id: str, job_search_id: str, job_description: Optional[str]
   ) -> List[ChatMessage]:
       """Handle email drafting requests.


       Args:
           conversation_id: Conversation ID
           job_search_id: Job search ID (parent)
           job_description: Job description from search


       Returns:
           List of response messages
       """
       # Generate email
       email_draft = self.email_generator.generate_email(job_description)


       # Create email draft message
       email_message = ChatMessage(
           conversation_id=conversation_id,
           role=MessageRole.ASSISTANT,
           type=MessageType.EMAIL_DRAFT,
           email_draft_content=email_draft,
           tokens_used=self._estimate_tokens(email_draft.subject + email_draft.body),
       )
       message_id = await self.chat_service.save_message(job_search_id, conversation_id, email_message)
       email_message.message_id = message_id


       # Update state to completed
       await self.chat_service.update_conversation_state(
           job_search_id,
           conversation_id,
           state=ConversationState.COMPLETED,
           tokens_used=email_message.tokens_used,
       )


       return [email_message]


   async def _handle_info_request(
       self, conversation_id: str, job_search_id: str, message: str
   ) -> List[ChatMessage]:
       """Handle candidate info requests.


       Args:
           conversation_id: Conversation ID
           job_search_id: Job search ID (parent)
           message: User message


       Returns:
           List of response messages
       """
       # For now, just acknowledge
       response_text = "Candidate information lookup is coming soon! For now, you can view candidate details in the dashboard table."
       response_message = ChatMessage(
           conversation_id=conversation_id,
           role=MessageRole.ASSISTANT,
           type=MessageType.TEXT,
           text_content=response_text,
           tokens_used=self._estimate_tokens(response_text),
       )
       message_id = await self.chat_service.save_message(job_search_id, conversation_id, response_message)
       response_message.message_id = message_id
       await self.chat_service.update_conversation_state(
           job_search_id, conversation_id, tokens_used=response_message.tokens_used
       )


       return [response_message]


   async def _handle_compare_request(self, conversation_id: str, job_search_id: str) -> List[ChatMessage]:
       """Handle candidate comparison requests.


       Args:
           conversation_id: Conversation ID
           job_search_id: Job search ID (parent)


       Returns:
           List of response messages
       """
       response_text = "Candidate comparison is coming soon! You can currently view and compare candidates in the dashboard table."
       response_message = ChatMessage(
           conversation_id=conversation_id,
           role=MessageRole.ASSISTANT,
           type=MessageType.TEXT,
           text_content=response_text,
           tokens_used=self._estimate_tokens(response_text),
       )
       message_id = await self.chat_service.save_message(job_search_id, conversation_id, response_message)
       response_message.message_id = message_id
       await self.chat_service.update_conversation_state(
           job_search_id, conversation_id, tokens_used=response_message.tokens_used
       )


       return [response_message]


   async def _handle_out_of_scope(self, conversation_id: str, job_search_id: str) -> List[ChatMessage]:
       """Handle out-of-scope requests.


       Args:
           conversation_id: Conversation ID
           job_search_id: Job search ID (parent)


       Returns:
           List of response messages
       """
       response_text = "I can help you filter candidates or draft recruitment emails. Please ask about filtering results or creating an outreach email."
       response_message = ChatMessage(
           conversation_id=conversation_id,
           role=MessageRole.ASSISTANT,
           type=MessageType.TEXT,
           text_content=response_text,
           tokens_used=self._estimate_tokens(response_text),
       )
       await self.chat_service.save_message(job_search_id, conversation_id, response_message)
       await self.chat_service.update_conversation_state(
           job_search_id,
           conversation_id,
           state=ConversationState.COMPLETED,
           tokens_used=response_message.tokens_used,
       )


       return [response_message]


   def _estimate_tokens(self, text: str) -> int:
       """Estimate token count for text.


       Args:
           text: Text to estimate


       Returns:
           Estimated token count (characters / 4)
       """
       return len(text) // 4




# Global agent instance
_chat_agent: Optional[ChatAgent] = None




def get_chat_agent() -> ChatAgent:
   """Get the global ChatAgent instance.


   Returns:
       ChatAgent instance
   """
   global _chat_agent
   if _chat_agent is None:
       _chat_agent = ChatAgent()
   return _chat_agent




