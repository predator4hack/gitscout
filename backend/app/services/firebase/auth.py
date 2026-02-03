"""Firebase authentication middleware and dependencies."""

from typing import Optional, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from firebase_admin.exceptions import FirebaseError


# HTTP Bearer token scheme for extracting JWT tokens from Authorization header
security = HTTPBearer(auto_error=False)


class FirebaseUser:
    """Represents an authenticated Firebase user."""

    def __init__(self, decoded_token: dict):
        """Initialize a Firebase user from a decoded token.

        Args:
            decoded_token: Decoded Firebase ID token
        """
        self.uid: str = decoded_token["uid"]
        self.email: Optional[str] = decoded_token.get("email")
        self.email_verified: bool = decoded_token.get("email_verified", False)
        self.name: Optional[str] = decoded_token.get("name")
        self.picture: Optional[str] = decoded_token.get("picture")
        self.provider: Optional[str] = decoded_token.get("firebase", {}).get(
            "sign_in_provider"
        )

        # Store the full decoded token for access to custom claims
        self._decoded_token = decoded_token

    def __repr__(self) -> str:
        return f"FirebaseUser(uid={self.uid}, email={self.email})"

    def to_dict(self) -> dict:
        """Convert user to dictionary.

        Returns:
            Dictionary representation of the user
        """
        return {
            "uid": self.uid,
            "email": self.email,
            "email_verified": self.email_verified,
            "name": self.name,
            "picture": self.picture,
            "provider": self.provider,
        }


async def get_current_user(
    credentials: Annotated[
        Optional[HTTPAuthorizationCredentials], Depends(security)
    ] = None,
) -> FirebaseUser:
    """Dependency to get the current authenticated user (required).

    This dependency requires authentication. Use this for protected endpoints.

    Args:
        credentials: HTTP Bearer credentials from the request

    Returns:
        Authenticated Firebase user

    Raises:
        HTTPException: If authentication fails or token is invalid
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(credentials.credentials)
        return FirebaseUser(decoded_token)

    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except FirebaseError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}",
        )


async def get_current_user_optional(
    credentials: Annotated[
        Optional[HTTPAuthorizationCredentials], Depends(security)
    ] = None,
) -> Optional[FirebaseUser]:
    """Dependency to get the current authenticated user (optional).

    This dependency allows both authenticated and anonymous access.
    Use this for endpoints that have different behavior for authenticated users.

    Args:
        credentials: HTTP Bearer credentials from the request

    Returns:
        Authenticated Firebase user if token is valid, None otherwise
    """
    if credentials is None:
        return None

    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(credentials.credentials)
        return FirebaseUser(decoded_token)

    except (
        auth.InvalidIdTokenError,
        auth.ExpiredIdTokenError,
        auth.RevokedIdTokenError,
        FirebaseError,
    ):
        # Invalid token, but we allow anonymous access
        return None


# Type aliases for cleaner dependency injection
CurrentUser = Annotated[FirebaseUser, Depends(get_current_user)]
OptionalCurrentUser = Annotated[Optional[FirebaseUser], Depends(get_current_user_optional)]


__all__ = [
    "FirebaseUser",
    "get_current_user",
    "get_current_user_optional",
    "CurrentUser",
    "OptionalCurrentUser",
]
