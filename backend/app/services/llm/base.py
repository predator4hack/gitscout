from abc import ABC, abstractmethod


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

    @abstractmethod
    async def generate_search_query(self, jd_text: str) -> str:
        """Generate a GitHub search query from job description text"""
        pass
