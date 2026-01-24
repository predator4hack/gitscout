import asyncio
import time
import uuid
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import logging

logger = logging.getLogger("gitscout.cache")


@dataclass
class CachedSearch:
    """Cached search results for a session"""
    session_id: str
    candidates: List[Any]
    query: str
    total_found: int
    created_at: float
    last_accessed: float


class SearchCache:
    """
    In-memory cache for search results with session management.

    Stores search results and serves paginated responses from cache.
    Sessions auto-expire after TTL to prevent memory buildup.
    """

    def __init__(
        self,
        ttl_seconds: int = 1800,  # 30 minutes
        cleanup_interval: int = 300  # 5 minutes
    ):
        self._cache: Dict[str, CachedSearch] = {}
        self._ttl = ttl_seconds
        self._cleanup_interval = cleanup_interval
        self._cleanup_task: Optional[asyncio.Task] = None

    def start_cleanup_task(self):
        """Start background cleanup task"""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
            logger.info("Started cache cleanup background task")

    async def _cleanup_loop(self):
        """Periodically clean up expired sessions"""
        while True:
            await asyncio.sleep(self._cleanup_interval)
            self._cleanup_expired()

    def _cleanup_expired(self):
        """Remove expired sessions from cache"""
        now = time.time()
        expired = [
            sid for sid, cached in self._cache.items()
            if now - cached.last_accessed > self._ttl
        ]
        for sid in expired:
            del self._cache[sid]
        if expired:
            logger.info(f"Cleaned up {len(expired)} expired session(s)")

    def create_session(
        self,
        candidates: List[Any],
        query: str,
        total_found: int
    ) -> str:
        """
        Create a new search session with cached results.

        Args:
            candidates: List of candidate objects to cache
            query: The search query used
            total_found: Total number of candidates found

        Returns:
            Session ID for retrieving pages
        """
        session_id = str(uuid.uuid4())
        now = time.time()

        self._cache[session_id] = CachedSearch(
            session_id=session_id,
            candidates=candidates,
            query=query,
            total_found=total_found,
            created_at=now,
            last_accessed=now
        )

        logger.info(f"Created session {session_id[:8]}... with {len(candidates)} candidates")
        return session_id

    def get_page(
        self,
        session_id: str,
        page: int,
        page_size: int = 10
    ) -> Optional[Dict[str, Any]]:
        """
        Get a page of results from cached session.

        Args:
            session_id: The session ID
            page: Page number (0-indexed)
            page_size: Number of results per page

        Returns:
            Dict with candidates, hasMore, pagination info, or None if session not found
        """
        cached = self._cache.get(session_id)
        if cached is None:
            logger.warning(f"Session not found: {session_id[:8]}...")
            return None

        # Update last accessed time
        cached.last_accessed = time.time()

        # Calculate pagination
        start_idx = page * page_size
        end_idx = start_idx + page_size
        page_candidates = cached.candidates[start_idx:end_idx]
        has_more = end_idx < len(cached.candidates)

        logger.debug(
            f"Session {session_id[:8]}... page {page}: "
            f"returning {len(page_candidates)} candidates, hasMore={has_more}"
        )

        return {
            "candidates": page_candidates,
            "query": cached.query,
            "totalFound": cached.total_found,
            "totalCached": len(cached.candidates),
            "page": page,
            "pageSize": page_size,
            "hasMore": has_more,
            "sessionId": session_id
        }

    def get_session_data(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get all session data without pagination.
        Used for applying filters before pagination.

        Args:
            session_id: The session ID

        Returns:
            Dict with all candidates and metadata, or None if not found
        """
        cached = self._cache.get(session_id)
        if cached is None:
            logger.warning(f"Session not found: {session_id[:8]}...")
            return None

        # Update last accessed time
        cached.last_accessed = time.time()

        return {
            "candidates": cached.candidates,
            "query": cached.query,
            "total_found": cached.total_found,
        }

    def delete_session(self, session_id: str) -> bool:
        """Delete a session from cache"""
        if session_id in self._cache:
            del self._cache[session_id]
            logger.info(f"Deleted session: {session_id[:8]}...")
            return True
        return False

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "active_sessions": len(self._cache),
            "ttl_seconds": self._ttl,
            "cleanup_interval": self._cleanup_interval
        }


# Global singleton instance
_search_cache: Optional[SearchCache] = None


def get_search_cache() -> SearchCache:
    """Get the global search cache instance"""
    global _search_cache
    if _search_cache is None:
        _search_cache = SearchCache()
    return _search_cache
