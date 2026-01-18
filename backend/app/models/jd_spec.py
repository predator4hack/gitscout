from pydantic import BaseModel, Field
from typing import List, Optional


class GitScoutJDSpec(BaseModel):
    """Structured specification extracted from job description by LLM"""

    role_title: Optional[str] = None

    # Hard constraints
    languages: List[str] = Field(default_factory=list)          # ["Python", "Go"]
    core_domains: List[str] = Field(default_factory=list)       # ["machine-learning", "backend"]
    core_keywords: List[str] = Field(default_factory=list)      # ["kafka", "kubernetes", "grpc"]

    # Nice-to-haves
    nice_keywords: List[str] = Field(default_factory=list)      # ["spark", "airflow"]

    # Search shaping
    recency_days: int = 365
    min_repo_stars: int = 20
    exclude_forks: bool = True
    exclude_archived: bool = True

    # Optional user-side constraints
    min_followers: int = 0
    location_hint: Optional[str] = None

    # Query generation control
    max_repo_queries: int = 8
    max_repos_per_query: int = 20
