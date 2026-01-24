from pydantic import BaseModel
from typing import List, Optional


class Repository(BaseModel):
    nameWithOwner: str
    url: str
    description: Optional[str]
    stars: int
    languages: List[str]
    topics: List[str]


class Candidate(BaseModel):
    login: str
    name: Optional[str]
    url: str
    avatarUrl: str
    score: float
    topRepos: List[Repository]
    matchReason: str
    location: Optional[str] = None
    followers: int = 0
    email: Optional[str] = None
    twitterUsername: Optional[str] = None
    websiteUrl: Optional[str] = None
    lastContributionDate: Optional[str] = None


class SearchResponse(BaseModel):
    candidates: List[Candidate]
    totalFound: int
    query: str


class PaginatedSearchResponse(BaseModel):
    """Response for paginated search results"""
    candidates: List[Candidate]
    totalFound: int
    totalCached: int
    query: str
    sessionId: str
    page: int
    pageSize: int
    hasMore: bool
