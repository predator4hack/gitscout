from fastapi import APIRouter, HTTPException
from ..models.requests import SearchRequest
from ..models.responses import SearchResponse
from ..services.github.client import GitHubClient
from ..services.matching.query_generator import generate_query
from ..services.matching.ranker import rank_candidates

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
        return SearchResponse(
            candidates=candidates,
            totalFound=search_results.get("userCount", 0),
            query=query
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
