import os
import json
import logging
import httpx
from typing import Dict, Any
from .base import LLMProvider

logger = logging.getLogger("gitscout.llm.gemini")


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
        logger.info(f"Generating search query using model: {self.model}")
        logger.debug(f"JD text length: {len(jd_text)} chars")

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
            logger.debug(f"Gemini API response: {data}")

            # Extract text from Gemini response
            try:
                query = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                logger.info(f"Generated search query: {query}")
                return query
            except (KeyError, IndexError) as e:
                logger.error(f"Failed to parse Gemini response: {e}")
                raise ValueError(f"Failed to parse Gemini response: {e}")

    async def generate_jd_spec(self, jd_text: str) -> Dict[str, Any]:
        """Generate structured JD spec using Gemini API"""
        logger.info(f"Generating JD spec using model: {self.model}")
        logger.debug(f"JD text length: {len(jd_text)} chars")

        url = f"{self.base_url}/{self.model}:generateContent"
        prompt = self.JD_SPEC_PROMPT_TEMPLATE.format(jd_text=jd_text)

        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 500
            }
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
            logger.debug(f"Gemini JD spec API response: {data}")

            try:
                content = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                # Clean up potential markdown code blocks
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                spec = json.loads(content)
                logger.info(f"Generated JD spec: languages={spec.get('languages')}, domains={spec.get('core_domains')}, keywords={spec.get('core_keywords')}")
                return spec
            except (KeyError, IndexError, json.JSONDecodeError) as e:
                logger.error(f"Failed to parse Gemini JD spec response: {e}")
                raise ValueError(f"Failed to parse Gemini JD spec response: {e}")
