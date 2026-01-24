from typing import List, Optional
from datetime import datetime, timedelta
from ...models.responses import Candidate
from ...models.requests import CandidateFilters


def _parse_contribution_threshold(period: str) -> datetime:
    """Convert period string to datetime threshold"""
    now = datetime.now()
    mapping = {
        "30d": timedelta(days=30),
        "3m": timedelta(days=90),
        "6m": timedelta(days=180),
        "1y": timedelta(days=365),
    }
    return now - mapping.get(period, timedelta(days=365))


def _candidate_has_contact(candidate: Candidate) -> bool:
    """Check if candidate has any contact information"""
    return bool(
        candidate.email or
        candidate.twitterUsername or
        candidate.websiteUrl
    )


def _location_matches(candidate_location: Optional[str], filter_location: str) -> bool:
    """Case-insensitive substring match for location"""
    if not candidate_location:
        return False
    return filter_location.lower() in candidate_location.lower()


def filter_candidates(
    candidates: List[Candidate],
    filters: Optional[CandidateFilters]
) -> List[Candidate]:
    """
    Apply filters to a list of candidates.

    Args:
        candidates: List of Candidate objects
        filters: Filter criteria (None means no filtering)

    Returns:
        Filtered list of candidates
    """
    if filters is None:
        return candidates

    result = candidates

    # Location filter (case-insensitive substring match)
    if filters.location:
        result = [c for c in result if _location_matches(c.location, filters.location)]

    # Followers min filter
    if filters.followers_min is not None:
        result = [c for c in result if c.followers >= filters.followers_min]

    # Followers max filter
    if filters.followers_max is not None:
        result = [c for c in result if c.followers <= filters.followers_max]

    # Has email filter
    if filters.has_email is True:
        result = [c for c in result if c.email]

    # Has any contact filter
    if filters.has_any_contact is True:
        result = [c for c in result if _candidate_has_contact(c)]

    # Last contribution filter
    if filters.last_contribution:
        threshold = _parse_contribution_threshold(filters.last_contribution)
        filtered = []
        for c in result:
            if c.lastContributionDate:
                try:
                    contrib_date = datetime.fromisoformat(c.lastContributionDate)
                    if contrib_date >= threshold:
                        filtered.append(c)
                except ValueError:
                    pass  # Skip if date parsing fails
        result = filtered

    return result
