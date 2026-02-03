"""Firebase Admin SDK initialization and utilities."""

import os
import json
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore, auth
from google.cloud.firestore import Client


# Global Firebase Admin SDK instances
_firebase_app: Optional[firebase_admin.App] = None
_firestore_client: Optional[Client] = None


def initialize_firebase() -> None:
    """Initialize Firebase Admin SDK.

    This function should be called once during application startup.
    It initializes the Firebase Admin SDK with service account credentials.

    Supported credential methods:
    1. FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string)
    2. FIREBASE_CREDENTIALS_PATH env var (path to JSON file)
    3. GOOGLE_APPLICATION_CREDENTIALS env var (for Cloud Run)
    4. Application Default Credentials (for Cloud Run/GCP)
    """
    global _firebase_app, _firestore_client

    if _firebase_app is not None:
        return  # Already initialized

    try:
        # Method 1: JSON string in environment variable
        service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
        if service_account_json:
            try:
                service_account_dict = json.loads(service_account_json)
                cred = credentials.Certificate(service_account_dict)
                _firebase_app = firebase_admin.initialize_app(cred)
                print("✓ Firebase initialized with service account key from FIREBASE_SERVICE_ACCOUNT_KEY")
            except json.JSONDecodeError as e:
                print(f"✗ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: {e}")
                raise

        # Method 2: Path to service account JSON file
        elif credentials_path := os.getenv("FIREBASE_CREDENTIALS_PATH"):
            if not os.path.exists(credentials_path):
                raise FileNotFoundError(f"Firebase credentials file not found: {credentials_path}")
            cred = credentials.Certificate(credentials_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            print(f"✓ Firebase initialized with credentials from {credentials_path}")

        # Method 3: Application Default Credentials (Cloud Run, GCE)
        else:
            # Use default credentials (works on Cloud Run and GCE)
            _firebase_app = firebase_admin.initialize_app()
            print("✓ Firebase initialized with Application Default Credentials")

        # Initialize Firestore client
        _firestore_client = firestore.client()

        # Verify connection
        project_id = os.getenv("FIREBASE_PROJECT_ID") or _firebase_app.project_id
        print(f"✓ Firestore client initialized for project: {project_id}")

    except Exception as e:
        print(f"✗ Firebase initialization failed: {e}")
        raise


def get_firestore_client() -> Client:
    """Get the Firestore client instance.

    Returns:
        Firestore client instance

    Raises:
        RuntimeError: If Firebase is not initialized
    """
    if _firestore_client is None:
        raise RuntimeError(
            "Firestore client not initialized. Call initialize_firebase() first."
        )
    return _firestore_client


def get_firebase_app() -> firebase_admin.App:
    """Get the Firebase app instance.

    Returns:
        Firebase app instance

    Raises:
        RuntimeError: If Firebase is not initialized
    """
    if _firebase_app is None:
        raise RuntimeError(
            "Firebase app not initialized. Call initialize_firebase() first."
        )
    return _firebase_app


def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token.

    Args:
        id_token: Firebase ID token from the client

    Returns:
        Decoded token payload containing user information

    Raises:
        firebase_admin.auth.InvalidIdTokenError: If token is invalid
        firebase_admin.auth.ExpiredIdTokenError: If token is expired
        firebase_admin.auth.RevokedIdTokenError: If token is revoked
    """
    decoded_token = auth.verify_id_token(id_token)
    return decoded_token


def is_firebase_initialized() -> bool:
    """Check if Firebase is initialized.

    Returns:
        True if Firebase is initialized, False otherwise
    """
    return _firebase_app is not None and _firestore_client is not None


__all__ = [
    "initialize_firebase",
    "get_firestore_client",
    "get_firebase_app",
    "verify_firebase_token",
    "is_firebase_initialized",
]
