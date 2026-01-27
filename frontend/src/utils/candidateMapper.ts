import type { Candidate } from '../types';
import type { DashboardCandidate, DashboardRepository } from '../types/dashboard';

/**
 * Maps an API Candidate to a DashboardCandidate
 */
export function mapCandidateToDashboard(candidate: Candidate): DashboardCandidate {
  // Extract LinkedIn from websiteUrl if present
  const linkedInUrl = candidate.websiteUrl?.toLowerCase().includes('linkedin.com')
    ? candidate.websiteUrl
    : null;

  // Map repositories
  const repositories: DashboardRepository[] = candidate.topRepos.map(repo => ({
    name: repo.nameWithOwner,
    url: repo.url,
  }));

  return {
    id: candidate.login,
    login: candidate.login,
    name: candidate.name,
    avatarUrl: candidate.avatarUrl,
    url: candidate.url,
    repositories,
    location: candidate.location,
    description: candidate.matchReason,
    followers: candidate.followers,
    score: Math.round(candidate.score),
    isStarred: false,
    email: candidate.email,
    linkedInUrl,
    twitterUsername: candidate.twitterUsername,
    websiteUrl: candidate.websiteUrl,
  };
}

/**
 * Maps an array of API Candidates to DashboardCandidates
 */
export function mapCandidatesToDashboard(candidates: Candidate[]): DashboardCandidate[] {
  return candidates.map(mapCandidateToDashboard);
}
