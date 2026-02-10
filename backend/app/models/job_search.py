"""Job search data models."""

from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Dict, Any


@dataclass
class JobSearch:
    """Represents a complete job search session.

    This stores the full state of a job search including all candidates,
    starred candidates, applied filters, and the original job description.
    """
    search_id: str
    user_id: str
    job_description: str
    query: str  # Generated GitHub query
    total_found: int
    candidates: List[Dict[str, Any]]  # Full candidate data
    starred_candidate_ids: List[str]
    current_filters: Optional[Dict[str, Any]]
    jd_spec: Optional[Dict[str, Any]]  # Parsed JD specification
    created_at: datetime
    updated_at: datetime


@dataclass
class JobSearchSummary:
    """Summary for listing job searches.

    Used for displaying job search history with key metrics
    without loading full candidate data.
    """
    search_id: str
    job_description: str
    total_found: int
    starred_count: int
    conversation_count: int
    created_at: datetime
    updated_at: datetime
