"""Job search management API routes.

This module provides endpoints for managing job search sessions including:
- Listing past searches
- Retrieving full search details
- Updating candidates and filters
- Managing starred candidates
- Deleting searches
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel

from app.services.job_search.job_search_service import get_job_search_service
from app.services.firebase.auth import CurrentUser
from app.models.job_search import JobSearchSummary
from app.services.cache.search_cache import get_search_cache, CachedSearch
import time

logger = logging.getLogger("gitscout.job_search")

router = APIRouter(prefix="/job-searches", tags=["job_searches"])


# Request/Response Models

class UpdateCandidatesRequest(BaseModel):
    """Request to update candidates and filters."""
    candidates: List[Dict[str, Any]]
    filters: Dict[str, Any] | None = None


class JobSearchResponse(BaseModel):
    """Full job search details response."""
    search_id: str
    job_description: str
    query: str
    total_found: int
    candidates: List[Dict[str, Any]]
    starred_candidate_ids: List[str]
    current_filters: Dict[str, Any] | None
    jd_spec: Dict[str, Any] | None
    created_at: str
    updated_at: str


class JobSearchSummaryResponse(BaseModel):
    """Job search summary for list view."""
    search_id: str
    job_description: str
    total_found: int
    starred_count: int
    conversation_count: int
    created_at: str
    updated_at: str


# Routes

@router.get("", response_model=List[JobSearchSummaryResponse])
async def list_job_searches(
    limit: int = Query(50, ge=1, le=100, description="Maximum searches to return"),
    current_user: CurrentUser = None,
):
    """List all job searches for the current user.

    Returns searches ordered by creation date (most recent first).

    Args:
        limit: Maximum number of searches to return (1-100)
        current_user: Authenticated user

    Returns:
        List of job search summaries with metadata

    Raises:
        HTTPException: If service error occurs
    """
    logger.info(
        f"GET /job-searches - user: {current_user.uid}, limit: {limit}"
    )

    try:
        service = get_job_search_service()
        searches = await service.list_job_searches(current_user.uid, limit)

        # Convert to response format
        response = [
            JobSearchSummaryResponse(
                search_id=s.search_id,
                job_description=s.job_description,
                total_found=s.total_found,
                starred_count=s.starred_count,
                conversation_count=s.conversation_count,
                created_at=s.created_at.isoformat(),
                updated_at=s.updated_at.isoformat(),
            )
            for s in searches
        ]

        logger.info(f"Returning {len(response)} job searches")
        return response

    except Exception as e:
        logger.error(f"GET /job-searches error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list job searches: {str(e)}"
        )


@router.get("/{search_id}", response_model=JobSearchResponse)
async def get_job_search(
    search_id: str,
    current_user: CurrentUser = None,
):
    """Get full job search details including all candidates.

    Args:
        search_id: Job search ID
        current_user: Authenticated user

    Returns:
        Complete job search data

    Raises:
        HTTPException: If search not found or unauthorized
    """
    logger.info(
        f"GET /job-searches/{search_id} - user: {current_user.uid}"
    )

    try:
        service = get_job_search_service()
        job_search = await service.get_job_search(search_id, current_user.uid)

        if not job_search:
            raise HTTPException(
                status_code=404,
                detail=f"Job search {search_id} not found"
            )

        # Repopulate cache for historical searches to enable pagination/chat/filters
        cache = get_search_cache()
        if not cache.get_session_data(search_id):
            logger.info(f"Repopulating cache for historical search {search_id}")
            now = time.time()
            cache._cache[search_id] = CachedSearch(
                session_id=search_id,
                candidates=job_search.candidates,
                query=job_search.query,
                total_found=job_search.total_found,
                created_at=now,
                last_accessed=now,
                jd_spec=job_search.jd_spec,
                jd_text=job_search.job_description
            )

        response = JobSearchResponse(
            search_id=job_search.search_id,
            job_description=job_search.job_description,
            query=job_search.query,
            total_found=job_search.total_found,
            candidates=job_search.candidates,
            starred_candidate_ids=job_search.starred_candidate_ids,
            current_filters=job_search.current_filters,
            jd_spec=job_search.jd_spec,
            created_at=job_search.created_at.isoformat(),
            updated_at=job_search.updated_at.isoformat(),
        )

        logger.info(f"Returning job search {search_id}")
        return response

    except PermissionError as e:
        logger.warning(f"Unauthorized access to search {search_id}: {e}")
        raise HTTPException(status_code=403, detail=str(e))

    except Exception as e:
        logger.error(f"GET /job-searches/{search_id} error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get job search: {str(e)}"
        )


@router.patch("/{search_id}/candidates")
async def update_job_search_candidates(
    search_id: str,
    request: UpdateCandidatesRequest = Body(...),
    current_user: CurrentUser = None,
):
    """Update candidates and filters after refinement.

    Called when:
    - User applies filters
    - Chat refines candidate list
    - User makes changes to visible candidates

    Args:
        search_id: Job search ID
        request: Updated candidates and filters
        current_user: Authenticated user

    Returns:
        Success message

    Raises:
        HTTPException: If search not found or unauthorized
    """
    logger.info(
        f"PATCH /job-searches/{search_id}/candidates - "
        f"user: {current_user.uid}, {len(request.candidates)} candidates"
    )

    try:
        service = get_job_search_service()
        await service.update_job_search_candidates(
            search_id,
            current_user.uid,
            request.candidates,
            request.filters,
        )

        logger.info(f"Updated candidates for job search {search_id}")
        return {"success": True, "message": "Candidates updated successfully"}

    except ValueError as e:
        logger.warning(f"Job search {search_id} not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))

    except PermissionError as e:
        logger.warning(f"Unauthorized update to search {search_id}: {e}")
        raise HTTPException(status_code=403, detail=str(e))

    except Exception as e:
        logger.error(
            f"PATCH /job-searches/{search_id}/candidates error: {e}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update candidates: {str(e)}"
        )


@router.post("/{search_id}/star/{candidate_id}")
async def toggle_starred_candidate(
    search_id: str,
    candidate_id: str,
    current_user: CurrentUser = None,
):
    """Toggle starred status for a candidate.

    Args:
        search_id: Job search ID
        candidate_id: Candidate login/ID to toggle
        current_user: Authenticated user

    Returns:
        New starred status

    Raises:
        HTTPException: If search not found or unauthorized
    """
    logger.info(
        f"POST /job-searches/{search_id}/star/{candidate_id} - "
        f"user: {current_user.uid}"
    )

    try:
        service = get_job_search_service()
        is_starred = await service.toggle_starred_candidate(
            search_id,
            current_user.uid,
            candidate_id,
        )

        logger.info(
            f"Toggled star for {candidate_id}: "
            f"{'starred' if is_starred else 'unstarred'}"
        )

        return {
            "success": True,
            "candidate_id": candidate_id,
            "is_starred": is_starred,
        }

    except ValueError as e:
        logger.warning(f"Job search {search_id} not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))

    except PermissionError as e:
        logger.warning(f"Unauthorized star toggle for search {search_id}: {e}")
        raise HTTPException(status_code=403, detail=str(e))

    except Exception as e:
        logger.error(
            f"POST /job-searches/{search_id}/star/{candidate_id} error: {e}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to toggle starred status: {str(e)}"
        )


@router.delete("/{search_id}")
async def delete_job_search(
    search_id: str,
    current_user: CurrentUser = None,
):
    """Delete job search and all its conversations.

    This performs a cascading delete of:
    - All messages in all conversations
    - All conversations
    - The job search document

    Args:
        search_id: Job search ID
        current_user: Authenticated user

    Returns:
        Success message

    Raises:
        HTTPException: If search not found or unauthorized
    """
    logger.info(
        f"DELETE /job-searches/{search_id} - user: {current_user.uid}"
    )

    try:
        service = get_job_search_service()
        await service.delete_job_search(search_id, current_user.uid)

        logger.info(f"Deleted job search {search_id}")
        return {"success": True, "message": "Job search deleted successfully"}

    except ValueError as e:
        logger.warning(f"Job search {search_id} not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))

    except PermissionError as e:
        logger.warning(f"Unauthorized delete of search {search_id}: {e}")
        raise HTTPException(status_code=403, detail=str(e))

    except Exception as e:
        logger.error(f"DELETE /job-searches/{search_id} error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete job search: {str(e)}"
        )
