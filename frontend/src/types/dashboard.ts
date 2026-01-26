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
  hasEmail: boolean;
  linkedInUrl: string | null;
}

export interface StepIndicator {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'step';
  content: string;
  timestamp: Date;
  steps?: StepIndicator[];
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
