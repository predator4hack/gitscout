import os
import httpx
from .base import LLMProvider


class GeminiLLMProvider(LLMProvider):
    """Gemini LLM provider implementation"""

    def __init__(self, model: str = "gemini-pro"):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        self.model = model
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    async def generate_search_query(self, jd_text: str) -> str:
        """Generate search query using Gemini API"""
        url = f"{self.base_url}/{self.model}:generateContent"

        prompt = self.PROMPT_TEMPLATE.format(jd_text=jd_text)

        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                params={"key": self.api_key},
                timeout=30.0
            )
            response.raise_for_status()

            data = response.json()

            # Extract text from Gemini response
            try:
                query = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                return query
            except (KeyError, IndexError) as e:
                raise ValueError(f"Failed to parse Gemini response: {e}")
