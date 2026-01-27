"""
Centralized configuration for GitScout API limits and settings.

All values can be overridden via environment variables.
"""
import os


class GitScoutConfig:
    """Centralized configuration for GitScout API limits"""

    # Pipeline settings
    MAX_REPOS: int = int(os.getenv("GITSCOUT_MAX_REPOS", "10"))
    CONTRIBUTORS_PER_REPO: int = int(os.getenv("GITSCOUT_CONTRIBUTORS_PER_REPO", "10"))
    REPOS_PER_QUERY: int = int(os.getenv("GITSCOUT_REPOS_PER_QUERY", "50"))
    TOP_CONTRIBUTORS: int = int(os.getenv("GITSCOUT_TOP_CONTRIBUTORS", "50"))

    # GitHub client settings
    HYDRATE_BATCH_SIZE: int = int(os.getenv("GITSCOUT_HYDRATE_BATCH_SIZE", "5"))
    MAX_CONCURRENT_REQUESTS: int = int(os.getenv("GITSCOUT_MAX_CONCURRENT_REQUESTS", "5"))


config = GitScoutConfig()
