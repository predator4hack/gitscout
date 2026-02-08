import { useState, useCallback, useEffect, useRef } from "react";
import { fetchCandidateSkills } from "../api/candidate";
import type { CandidateSkillsAnalysis } from "../types/candidate";

interface UseCandidateSkillsOptions {
    login: string | null;
    sessionId: string;
    enabled?: boolean;
}

interface UseCandidateSkillsReturn {
    skills: CandidateSkillsAnalysis | null;
    isLoading: boolean;
    error: string | null;
    refetch: (forceRefresh?: boolean) => Promise<void>;
}

// Simple client-side cache using Map
const skillsCache = new Map<string, CandidateSkillsAnalysis>();

/**
 * Hook for fetching and caching candidate skills analysis.
 *
 * Features:
 * - Automatic fetching when login changes
 * - Client-side caching to avoid repeated API calls
 * - Loading and error states
 * - Manual refetch capability
 */
export function useCandidateSkills(
    options: UseCandidateSkillsOptions
): UseCandidateSkillsReturn {
    const { login, sessionId, enabled = true } = options;

    const [skills, setSkills] = useState<CandidateSkillsAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track the current login being fetched to handle race conditions
    const currentFetchLogin = useRef<string | null>(null);

    const fetchSkills = useCallback(
        async (forceRefresh: boolean = false) => {
            if (!login || !sessionId) {
                setSkills(null);
                return;
            }

            // Check client-side cache first (unless force refresh)
            const cacheKey = `${sessionId}:${login}`;
            if (!forceRefresh && skillsCache.has(cacheKey)) {
                setSkills(skillsCache.get(cacheKey)!);
                return;
            }

            // Track which login we're fetching
            currentFetchLogin.current = login;

            setIsLoading(true);
            setError(null);

            try {
                const result = await fetchCandidateSkills(
                    login,
                    sessionId,
                    forceRefresh
                );

                // Only update state if we're still looking at the same candidate
                if (currentFetchLogin.current === login) {
                    setSkills(result);
                    // Update client-side cache
                    skillsCache.set(cacheKey, result);
                }
            } catch (err) {
                // Only update error state if we're still looking at the same candidate
                if (currentFetchLogin.current === login) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : "Failed to load skills analysis";
                    setError(message);
                    setSkills(null);
                }
            } finally {
                // Only update loading state if we're still looking at the same candidate
                if (currentFetchLogin.current === login) {
                    setIsLoading(false);
                }
            }
        },
        [login, sessionId]
    );

    // Fetch skills when login changes
    useEffect(() => {
        if (enabled && login) {
            fetchSkills();
        } else {
            setSkills(null);
            setError(null);
        }
    }, [login, enabled, fetchSkills]);

    const refetch = useCallback(
        async (forceRefresh: boolean = false) => {
            await fetchSkills(forceRefresh);
        },
        [fetchSkills]
    );

    return {
        skills,
        isLoading,
        error,
        refetch,
    };
}
