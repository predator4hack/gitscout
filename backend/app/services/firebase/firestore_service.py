"""Firestore database operations service."""

from typing import Optional, Dict, List, Any
from datetime import datetime
from google.cloud import firestore
from google.cloud.firestore import Client, Query
from . import get_firestore_client


class FirestoreService:
    """Service for Firestore database operations."""

    def __init__(self):
        """Initialize the Firestore service."""
        self._db: Optional[Client] = None

    @property
    def db(self) -> Client:
        """Get or initialize the Firestore client.

        Returns:
            Firestore client instance
        """
        if self._db is None:
            self._db = get_firestore_client()
        return self._db

    # Generic CRUD operations

    async def create_document(
        self, collection: str, document_id: Optional[str] = None, data: Dict[str, Any] = None
    ) -> str:
        """Create a new document in a collection.

        Args:
            collection: Collection name
            document_id: Optional document ID (auto-generated if not provided)
            data: Document data

        Returns:
            Document ID
        """
        if data is None:
            data = {}

        # Add timestamp
        data["createdAt"] = firestore.SERVER_TIMESTAMP

        if document_id:
            # Create with specific ID
            doc_ref = self.db.collection(collection).document(document_id)
            doc_ref.set(data)
            return document_id
        else:
            # Auto-generate ID
            doc_ref = self.db.collection(collection).document()
            doc_ref.set(data)
            return doc_ref.id

    async def get_document(self, collection: str, document_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID.

        Args:
            collection: Collection name
            document_id: Document ID

        Returns:
            Document data or None if not found
        """
        doc_ref = self.db.collection(collection).document(document_id)
        doc = doc_ref.get()

        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None

    async def update_document(
        self, collection: str, document_id: str, data: Dict[str, Any]
    ) -> bool:
        """Update a document.

        Args:
            collection: Collection name
            document_id: Document ID
            data: Fields to update

        Returns:
            True if successful
        """
        # Add update timestamp
        data["updatedAt"] = firestore.SERVER_TIMESTAMP

        doc_ref = self.db.collection(collection).document(document_id)
        doc_ref.update(data)
        return True

    async def delete_document(self, collection: str, document_id: str) -> bool:
        """Delete a document.

        Args:
            collection: Collection name
            document_id: Document ID

        Returns:
            True if successful
        """
        doc_ref = self.db.collection(collection).document(document_id)
        doc_ref.delete()
        return True

    async def query_documents(
        self,
        collection: str,
        filters: Optional[List[tuple]] = None,
        order_by: Optional[str] = None,
        order_direction: str = "DESCENDING",
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Query documents with filters.

        Args:
            collection: Collection name
            filters: List of (field, operator, value) tuples
            order_by: Field to order by
            order_direction: "ASCENDING" or "DESCENDING"
            limit: Maximum number of results

        Returns:
            List of documents
        """
        query = self.db.collection(collection)

        # Apply filters
        if filters:
            for field, operator, value in filters:
                query = query.where(field, operator, value)

        # Apply ordering
        if order_by:
            direction = (
                Query.DESCENDING if order_direction == "DESCENDING" else Query.ASCENDING
            )
            query = query.order_by(order_by, direction=direction)

        # Apply limit
        if limit:
            query = query.limit(limit)

        # Execute query
        docs = query.stream()

        # Convert to list of dicts
        results = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)

        return results

    # Subcollection operations

    async def create_subcollection_document(
        self,
        collection: str,
        document_id: str,
        subcollection: str,
        subdocument_id: Optional[str] = None,
        data: Dict[str, Any] = None,
    ) -> str:
        """Create a document in a subcollection.

        Args:
            collection: Parent collection name
            document_id: Parent document ID
            subcollection: Subcollection name
            subdocument_id: Optional subdocument ID
            data: Document data

        Returns:
            Subdocument ID
        """
        if data is None:
            data = {}

        data["createdAt"] = firestore.SERVER_TIMESTAMP

        parent_ref = self.db.collection(collection).document(document_id)

        if subdocument_id:
            doc_ref = parent_ref.collection(subcollection).document(subdocument_id)
            doc_ref.set(data)
            return subdocument_id
        else:
            doc_ref = parent_ref.collection(subcollection).document()
            doc_ref.set(data)
            return doc_ref.id

    async def get_subcollection_documents(
        self,
        collection: str,
        document_id: str,
        subcollection: str,
        order_by: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Get all documents from a subcollection.

        Args:
            collection: Parent collection name
            document_id: Parent document ID
            subcollection: Subcollection name
            order_by: Field to order by
            limit: Maximum number of results

        Returns:
            List of subdocuments
        """
        parent_ref = self.db.collection(collection).document(document_id)
        query = parent_ref.collection(subcollection)

        if order_by:
            query = query.order_by(order_by)

        if limit:
            query = query.limit(limit)

        docs = query.stream()

        results = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)

        return results

    # Batch operations

    async def batch_create(
        self, collection: str, documents: List[Dict[str, Any]]
    ) -> List[str]:
        """Create multiple documents in a batch.

        Args:
            collection: Collection name
            documents: List of document data

        Returns:
            List of document IDs
        """
        batch = self.db.batch()
        doc_ids = []

        for doc_data in documents:
            doc_ref = self.db.collection(collection).document()
            doc_data["createdAt"] = firestore.SERVER_TIMESTAMP
            batch.set(doc_ref, doc_data)
            doc_ids.append(doc_ref.id)

        batch.commit()
        return doc_ids

    # Transaction support

    def transaction(self):
        """Get a Firestore transaction.

        Returns:
            Firestore transaction context manager
        """
        return self.db.transaction()

    # Utility methods

    def get_server_timestamp(self):
        """Get Firestore server timestamp sentinel.

        Returns:
            Server timestamp sentinel value
        """
        return firestore.SERVER_TIMESTAMP


# Global service instance
_firestore_service: Optional[FirestoreService] = None


def get_firestore_service() -> FirestoreService:
    """Get the global Firestore service instance.

    Returns:
        FirestoreService instance
    """
    global _firestore_service
    if _firestore_service is None:
        _firestore_service = FirestoreService()
    return _firestore_service


__all__ = ["FirestoreService", "get_firestore_service"]
