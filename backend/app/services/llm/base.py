import random
import asyncio
import logging
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, Callable, TypeVar, Awaitable

logger = logging.getLogger("gitscout.llm")

T = TypeVar('T')


class LLMProvider(ABC):
    """Abstract base class for LLM providers"""

    PROMPT_TEMPLATE = """You are a GitHub search query generator for technical recruitment.

Generate a GitHub user search query based on the job description below.

VALID SEARCH QUALIFIERS (use these ONLY):
- language:LANG - Users with repos in specific language (e.g., language:python)
- location:LOCATION - User's listed location (e.g., location:"San Francisco" or location:USA)
- followers:>N or followers:N..M - Number of followers (e.g., followers:>100 or followers:50..500)
- repos:>N or repos:N..M - Number of public repos (e.g., repos:>10 or repos:5..50)
- created:>YYYY-MM-DD - Account creation date (e.g., created:>2015-01-01)
- type:user - Restrict to user accounts (not organizations)

SYNTAX RULES:
1. Use spaces to combine qualifiers (acts as AND)
2. For ranges: use .. (e.g., followers:10..100)
3. For comparison: use > < >= <= (e.g., repos:>5)
4. Multi-word values: use quotes (e.g., location:"New York")
5. Multiple languages: repeat qualifier (e.g., language:python language:java acts as OR)
6. Keywords search in username, name, email, bio
7. Maximum query length: 256 characters
8. DO NOT use: sort:, in:, user:, org:, - (negation on qualifiers)

EXAMPLES:
Job: "Senior Python Developer in San Francisco"
Query: language:python location:"San Francisco" followers:>50 repos:>10

Job: "Machine Learning Engineer, requires Python and Java experience, remote"
Query: language:python language:java followers:>100 repos:>15

Job: "Junior Frontend Developer, React experience, NYC based"
Query: language:javascript location:"New York" repos:>5

Job: "DevOps Engineer with Go and Docker experience"
Query: language:go followers:>30 repos:>10 docker kubernetes

Job: "Full Stack Developer - Node.js and Python, Europe"
Query: language:javascript language:python location:Europe followers:>20

EXTRACTION STRATEGY:
1. Identify PRIMARY programming languages from job description (max 3)
2. Extract location if specified (city, state, country, or "remote" → omit location)
3. Infer experience level:
   - Junior: followers:>10 repos:>5
   - Mid-level: followers:>50 repos:>10
   - Senior: followers:>100 repos:>20
4. Add relevant keywords from tech stack (frameworks, tools) as plain keywords
5. Keep query under 200 chars for safety

JOB DESCRIPTION:
{jd_text}

IMPORTANT: 
- Return ONLY the search query string, no explanation
- Do not include qualifiers not listed above
- Ensure proper syntax (followers:>N not followers>N)
- Use type:user to exclude organizations

SEARCH QUERY:"""

    JD_SPEC_PROMPT_TEMPLATE = """You are a technical recruiter assistant. Extract structured information from the job description below.

Return a JSON object with the following fields:
- role_title: The job title (string or null)
- languages: List of programming languages required (e.g., ["Python", "Go"])
- core_domains: List of technical domains (e.g., ["machine-learning", "distributed-systems", "backend"])
- core_keywords: List of must-have technologies/frameworks (e.g., ["kafka", "kubernetes", "grpc"])
- nice_keywords: List of nice-to-have technologies (e.g., ["airflow", "spark"])
- recency_days: How recent activity should be (default 365)
- min_repo_stars: Minimum stars for relevant repos (default 20, higher for senior roles)
- min_followers: Minimum followers for candidates (default 0)
- location_hint: Location if specified (string or null)

EXTRACTION RULES:
1. Normalize language names: "JS" -> "JavaScript", "TS" -> "TypeScript", "py" -> "Python"
2. Use lowercase for keywords and domains
3. Separate required vs nice-to-have based on language like "must have" vs "nice to have" / "preferred"
4. For domains, use GitHub topic-style names: "machine-learning" not "Machine Learning"
5. For senior roles: min_repo_stars=50, min_followers=10
6. For mid-level: min_repo_stars=20, min_followers=0
7. Limit languages to top 3 most important
8. Limit core_keywords to top 8 most critical
9. Limit nice_keywords to top 5

JOB DESCRIPTION:
{jd_text}

IMPORTANT: Return ONLY valid JSON, no explanation or markdown code blocks.

JSON:"""

    QUERY_REWRITE_PROMPT_TEMPLATE = """You are a technical recruiter assistant. The following job description is too vague to extract specific technologies.

Your task: Rewrite this into a more specific job description by inferring the likely tech stack based on:
- Industry context (e.g., fintech → Python, trading systems, financial APIs)
- Role type (e.g., backend → databases, APIs, server frameworks)
- Company hints (e.g., startup → modern stack, agile)

Original job description:
{jd_text}

Rules:
1. Add 2-3 specific programming languages that are commonly used in this context
2. Add 3-5 specific frameworks, tools, or technologies
3. Keep the original intent and requirements
4. Be realistic - don't add unrelated technologies
5. Return ONLY the rewritten job description, no explanation

Rewritten job description:"""

    async def _retry_request(
        self,
        request_func: Callable[[], Awaitable[T]],
        max_retries: int = 3,
        base_delay: float = 1.0
    ) -> T:
        """
        Retry wrapper for LLM API calls with exponential backoff.

        Handles transient network errors like connection drops and incomplete reads.
        """
        last_exception = None

        for attempt in range(max_retries + 1):
            try:
                return await request_func()
            except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.RemoteProtocolError) as e:
                last_exception = e
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    logger.warning(
                        f"LLM request failed ({type(e).__name__}), retrying in {delay:.1f}s "
                        f"(attempt {attempt + 1}/{max_retries})"
                    )
                    await asyncio.sleep(delay)

        raise last_exception

    @abstractmethod
    async def generate_search_query(self, jd_text: str) -> str:
        """Generate a GitHub search query from job description text"""
        pass

    @abstractmethod
    async def generate_jd_spec(self, jd_text: str) -> Dict[str, Any]:
        """Extract structured JD specification from job description text"""
        pass

    @abstractmethod
    async def rewrite_vague_query(self, jd_text: str) -> str:
        """Rewrite a vague job description into a more specific one with inferred technologies"""
        pass

    @abstractmethod
    async def generate_skills_analysis(self, prompt: str) -> str:
        """
        Generate skills analysis for a candidate.

        Args:
            prompt: The full prompt including user data and instructions

        Returns:
            Raw LLM response (JSON string)
        """
        pass
