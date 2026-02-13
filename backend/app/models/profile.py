"""Profile models for user profile and statistics."""

from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class RecentSearchPreview(BaseModel):
    """Preview of a recent search for profile page."""
    search_id: str
    job_description: str
    total_found: int
    created_at: datetime


class ProfileStats(BaseModel):
    """User profile statistics."""
    total_searches: int
    total_candidates_found: int
    total_starred: int
    total_conversations: int
    recent_searches: List[RecentSearchPreview]


class UserProfileResponse(BaseModel):
    """Complete user profile response."""
    user_info: dict  # uid, email, displayName, photoURL, creationTime, lastSignInTime
    stats: ProfileStats
