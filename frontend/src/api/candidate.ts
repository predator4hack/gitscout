import { config } from "../config";
import type { CandidateSkillsAnalysis, SkillsAnalysisRequest } from "../types/candidate";

/**
 * Fetch skills analysis for a candidate.
 *
 * Uses LLM to analyze the candidate's GitHub profile and generate
 * a structured skills assessment. Results are cached on the backend.
 */
export async function fetchCandidateSkills(
    login: string,
    sessionId: string,
    forceRefresh: boolean = false
): Promise<CandidateSkillsAnalysis> {
    const request: SkillsAnalysisRequest = {
        login,
        session_id: sessionId,
        force_refresh: forceRefresh,
    };

    const response = await fetch(`${config.apiBaseUrl}/api/candidate/skills`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
            error.detail || `HTTP error! status: ${response.status}`
        );
    }

    return response.json();
}
