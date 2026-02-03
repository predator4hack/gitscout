from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime


class MessageRole(str, Enum):
    """Role of the message sender"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageType(str, Enum):
    """Type of message content"""
    TEXT = "text"
    FILTER_PROPOSAL = "filter_proposal"
    CLARIFICATION = "clarification"
    EMAIL_DRAFT = "email_draft"
    STEP = "step"


class ConversationState(str, Enum):
    """Current state of the conversation"""
    IDLE = "idle"
    GATHERING_INFO = "gathering_info"
    AWAITING_CONFIRMATION = "awaiting_confirmation"
    APPLYING_FILTERS = "applying_filters"
    COMPLETED = "completed"


class ChatIntent(str, Enum):
    """Classified intent of user's message"""
    FILTER_CANDIDATES = "filter_candidates"
    DRAFT_EMAIL = "draft_email"
    CANDIDATE_INFO = "candidate_info"
    COMPARE_CANDIDATES = "compare_candidates"
    OUT_OF_SCOPE = "out_of_scope"


class FilterProposal(BaseModel):
    """Proposed filters to apply to candidates"""
    location: Optional[str] = Field(None, description="Location filter")
    followers_min: Optional[int] = Field(None, ge=0, description="Minimum followers")
    followers_max: Optional[int] = Field(None, ge=0, description="Maximum followers")
    has_email: Optional[bool] = Field(None, description="Must have email")
    has_any_contact: Optional[bool] = Field(None, description="Must have any contact")
    last_contribution: Optional[str] = Field(None, description="Last contribution timeframe")
    explanation: str = Field(..., description="Human-readable explanation of filters")
    estimated_count: Optional[int] = Field(None, description="Estimated result count")


class EmailDraft(BaseModel):
    """Generated email draft"""
    subject: str = Field(..., description="Email subject line")
    body: str = Field(..., description="Email body content")
    target_candidate: Optional[str] = Field(None, description="Target candidate username if specific")
    is_generic: bool = Field(True, description="Whether this is a generic or personalized email")


class ClarificationOption(BaseModel):
    """Option for a clarification question"""
    label: str = Field(..., description="Display label for the option")
    value: str = Field(..., description="Value to send when selected")


class ClarificationQuestion(BaseModel):
    """Question to ask user for clarification"""
    question: str = Field(..., description="The question text")
    options: List[ClarificationOption] = Field(..., description="Available options")
    allow_custom: bool = Field(False, description="Whether to allow custom text input")
    field_name: str = Field(..., description="Field name this question clarifies")


class ChatMessage(BaseModel):
    """A single message in the conversation"""
    message_id: Optional[str] = Field(None, description="Unique message ID")
    conversation_id: str = Field(..., description="Parent conversation ID")
    role: MessageRole = Field(..., description="Message sender role")
    type: MessageType = Field(default=MessageType.TEXT, description="Message type")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")
    tokens_used: int = Field(default=0, description="Tokens consumed by this message")

    # Content variants based on type
    text_content: Optional[str] = Field(None, description="Text content for TEXT type")
    filter_proposal_content: Optional[FilterProposal] = Field(None, description="Filter proposal for FILTER_PROPOSAL type")
    clarification_content: Optional[ClarificationQuestion] = Field(None, description="Clarification for CLARIFICATION type")
    email_draft_content: Optional[EmailDraft] = Field(None, description="Email draft for EMAIL_DRAFT type")
    step_content: Optional[str] = Field(None, description="Step description for STEP type")


class ConversationMetadata(BaseModel):
    """Metadata for a conversation"""
    conversation_id: Optional[str] = Field(None, description="Unique conversation ID")
    user_id: str = Field(..., description="User who owns this conversation")
    session_id: str = Field(..., description="Associated search session ID")
    state: ConversationState = Field(default=ConversationState.IDLE, description="Current conversation state")
    intent: Optional[ChatIntent] = Field(None, description="Classified intent")
    total_tokens_used: int = Field(default=0, description="Total tokens used in conversation")
    clarification_count: int = Field(default=0, description="Number of clarifications asked")
    job_description: Optional[str] = Field(None, description="Job description from search session")
    current_filters: Optional[Dict[str, Any]] = Field(None, description="Current active filters")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")


class SendMessageRequest(BaseModel):
    """Request to send a chat message"""
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID or None to create new")
    session_id: str = Field(..., description="Search session ID")
    message: str = Field(..., description="User message text")


class ConfirmFilterRequest(BaseModel):
    """Request to confirm or reject filter proposal"""
    conversation_id: str = Field(..., description="Conversation ID")
    message_id: str = Field(..., description="Message ID containing the filter proposal")
    confirmed: bool = Field(..., description="Whether filters are confirmed")
    modified_filters: Optional[FilterProposal] = Field(None, description="Modified filters if user adjusted them")


class SendMessageResponse(BaseModel):
    """Response after sending a message"""
    conversation_id: str = Field(..., description="Conversation ID")
    messages: List[ChatMessage] = Field(..., description="New messages (user + assistant)")
    state: ConversationState = Field(..., description="Current conversation state")
    requires_user_action: bool = Field(default=False, description="Whether user action is needed")


class ConversationHistoryResponse(BaseModel):
    """Response with conversation history"""
    conversation_id: str = Field(..., description="Conversation ID")
    metadata: ConversationMetadata = Field(..., description="Conversation metadata")
    messages: List[ChatMessage] = Field(..., description="All messages in conversation")
