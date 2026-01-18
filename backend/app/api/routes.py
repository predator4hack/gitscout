import logging
from fastapi import APIRouter, HTTPException
from ..models.requests import SearchRequest
from ..models.responses import SearchResponse
from ..services.github.client import GitHubClient
from ..services.matching.query_generator import generate_query, generate_jd_spec, generate_repo_queries
from ..services.matching.repo_pipeline import run_repo_contributors_pipeline
from ..services.matching.ranker import rank_candidates

logger = logging.getLogger("gitscout.api")

router = APIRouter()


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


@router.post("/search/repos", response_model=SearchResponse)
async def search_via_repos(request: SearchRequest):
    """
    Search for GitHub candidates via repository contributors

    Pipeline:
    1. Extract structured JD spec using LLM
    2. Generate repo search queries from spec
    3. Search repos, fetch contributors, hydrate users
    4. Rank and return candidates
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
            max_repos=100,
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

        # 6. Return response
        logger.info(f"POST /search/repos complete - returning {len(candidates)} candidates")
        return SearchResponse(
            candidates=candidates,
            totalFound=len(candidates),
            query="; ".join(queries[:3])  # Show first 3 queries used
        )

    except ValueError as e:
        logger.warning(f"POST /search/repos validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"POST /search/repos internal error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
