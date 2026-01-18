from abc import ABC, abstractmethod


class LLMProvider(ABC):
    """Abstract base class for LLM providers"""

    PROMPT_TEMPLATE = """Given this job description, generate a GitHub search query string.
Use GitHub search syntax: language:LANG, followers:>N, repos:>N, location:LOCATION.
Keep it concise and focused on technical requirements.

Job Description:
{jd_text}

Return only the search query string, nothing else."""

    @abstractmethod
    async def generate_search_query(self, jd_text: str) -> str:
        """Generate a GitHub search query from job description text"""
        pass
