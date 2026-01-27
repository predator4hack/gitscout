import { SearchRequest, SearchResponse, CandidateFilters } from "../types";
import { config } from "../config";

export async function searchCandidates(
    request: SearchRequest
): Promise<SearchResponse> {
    const response = await fetch(`${config.apiBaseUrl}/api/search/repos`, {
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

export async function fetchSearchPage(
    sessionId: string,
    page: number,
    pageSize: number = 10,
    filters?: CandidateFilters
): Promise<SearchResponse> {
    const params = new URLSearchParams({
        session_id: sessionId,
        page: page.toString(),
        page_size: pageSize.toString(),
    });

    // Add filter parameters if present
    if (filters) {
        if (filters.location) params.set("location", filters.location);
        if (filters.followersMin !== undefined)
            params.set("followers_min", filters.followersMin.toString());
        if (filters.followersMax !== undefined)
            params.set("followers_max", filters.followersMax.toString());
        if (filters.hasEmail) params.set("has_email", "true");
        if (filters.hasAnyContact) params.set("has_any_contact", "true");
        if (filters.lastContribution)
            params.set("last_contribution", filters.lastContribution);
    }

    const response = await fetch(
        `${config.apiBaseUrl}/api/search/page?${params}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
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
