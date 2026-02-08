// Dashboard-specific type definitions

export interface DashboardRepository {
  name: string;
  url: string;
}

export interface DashboardCandidate {
  id: string;
  login: string;
  name: string | null;
  avatarUrl: string;
  url: string;
  repositories: DashboardRepository[];
  location: string | null;
  description: string;
  followers: number;
  score: number;
  isStarred: boolean;
  // Contact fields - aligned with API Candidate type
  email: string | null;
  linkedInUrl: string | null;
  twitterUsername: string | null;
  websiteUrl: string | null;
}

export interface StepIndicator {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

// Chat-related types
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'text' | 'filter_proposal' | 'clarification' | 'multi_clarification' | 'email_draft' | 'step';
export type ConversationState = 'idle' | 'gathering_info' | 'awaiting_confirmation' | 'applying_filters' | 'completed';
export type ChatIntent = 'filter_candidates' | 'draft_email' | 'candidate_info' | 'compare_candidates' | 'out_of_scope';

export interface FilterProposal {
  location?: string | null;
  followers_min?: number | null;
  followers_max?: number | null;
  has_email?: boolean | null;
  has_any_contact?: boolean | null;
  last_contribution?: string | null;
  explanation: string;
  estimated_count?: number | null;
}

export interface EmailDraft {
  subject: string;
  body: string;
  target_candidate?: string | null;
  is_generic: boolean;
}

export interface ClarificationOption {
  label: string;
  value: string;
}

export interface ClarificationQuestion {
  question: string;
  options: ClarificationOption[];
  allow_custom: boolean;
  field_name: string;
}

export interface MultiClarificationContent {
  questions: ClarificationQuestion[];
  answers?: Record<string, string> | null;
  all_answered: boolean;
}

export interface ChatMessage {
  message_id?: string;
  conversation_id: string;
  role: MessageRole;
  type: MessageType;
  timestamp: Date;
  tokens_used: number;
  // Content variants
  text_content?: string | null;
  filter_proposal_content?: FilterProposal | null;
  clarification_content?: ClarificationQuestion | null;
  multi_clarification_content?: MultiClarificationContent | null;
  email_draft_content?: EmailDraft | null;
  step_content?: string | null;
}

export interface ConversationMetadata {
  conversation_id?: string;
  user_id: string;
  session_id: string;
  state: ConversationState;
  intent?: ChatIntent | null;
  total_tokens_used: number;
  clarification_count: number;
  job_description?: string | null;
  current_filters?: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface SendMessageRequest {
  conversation_id?: string | null;
  session_id: string;
  message: string;
}

export interface SendMessageResponse {
  conversation_id: string;
  messages: ChatMessage[];
  state: ConversationState;
  requires_user_action: boolean;
}

export interface SuggestionChip {
  id: string;
  label: string;
  prompt: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type ColumnKey =
  | 'star'
  | 'username'
  | 'repositories'
  | 'actions'
  | 'location'
  | 'description'
  | 'followers'
  | 'score';

export interface TableColumn {
  key: ColumnKey;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}
