"""Profile statistics service."""

import logging
from typing import List

from app.services.firebase.firestore_service import FirestoreService, get_firestore_service
from app.models.profile import ProfileStats, RecentSearchPreview

logger = logging.getLogger(__name__)


class ProfileService:
    """Service for aggregating user profile statistics."""

    COLLECTION = "job_searches"
    CONVERSATIONS_SUBCOLLECTION = "conversations"

    def __init__(self, firestore: FirestoreService):
        self.firestore = firestore

    async def get_profile_stats(self, user_id: str) -> ProfileStats:
        """Aggregate profile statistics for a user.

        Calculates:
        - Total searches
        - Total candidates found (sum across all searches)
        - Total starred candidates (sum across all searches)
        - Total conversations (count across all searches)
        - Recent searches (last 5)

        Args:
            user_id: Firebase user ID

        Returns:
            ProfileStats with aggregated statistics
        """
        try:
            # Query all searches for user, ordered by creation date (newest first)
            searches = await self.firestore.query_documents(
                self.COLLECTION,
                filters=[("userId", "==", user_id)],
                order_by="createdAt",
                order_direction="DESCENDING",
            )

            total_searches = len(searches)
            total_candidates = 0
            total_starred = 0
            total_conversations = 0
            recent_searches = []

            # Aggregate statistics
            for i, search in enumerate(searches):
                total_candidates += search.get("totalFound", 0)
                total_starred += len(search.get("starredCandidateIds", []))

                # Count conversations for this search
                conversations = await self.firestore.get_subcollection_documents(
                    self.COLLECTION,
                    search["id"],
                    self.CONVERSATIONS_SUBCOLLECTION,
                )
                total_conversations += len(conversations)

                # Add to recent searches (first 5)
                if i < 5:
                    recent_searches.append(
                        RecentSearchPreview(
                            search_id=search["id"],
                            job_description=search["jobDescription"],
                            total_found=search.get("totalFound", 0),
                            created_at=search["createdAt"],
                        )
                    )

            return ProfileStats(
                total_searches=total_searches,
                total_candidates_found=total_candidates,
                total_starred=total_starred,
                total_conversations=total_conversations,
                recent_searches=recent_searches,
            )

        except Exception as e:
            logger.error(f"Failed to get profile stats: {e}", exc_info=True)
            raise


# Global service instance
_profile_service = None


def get_profile_service() -> ProfileService:
    """Get or create the global ProfileService instance.

    Returns:
        ProfileService instance
    """
    global _profile_service
    if _profile_service is None:
        _profile_service = ProfileService(get_firestore_service())
    return _profile_service
