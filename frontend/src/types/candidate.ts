// Types for candidate skills analysis

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface DomainSkill {
  name: string;
  level: SkillLevel;
  evidence: string;
  repositories: string[];
}

export interface TechnicalSkill {
  name: string;
  level: SkillLevel;
  years_active: number | null;
  evidence: string | null;
  repositories: string[];
}

export interface BehavioralPattern {
  name: string;
  description: string;
  evidence: string;
}

export interface CandidateSkillsAnalysis {
  login: string;
  generated_at: string;
  profile_summary: string;
  domain_expertise: DomainSkill[];
  technical_expertise: TechnicalSkill[];
  behavioral_patterns: BehavioralPattern[];
  cached: boolean;
}

export interface SkillsAnalysisRequest {
  login: string;
  session_id: string;
  force_refresh?: boolean;
}

// Context type for passing candidate info to AI chat
export interface CandidateContext {
  login: string;
  name: string | null;
  skills?: CandidateSkillsAnalysis;
}
