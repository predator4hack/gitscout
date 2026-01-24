from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional, Literal


class LLMProvider(str, Enum):
    GEMINI = "gemini"
    GROQ = "groq"
    OLLAMA = "ollama"
    MOCK = "mock"


class SearchRequest(BaseModel):
    jd_text: str = Field(..., description="Job description text")
    provider: LLMProvider = Field(default=LLMProvider.MOCK, description="LLM provider to use")
    model: Optional[str] = Field(None, description="Optional model name for the LLM provider")


class CandidateFilters(BaseModel):
    """Filter criteria for candidates"""
    location: Optional[str] = Field(None, description="Case-insensitive text match on location")
    followers_min: Optional[int] = Field(None, ge=0, description="Minimum follower count")
    followers_max: Optional[int] = Field(None, ge=0, description="Maximum follower count")
    has_email: Optional[bool] = Field(None, description="Filter to candidates with public email")
    has_any_contact: Optional[bool] = Field(None, description="Filter to candidates with email, twitter, or website")
    last_contribution: Optional[Literal["30d", "3m", "6m", "1y"]] = Field(
        None,
        description="Last contribution within: 30d=30 days, 3m=3 months, 6m=6 months, 1y=1 year"
    )
