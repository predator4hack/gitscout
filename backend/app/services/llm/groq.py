import os
import httpx
from .base import LLMProvider


class GroqLLMProvider(LLMProvider):
    """Groq LLM provider implementation (OpenAI-compatible API)"""

    def __init__(self, model: str = "mixtral-8x7b-32768"):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        self.model = model
        self.base_url = "https://api.groq.com/openai/v1"

    async def generate_search_query(self, jd_text: str) -> str:
        """Generate search query using Groq API"""
        url = f"{self.base_url}/chat/completions"

        prompt = self.PROMPT_TEMPLATE.format(jd_text=jd_text)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 200
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()

            data = response.json()

            # Extract text from OpenAI-compatible response
            try:
                query = data["choices"][0]["message"]["content"].strip()
                return query
            except (KeyError, IndexError) as e:
                raise ValueError(f"Failed to parse Groq response: {e}")
