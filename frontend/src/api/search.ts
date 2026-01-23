import { SearchRequest, SearchResponse } from "../types";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function searchCandidates(
    request: SearchRequest
): Promise<SearchResponse> {
    const response = await fetch(`${API_BASE_URL}/api/search/repos`, {
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
    pageSize: number = 10
): Promise<SearchResponse> {
    const params = new URLSearchParams({
        session_id: sessionId,
        page: page.toString(),
        page_size: pageSize.toString(),
    });

    const response = await fetch(
        `${API_BASE_URL}/api/search/page?${params}`,
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
