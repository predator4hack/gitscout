from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


class LLMProvider(str, Enum):
    GEMINI = "gemini"
    GROQ = "groq"
    OLLAMA = "ollama"
    MOCK = "mock"


class SearchRequest(BaseModel):
    jd_text: str = Field(..., description="Job description text")
    provider: LLMProvider = Field(default=LLMProvider.MOCK, description="LLM provider to use")
    model: Optional[str] = Field(None, description="Optional model name for the LLM provider")
