import { Candidate, CandidateFilters } from "../types/index";
import { config } from "../config";
import { auth } from "../lib/firebase";

/**
 * Get the current user's auth token for API requests
 */
async function getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
        return null;
    }
    return user.getIdToken();
}

/**
 * Full job search data with all candidates
 */
export interface JobSearch {
    search_id: string;
    user_id: string;
    job_description: string;
    query: string;
    total_found: number;
    candidates: Candidate[];
    starred_candidate_ids: string[];
    current_filters: CandidateFilters | null;
    jd_spec: Record<string, any> | null;
    created_at: Date;
    updated_at: Date;
}

/**
 * Lightweight summary for history list
 */
export interface JobSearchSummary {
    search_id: string;
    job_description: string;
    total_found: number;
    starred_count: number;
    conversation_count: number;
    created_at: Date;
    updated_at: Date;
}

/**
 * Request body for updating candidates
 */
export interface UpdateCandidatesRequest {
    candidates: Candidate[];
    filters: CandidateFilters | null;
}

/**
 * List all job searches for the current user
 */
export async function listJobSearches(
    limit: number = 50
): Promise<JobSearchSummary[]> {
    const token = await getAuthToken();
    if (!token) {
        throw new Error("User not authenticated");
    }

    const response = await fetch(
        `${config.apiBaseUrl}/api/job-searches?limit=${limit}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
            error.detail || `HTTP error! status: ${response.status}`
        );
    }

    const data = await response.json();

    // Convert timestamp strings to Date objects
    return data.map((search: any) => ({
        ...search,
        created_at: new Date(search.created_at),
        updated_at: new Date(search.updated_at),
    }));
}

/**
 * Get full job search details by ID
 */
export async function getJobSearch(searchId: string): Promise<JobSearch> {
    const token = await getAuthToken();
    if (!token) {
        throw new Error("User not authenticated");
    }

    const response = await fetch(
        `${config.apiBaseUrl}/api/job-searches/${searchId}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
            error.detail || `HTTP error! status: ${response.status}`
        );
    }

    const data = await response.json();

    // Convert timestamp strings to Date objects
    return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
    };
}

/**
 * Update candidates and filters for a job search
 */
export async function updateJobSearchCandidates(
    searchId: string,
    candidates: Candidate[],
    filters: CandidateFilters | null
): Promise<void> {
    const token = await getAuthToken();
    if (!token) {
        throw new Error("User not authenticated");
    }

    const response = await fetch(
        `${config.apiBaseUrl}/api/job-searches/${searchId}/candidates`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                candidates,
                filters,
            }),
        }
    );

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
            error.detail || `HTTP error! status: ${response.status}`
        );
    }
}

/**
 * Toggle starred status for a candidate
 */
export async function toggleStarredCandidate(
    searchId: string,
    candidateId: string
): Promise<{ starred: boolean }> {
    const token = await getAuthToken();
    if (!token) {
        throw new Error("User not authenticated");
    }

    const response = await fetch(
        `${config.apiBaseUrl}/api/job-searches/${searchId}/star/${candidateId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
    );

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

/**
 * Delete a job search and all nested conversations
 */
export async function deleteJobSearch(searchId: string): Promise<void> {
    const token = await getAuthToken();
    if (!token) {
        throw new Error("User not authenticated");
    }

    const response = await fetch(
        `${config.apiBaseUrl}/api/job-searches/${searchId}`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
            error.detail || `HTTP error! status: ${response.status}`
        );
    }
}
