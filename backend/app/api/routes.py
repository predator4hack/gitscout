import logging
from fastapi import APIRouter, HTTPException, Query
from ..models.requests import SearchRequest
from ..models.responses import SearchResponse, PaginatedSearchResponse
from ..services.github.client import GitHubClient
from ..services.matching.query_generator import generate_query, generate_jd_spec, generate_repo_queries
from ..services.matching.repo_pipeline import run_repo_contributors_pipeline
from ..services.matching.ranker import rank_candidates
from ..services.cache.search_cache import get_search_cache

logger = logging.getLogger("gitscout.api")

router = APIRouter()

DEFAULT_PAGE_SIZE = 10


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


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
            max_repos=10,
            contributors_per_repo=10
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
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=50, description="Results per page")
):
    """
    Get a page of cached search results.

    Use the session_id from the initial search response to fetch subsequent pages.
    """
    logger.info(f"GET /search/page - session: {session_id[:8]}..., page: {page}, page_size: {page_size}")

    cache = get_search_cache()
    page_data = cache.get_page(session_id, page=page, page_size=page_size)

    if page_data is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found or expired. Please perform a new search."
        )

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
