import asyncio
import time
from typing import Dict, Optional
from dataclasses import dataclass
import logging

from app.models.candidate_skills import CandidateSkillsAnalysis

logger = logging.getLogger("gitscout.skills_cache")


@dataclass
class CachedSkillsEntry:
    """Cached skills analysis entry"""
    analysis: CandidateSkillsAnalysis
    created_at: float
    last_accessed: float


class SkillsCache:
    """
    In-memory cache for candidate skills analysis.

    Caches LLM-generated skills analysis to avoid repeated API calls.
    Cache keys are {session_id}:{login} to scope analysis to sessions.
    """

    def __init__(
        self,
        ttl_seconds: int = 1800,  # 30 minutes
        cleanup_interval: int = 300  # 5 minutes
    ):
        self._cache: Dict[str, CachedSkillsEntry] = {}
        self._ttl = ttl_seconds
        self._cleanup_interval = cleanup_interval
        self._cleanup_task: Optional[asyncio.Task] = None

    def _make_key(self, session_id: str, login: str) -> str:
        """Generate cache key from session_id and login"""
        return f"{session_id}:{login}"

    def start_cleanup_task(self):
        """Start background cleanup task"""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
            logger.info("Started skills cache cleanup background task")

    async def _cleanup_loop(self):
        """Periodically clean up expired entries"""
        while True:
            await asyncio.sleep(self._cleanup_interval)
            self._cleanup_expired()

    def _cleanup_expired(self):
        """Remove expired entries from cache"""
        now = time.time()
        expired = [
            key for key, entry in self._cache.items()
            if now - entry.last_accessed > self._ttl
        ]
        for key in expired:
            del self._cache[key]
        if expired:
            logger.info(f"Cleaned up {len(expired)} expired skills cache entries")

    def get(self, session_id: str, login: str) -> Optional[CandidateSkillsAnalysis]:
        """
        Get cached skills analysis for a candidate.

        Args:
            session_id: The search session ID
            login: The candidate's GitHub login

        Returns:
            CandidateSkillsAnalysis if cached and not expired, None otherwise
        """
        key = self._make_key(session_id, login)
        entry = self._cache.get(key)

        if entry is None:
            return None

        # Check if entry is expired
        now = time.time()
        if now - entry.created_at > self._ttl:
            del self._cache[key]
            logger.debug(f"Skills cache expired for {login}")
            return None

        # Update last accessed time
        entry.last_accessed = now

        # Mark as cached and return
        analysis = entry.analysis.model_copy()
        analysis.cached = True

        logger.debug(f"Skills cache hit for {login}")
        return analysis

    def set(self, session_id: str, login: str, analysis: CandidateSkillsAnalysis) -> None:
        """
        Cache skills analysis for a candidate.

        Args:
            session_id: The search session ID
            login: The candidate's GitHub login
            analysis: The skills analysis to cache
        """
        key = self._make_key(session_id, login)
        now = time.time()

        self._cache[key] = CachedSkillsEntry(
            analysis=analysis,
            created_at=now,
            last_accessed=now
        )

        logger.debug(f"Cached skills analysis for {login}")

    def invalidate(self, session_id: str, login: str) -> bool:
        """
        Invalidate cached skills analysis for a candidate.

        Args:
            session_id: The search session ID
            login: The candidate's GitHub login

        Returns:
            True if entry was removed, False if not found
        """
        key = self._make_key(session_id, login)
        if key in self._cache:
            del self._cache[key]
            logger.debug(f"Invalidated skills cache for {login}")
            return True
        return False

    def get_stats(self) -> Dict[str, any]:
        """Get cache statistics"""
        return {
            "cached_entries": len(self._cache),
            "ttl_seconds": self._ttl,
            "cleanup_interval": self._cleanup_interval
        }


# Global singleton instance
_skills_cache: Optional[SkillsCache] = None


def get_skills_cache() -> SkillsCache:
    """Get the global skills cache instance"""
    global _skills_cache
    if _skills_cache is None:
        _skills_cache = SkillsCache()
    return _skills_cache
