"""User profile API routes."""

import logging
from fastapi import APIRouter, HTTPException
from firebase_admin import auth as firebase_auth

from app.services.profile.profile_service import get_profile_service
from app.services.firebase.auth import CurrentUser
from app.models.profile import UserProfileResponse

logger = logging.getLogger("gitscout.profile")

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/stats", response_model=UserProfileResponse)
async def get_profile_stats(current_user: CurrentUser = None):
    """Get user profile with statistics.

    Returns user information and aggregated statistics including:
    - Basic user info (name, email, account creation, last sign-in)
    - Search statistics (total searches, candidates found, starred, conversations)
    - Recent search previews (last 5 searches)

    Args:
        current_user: Authenticated user

    Returns:
        UserProfileResponse with user info and statistics

    Raises:
        HTTPException: If service error occurs
    """
    logger.info(f"GET /profile/stats - user: {current_user.uid}")

    try:
        # Get Firebase user record for metadata
        user_record = firebase_auth.get_user(current_user.uid)

        # Get aggregated statistics
        service = get_profile_service()
        stats = await service.get_profile_stats(current_user.uid)

        # Build user info
        user_info = {
            "uid": current_user.uid,
            "email": current_user.email,
            "displayName": user_record.display_name,
            "photoURL": user_record.photo_url,
            "creationTime": user_record.user_metadata.creation_timestamp,
            "lastSignInTime": user_record.user_metadata.last_sign_in_timestamp,
        }

        response = UserProfileResponse(user_info=user_info, stats=stats)

        logger.info(f"Returning profile stats for user {current_user.uid}")
        return response

    except Exception as e:
        logger.error(f"GET /profile/stats error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to get profile stats: {str(e)}"
        )
