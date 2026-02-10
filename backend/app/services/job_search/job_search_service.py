"""Job search persistence service.

This service manages the persistence of job search sessions in Firestore,
including candidates, starred candidates, filters, and job descriptions.
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.services.firebase.firestore_service import FirestoreService, get_firestore_service
from app.models.job_search import JobSearch, JobSearchSummary

logger = logging.getLogger(__name__)


class JobSearchService:
    """Service for managing job search persistence in Firestore."""

    COLLECTION = "job_searches"
    CONVERSATIONS_SUBCOLLECTION = "conversations"

    def __init__(self, firestore: FirestoreService):
        """Initialize the job search service.

        Args:
            firestore: Firestore service instance
        """
        self.firestore = firestore

    async def create_job_search(
        self,
        search_id: str,
        user_id: str,
        job_description: str,
        query: str,
        total_found: int,
        candidates: List[Dict[str, Any]],
        jd_spec: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Create new job search in Firestore.

        Args:
            search_id: Unique identifier for the search (same as session_id)
            user_id: User ID who created the search
            job_description: Original job description text
            query: Generated GitHub query string
            total_found: Total number of candidates found
            candidates: List of candidate data dictionaries
            jd_spec: Parsed job description specification

        Returns:
            search_id of created job search

        Raises:
            Exception: If Firestore operation fails
        """
        try:
            data = {
                "userId": user_id,
                "jobDescription": job_description,
                "query": query,
                "totalFound": total_found,
                "candidates": candidates,
                "starredCandidateIds": [],  # Initially empty
                "currentFilters": None,  # No filters initially
                "jdSpec": jd_spec,
            }

            await self.firestore.create_document(
                self.COLLECTION,
                document_id=search_id,
                data=data
            )

            logger.info(
                f"Created job search {search_id} for user {user_id} "
                f"with {len(candidates)} candidates"
            )

            return search_id

        except Exception as e:
            logger.error(f"Failed to create job search: {e}", exc_info=True)
            raise

    async def get_job_search(
        self, search_id: str, user_id: str
    ) -> Optional[JobSearch]:
        """Get job search by ID.

        Args:
            search_id: Job search ID
            user_id: User ID (for authorization)

        Returns:
            JobSearch object or None if not found

        Raises:
            PermissionError: If search belongs to different user
        """
        try:
            doc = await self.firestore.get_document(self.COLLECTION, search_id)

            if not doc:
                return None

            # Verify ownership
            if doc.get("userId") != user_id:
                raise PermissionError(
                    f"User {user_id} not authorized to access search {search_id}"
                )

            return JobSearch(
                search_id=search_id,
                user_id=doc["userId"],
                job_description=doc["jobDescription"],
                query=doc["query"],
                total_found=doc["totalFound"],
                candidates=doc.get("candidates", []),
                starred_candidate_ids=doc.get("starredCandidateIds", []),
                current_filters=doc.get("currentFilters"),
                jd_spec=doc.get("jdSpec"),
                created_at=doc["createdAt"],
                updated_at=doc.get("updatedAt", doc["createdAt"]),
            )

        except Exception as e:
            logger.error(
                f"Failed to get job search {search_id}: {e}", exc_info=True
            )
            raise

    async def update_job_search_candidates(
        self,
        search_id: str,
        user_id: str,
        candidates: List[Dict[str, Any]],
        filters: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Update candidates and filters after refinement.

        This is called when:
        - User applies filters
        - Chat refines the candidate list
        - User makes any changes to the visible candidates

        Args:
            search_id: Job search ID
            user_id: User ID (for authorization)
            candidates: Updated list of candidates
            filters: Applied filters

        Returns:
            True if successful

        Raises:
            PermissionError: If search belongs to different user
        """
        try:
            # Verify ownership first
            existing = await self.get_job_search(search_id, user_id)
            if not existing:
                raise ValueError(f"Job search {search_id} not found")

            data = {
                "candidates": candidates,
                "currentFilters": filters,
            }

            await self.firestore.update_document(
                self.COLLECTION, search_id, data
            )

            logger.info(
                f"Updated job search {search_id} with {len(candidates)} candidates"
            )

            return True

        except Exception as e:
            logger.error(
                f"Failed to update job search candidates: {e}", exc_info=True
            )
            raise

    async def toggle_starred_candidate(
        self, search_id: str, user_id: str, candidate_id: str
    ) -> bool:
        """Toggle starred status for a candidate.

        Args:
            search_id: Job search ID
            user_id: User ID (for authorization)
            candidate_id: Candidate ID to toggle

        Returns:
            True if now starred, False if unstarred

        Raises:
            PermissionError: If search belongs to different user
        """
        try:
            # Get current state
            job_search = await self.get_job_search(search_id, user_id)
            if not job_search:
                raise ValueError(f"Job search {search_id} not found")

            starred_ids = job_search.starred_candidate_ids.copy()

            # Toggle
            if candidate_id in starred_ids:
                starred_ids.remove(candidate_id)
                is_starred = False
            else:
                starred_ids.append(candidate_id)
                is_starred = True

            # Update
            await self.firestore.update_document(
                self.COLLECTION,
                search_id,
                {"starredCandidateIds": starred_ids}
            )

            logger.info(
                f"Toggled star for candidate {candidate_id} in search {search_id}: "
                f"{'starred' if is_starred else 'unstarred'}"
            )

            return is_starred

        except Exception as e:
            logger.error(
                f"Failed to toggle starred candidate: {e}", exc_info=True
            )
            raise

    async def list_job_searches(
        self, user_id: str, limit: int = 50
    ) -> List[JobSearchSummary]:
        """List all job searches for user, most recent first.

        Args:
            user_id: User ID
            limit: Maximum number of searches to return

        Returns:
            List of JobSearchSummary objects
        """
        try:
            # Query searches for user, ordered by creation date
            searches = await self.firestore.query_documents(
                self.COLLECTION,
                filters=[("userId", "==", user_id)],
                order_by="createdAt",
                order_direction="DESCENDING",
                limit=limit,
            )

            summaries = []
            for doc in searches:
                # Count conversations for this search
                conversations = await self.firestore.get_subcollection_documents(
                    self.COLLECTION,
                    doc["id"],
                    self.CONVERSATIONS_SUBCOLLECTION,
                )

                summary = JobSearchSummary(
                    search_id=doc["id"],
                    job_description=doc["jobDescription"],
                    total_found=doc["totalFound"],
                    starred_count=len(doc.get("starredCandidateIds", [])),
                    conversation_count=len(conversations),
                    created_at=doc["createdAt"],
                    updated_at=doc.get("updatedAt", doc["createdAt"]),
                )
                summaries.append(summary)

            logger.info(f"Listed {len(summaries)} job searches for user {user_id}")

            return summaries

        except Exception as e:
            logger.error(f"Failed to list job searches: {e}", exc_info=True)
            raise

    async def delete_job_search(self, search_id: str, user_id: str) -> bool:
        """Delete job search and all its conversations.

        This performs a cascading delete:
        1. Delete all messages in all conversations
        2. Delete all conversations
        3. Delete the job search document

        Args:
            search_id: Job search ID
            user_id: User ID (for authorization)

        Returns:
            True if successful

        Raises:
            PermissionError: If search belongs to different user
        """
        try:
            # Verify ownership
            job_search = await self.get_job_search(search_id, user_id)
            if not job_search:
                raise ValueError(f"Job search {search_id} not found")

            # Get all conversations
            conversations = await self.firestore.get_subcollection_documents(
                self.COLLECTION,
                search_id,
                self.CONVERSATIONS_SUBCOLLECTION,
            )

            # Delete all conversations and their messages
            for conv in conversations:
                conv_id = conv["id"]

                # Delete all messages in this conversation
                messages = await self.firestore.get_subcollection_documents(
                    f"{self.COLLECTION}/{search_id}/{self.CONVERSATIONS_SUBCOLLECTION}",
                    conv_id,
                    "messages",
                )

                for msg in messages:
                    await self.firestore.delete_document(
                        f"{self.COLLECTION}/{search_id}/{self.CONVERSATIONS_SUBCOLLECTION}/{conv_id}/messages",
                        msg["id"],
                    )

                # Delete conversation document
                await self.firestore.delete_document(
                    f"{self.COLLECTION}/{search_id}/{self.CONVERSATIONS_SUBCOLLECTION}",
                    conv_id,
                )

            # Delete the job search document
            await self.firestore.delete_document(self.COLLECTION, search_id)

            logger.info(
                f"Deleted job search {search_id} and {len(conversations)} conversations"
            )

            return True

        except Exception as e:
            logger.error(f"Failed to delete job search: {e}", exc_info=True)
            raise


# Global service instance
_job_search_service: Optional[JobSearchService] = None


def get_job_search_service() -> JobSearchService:
    """Get the global JobSearchService instance.

    Returns:
        JobSearchService instance
    """
    global _job_search_service
    if _job_search_service is None:
        _job_search_service = JobSearchService(get_firestore_service())
    return _job_search_service


__all__ = ["JobSearchService", "get_job_search_service"]
