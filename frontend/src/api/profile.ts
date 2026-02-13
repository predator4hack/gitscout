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
 * Recent search preview for profile page
 */
export interface RecentSearchPreview {
    search_id: string;
    job_description: string;
    total_found: number;
    created_at: Date;
}

/**
 * Aggregated profile statistics
 */
export interface ProfileStats {
    total_searches: number;
    total_candidates_found: number;
    total_starred: number;
    total_conversations: number;
    recent_searches: RecentSearchPreview[];
}

/**
 * User information from Firebase Auth
 */
export interface UserInfo {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    creationTime: number;
    lastSignInTime: number;
}

/**
 * Complete user profile with stats
 */
export interface UserProfile {
    user_info: UserInfo;
    stats: ProfileStats;
}

/**
 * Get user profile with aggregated statistics
 */
export async function getProfileStats(): Promise<UserProfile> {
    const token = await getAuthToken();
    if (!token) {
        throw new Error("User not authenticated");
    }

    const response = await fetch(
        `${config.apiBaseUrl}/api/profile/stats`,
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

    // Convert timestamp strings to Date objects for recent searches
    return {
        ...data,
        stats: {
            ...data.stats,
            recent_searches: data.stats.recent_searches.map((s: any) => ({
                ...s,
                created_at: new Date(s.created_at),
            })),
        },
    };
}
