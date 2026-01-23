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
