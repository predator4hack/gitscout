import os
import httpx
from .base import LLMProvider


class OllamaLLMProvider(LLMProvider):
    """Ollama LLM provider implementation (local)"""

    def __init__(self, model: str = "llama2"):
        self.model = model
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    async def generate_search_query(self, jd_text: str) -> str:
        """Generate search query using Ollama API"""
        url = f"{self.base_url}/api/generate"

        prompt = self.PROMPT_TEMPLATE.format(jd_text=jd_text)

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                timeout=60.0  # Longer timeout for local models
            )
            response.raise_for_status()

            data = response.json()

            # Extract text from Ollama response
            try:
                query = data["response"].strip()
                return query
            except KeyError as e:
                raise ValueError(f"Failed to parse Ollama response: {e}")
