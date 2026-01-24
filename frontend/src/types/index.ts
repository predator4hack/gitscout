export type Provider = "gemini" | "groq" | "ollama" | "mock";

export interface SearchRequest {
  jd_text: string;
  provider: Provider;
  model?: string;
}

export interface Repository {
  nameWithOwner: string;
  url: string;
  description: string | null;
  stars: number;
  languages: string[];
  topics: string[];
}

export interface Candidate {
  login: string;
  name: string | null;
  url: string;
  avatarUrl: string;
  score: number;
  topRepos: Repository[];
  matchReason: string;
  location: string | null;
  followers: number;
  email: string | null;
  twitterUsername: string | null;
  websiteUrl: string | null;
  lastContributionDate: string | null;
}

export interface SearchResponse {
  candidates: Candidate[];
  totalFound: number;
  totalCached: number;
  query: string;
  sessionId: string;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type LastContributionPeriod = "30d" | "3m" | "6m" | "1y";

export interface CandidateFilters {
  location?: string;
  followersMin?: number;
  followersMax?: number;
  hasEmail?: boolean;
  hasAnyContact?: boolean;
  lastContribution?: LastContributionPeriod;
}
