import logging
import json
from typing import Optional, AsyncGenerator, Callable, Awaitable
from fastapi import APIRouter, HTTPException, Query
from starlette.responses import StreamingResponse
from ..config import config
from ..models.requests import SearchRequest, CandidateFilters
from ..models.responses import SearchResponse, PaginatedSearchResponse
from ..services.github.client import GitHubClient
from ..services.matching.query_generator import generate_query, generate_jd_spec, generate_repo_queries
from ..services.matching.repo_pipeline import run_repo_contributors_pipeline
from ..services.matching.ranker import rank_candidates
from ..services.cache.search_cache import get_search_cache
from ..services.filtering.candidate_filter import filter_candidates
from ..services.firebase import is_firebase_initialized

# Type alias for progress callback
ProgressCallback = Callable[[str, int, str], Awaitable[None]]

logger = logging.getLogger("gitscout.api")

router = APIRouter()

DEFAULT_PAGE_SIZE = 10


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "firebase": "connected" if is_firebase_initialized() else "not configured"
    }


@router.post("/search", response_model=SearchResponse)
async def search_candidates(request: SearchRequest):
    """
    Search for GitHub candidates based on job description

    Args:
        request: Search request with JD text and LLM provider

    Returns:
        SearchResponse with ranked candidates
    """
    logger.info(f"POST /search - provider: {request.provider.value}, model: {request.model}")
    logger.debug(f"JD text: {request.jd_text[:200]}..." if len(request.jd_text) > 200 else f"JD text: {request.jd_text}")

    try:
        # 1. Generate GitHub search query from JD using LLM
        query = await generate_query(
            jd_text=request.jd_text,
            provider=request.provider.value,
            model=request.model
        )

        # 2. Search GitHub users
        github_client = GitHubClient()
        search_results = await github_client.search_users(query=query, limit=10)

        # 3. Parse user data
        users = []
        if search_results.get("nodes"):
            for node in search_results["nodes"]:
                if node:  # Skip null nodes
                    user_data = github_client.parse_user_data(node)
                    users.append(user_data)

        # 4. Rank and score candidates
        candidates = rank_candidates(users, request.jd_text)

        # 5. Return response
        logger.info(f"POST /search complete - returning {len(candidates)} candidates")
        return SearchResponse(
            candidates=candidates,
            totalFound=search_results.get("userCount", 0),
            query=query
        )

    except ValueError as e:
        logger.warning(f"POST /search validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"POST /search internal error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/search/repos", response_model=PaginatedSearchResponse)
async def search_via_repos(request: SearchRequest):
    """
    Search for GitHub candidates via repository contributors.

    Returns first page of results with session ID for pagination.
    Use GET /search/page with the session ID to fetch subsequent pages.
    """
    logger.info(f"POST /search/repos - provider: {request.provider.value}, model: {request.model}")
    logger.debug(f"JD text: {request.jd_text[:200]}..." if len(request.jd_text) > 200 else f"JD text: {request.jd_text}")

    try:
        # 1. Extract JD spec
        spec = await generate_jd_spec(
            jd_text=request.jd_text,
            provider=request.provider.value,
            model=request.model
        )

        # 2. Generate repo queries
        queries = generate_repo_queries(spec)
        logger.info(f"Generated {len(queries)} repo search queries")
        logger.debug(f"Queries: {queries[:3]}")

        if not queries:
            raise ValueError("Could not generate search queries from job description")

        # 3. Run pipeline
        github_client = GitHubClient()
        enriched_users, contrib_scores = await run_repo_contributors_pipeline(
            spec=spec,
            queries=queries,
            github_client=github_client,
            max_repos=config.MAX_REPOS,
            contributors_per_repo=config.CONTRIBUTORS_PER_REPO
        )

        # 4. Parse user data and incorporate contribution scores
        users = []
        for user_node in enriched_users:
            if user_node:
                user_data = github_client.parse_user_data(user_node)
                # Add contribution score seed from repo pipeline
                login = user_data.get("login", "")
                user_data["contrib_score_seed"] = contrib_scores.get(login, 0)
                users.append(user_data)

        # 5. Rank candidates (enhanced with contrib_score_seed)
        candidates = rank_candidates(users, request.jd_text)

        # 6. Cache all results and create session
        cache = get_search_cache()
        query_str = "; ".join(queries[:3])
        session_id = cache.create_session(
            candidates=candidates,
            query=query_str,
            total_found=len(candidates)
        )

        # 7. Get first page
        page_data = cache.get_page(session_id, page=0, page_size=DEFAULT_PAGE_SIZE)

        if page_data is None:
            raise HTTPException(status_code=500, detail="Failed to cache search results")

        logger.info(f"POST /search/repos complete - session {session_id[:8]}... with {len(candidates)} total candidates")

        return PaginatedSearchResponse(
            candidates=page_data["candidates"],
            totalFound=page_data["totalFound"],
            totalCached=page_data["totalCached"],
            query=page_data["query"],
            sessionId=page_data["sessionId"],
            page=page_data["page"],
            pageSize=page_data["pageSize"],
            hasMore=page_data["hasMore"]
        )

    except ValueError as e:
        logger.warning(f"POST /search/repos validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"POST /search/repos internal error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/search/page", response_model=PaginatedSearchResponse)
async def get_search_page(
    session_id: str = Query(..., description="Session ID from initial search"),
    page: int = Query(0, ge=0, description="Page number (0-indexed)"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=50, description="Results per page"),
    # Filter parameters
    location: Optional[str] = Query(None, description="Filter by location (substring match)"),
    followers_min: Optional[int] = Query(None, ge=0, description="Minimum followers"),
    followers_max: Optional[int] = Query(None, ge=0, description="Maximum followers"),
    has_email: Optional[bool] = Query(None, description="Must have public email"),
    has_any_contact: Optional[bool] = Query(None, description="Must have email, twitter, or website"),
    last_contribution: Optional[str] = Query(None, pattern="^(30d|3m|6m|1y)$", description="Last activity within period")
):
    """
    Get a page of cached search results with optional filters.

    Filters are applied at retrieval time to the cached results.
    Use the session_id from the initial search response to fetch subsequent pages.
    """
    logger.info(f"GET /search/page - session: {session_id[:8]}..., page: {page}, page_size: {page_size}")

    cache = get_search_cache()

    # Get all cached candidates for filtering
    session_data = cache.get_session_data(session_id)

    if session_data is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found or expired. Please perform a new search."
        )

    # Build filters object if any filter param present
    filters = None
    if any([location, followers_min is not None, followers_max is not None, has_email, has_any_contact, last_contribution]):
        filters = CandidateFilters(
            location=location,
            followers_min=followers_min,
            followers_max=followers_max,
            has_email=has_email,
            has_any_contact=has_any_contact,
            last_contribution=last_contribution
        )

    # Apply filters
    all_candidates = session_data["candidates"]
    filtered_candidates = filter_candidates(all_candidates, filters)

    # Paginate filtered results
    start_idx = page * page_size
    end_idx = start_idx + page_size
    page_candidates = filtered_candidates[start_idx:end_idx]
    has_more = end_idx < len(filtered_candidates)

    logger.debug(
        f"Session {session_id[:8]}... page {page}: "
        f"filtered {len(filtered_candidates)}/{len(all_candidates)}, returning {len(page_candidates)}"
    )

    return PaginatedSearchResponse(
        candidates=page_candidates,
        totalFound=session_data["total_found"],
        totalCached=len(filtered_candidates),
        query=session_data["query"],
        sessionId=session_id,
        page=page,
        pageSize=page_size,
        hasMore=has_more
    )


@router.post("/search/repos/stream")
async def search_via_repos_stream(request: SearchRequest):
    """
    SSE streaming endpoint for search with real-time progress updates.

    Streams progress events during the search pipeline:
    - step: {event: "step", step: string, progress: number, message: string}
    - complete: {event: "complete", sessionId: string, totalFound: number}
    - error: {event: "error", message: string}
    """
    logger.info(f"POST /search/repos/stream - provider: {request.provider.value}, model: {request.model}")

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # Step 1: Analyzing job description (0-15%)
            yield f"data: {json.dumps({'event': 'step', 'step': 'analyze', 'progress': 5, 'message': 'Analyzing job description...'})}\n\n"

            spec = await generate_jd_spec(
                jd_text=request.jd_text,
                provider=request.provider.value,
                model=request.model
            )
            yield f"data: {json.dumps({'event': 'step', 'step': 'analyze', 'progress': 15, 'message': 'Job requirements extracted'})}\n\n"

            # Step 2: Generating search queries (15-25%)
            yield f"data: {json.dumps({'event': 'step', 'step': 'search', 'progress': 20, 'message': 'Generating search queries...'})}\n\n"

            queries = generate_repo_queries(spec)
            if not queries:
                yield f"data: {json.dumps({'event': 'error', 'message': 'Could not generate search queries from job description'})}\n\n"
                return

            yield f"data: {json.dumps({'event': 'step', 'step': 'search', 'progress': 25, 'message': f'Generated {len(queries)} search queries'})}\n\n"

            # Step 3: Searching repositories (25-50%)
            yield f"data: {json.dumps({'event': 'step', 'step': 'search', 'progress': 30, 'message': 'Searching GitHub repositories...'})}\n\n"

            github_client = GitHubClient()

            # Run the pipeline with progress updates
            yield f"data: {json.dumps({'event': 'step', 'step': 'search', 'progress': 40, 'message': 'Discovering relevant repositories...'})}\n\n"

            enriched_users, contrib_scores = await run_repo_contributors_pipeline(
                spec=spec,
                queries=queries,
                github_client=github_client,
                max_repos=10,
                contributors_per_repo=10
            )

            yield f"data: {json.dumps({'event': 'step', 'step': 'search', 'progress': 50, 'message': f'Found {len(enriched_users)} potential candidates'})}\n\n"

            # Step 4: Ranking candidates (50-85%)
            yield f"data: {json.dumps({'event': 'step', 'step': 'rank', 'progress': 60, 'message': 'Analyzing candidate profiles...'})}\n\n"

            users = []
            for user_node in enriched_users:
                if user_node:
                    user_data = github_client.parse_user_data(user_node)
                    login = user_data.get("login", "")
                    user_data["contrib_score_seed"] = contrib_scores.get(login, 0)
                    users.append(user_data)

            yield f"data: {json.dumps({'event': 'step', 'step': 'rank', 'progress': 75, 'message': 'Calculating match scores...'})}\n\n"

            candidates = rank_candidates(users, request.jd_text)

            yield f"data: {json.dumps({'event': 'step', 'step': 'rank', 'progress': 85, 'message': f'Ranked {len(candidates)} candidates'})}\n\n"

            # Step 5: Preparing results (85-100%)
            yield f"data: {json.dumps({'event': 'step', 'step': 'prepare', 'progress': 90, 'message': 'Preparing results...'})}\n\n"

            cache = get_search_cache()
            query_str = "; ".join(queries[:3])
            session_id = cache.create_session(
                candidates=candidates,
                query=query_str,
                total_found=len(candidates)
            )

            yield f"data: {json.dumps({'event': 'step', 'step': 'prepare', 'progress': 95, 'message': 'Results cached'})}\n\n"

            # Complete
            yield f"data: {json.dumps({'event': 'complete', 'sessionId': session_id, 'totalFound': len(candidates)})}\n\n"

            logger.info(f"POST /search/repos/stream complete - session {session_id[:8]}... with {len(candidates)} candidates")

        except Exception as e:
            logger.error(f"POST /search/repos/stream error: {e}", exc_info=True)
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
