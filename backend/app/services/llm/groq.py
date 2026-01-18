import os
import json
import logging
import httpx
from typing import Dict, Any
from .base import LLMProvider

logger = logging.getLogger("gitscout.llm.groq")


class GroqLLMProvider(LLMProvider):
    """Groq LLM provider implementation (OpenAI-compatible API)"""

    def __init__(self, model: str = "llama-3.3-70b-versatile"):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        self.model = model
        self.base_url = "https://api.groq.com/openai/v1"

    async def generate_search_query(self, jd_text: str) -> str:
        """Generate search query using Groq API"""
        logger.info(f"Generating search query using model: {self.model}")
        logger.debug(f"JD text length: {len(jd_text)} chars")

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
            logger.debug(f"Groq API response: {data}")

            # Extract text from OpenAI-compatible response
            try:
                query = data["choices"][0]["message"]["content"].strip()
                logger.info(f"Generated search query: {query}")
                return query
            except (KeyError, IndexError) as e:
                logger.error(f"Failed to parse Groq response: {e}")
                raise ValueError(f"Failed to parse Groq response: {e}")

    async def generate_jd_spec(self, jd_text: str) -> Dict[str, Any]:
        """Generate structured JD spec using Groq API"""
        logger.info(f"Generating JD spec using model: {self.model}")
        logger.debug(f"JD text length: {len(jd_text)} chars")

        url = f"{self.base_url}/chat/completions"
        prompt = self.JD_SPEC_PROMPT_TEMPLATE.format(jd_text=jd_text)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,  # Lower temperature for structured output
            "max_tokens": 500,
            "response_format": {"type": "json_object"}  # Request JSON response
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
            logger.debug(f"Groq JD spec API response: {data}")

            try:
                content = data["choices"][0]["message"]["content"].strip()
                spec = json.loads(content)
                logger.info(f"Generated JD spec: languages={spec.get('languages')}, domains={spec.get('core_domains')}, keywords={spec.get('core_keywords')}")
                return spec
            except (KeyError, IndexError, json.JSONDecodeError) as e:
                logger.error(f"Failed to parse Groq JD spec response: {e}")
                raise ValueError(f"Failed to parse Groq JD spec response: {e}")
