import os
import json
import logging
import httpx
from typing import Dict, Any
from .base import LLMProvider

logger = logging.getLogger("gitscout.llm.ollama")


class OllamaLLMProvider(LLMProvider):
    """Ollama LLM provider implementation (local)"""

    def __init__(self, model: str = "llama2"):
        self.model = model
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    async def generate_search_query(self, jd_text: str) -> str:
        """Generate search query using Ollama API"""
        logger.info(f"Generating search query using model: {self.model}")
        logger.debug(f"JD text length: {len(jd_text)} chars")

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
            logger.debug(f"Ollama API response: {data}")

            # Extract text from Ollama response
            try:
                query = data["response"].strip()
                logger.info(f"Generated search query: {query}")
                return query
            except KeyError as e:
                logger.error(f"Failed to parse Ollama response: {e}")
                raise ValueError(f"Failed to parse Ollama response: {e}")

    async def generate_jd_spec(self, jd_text: str) -> Dict[str, Any]:
        """Generate structured JD spec using Ollama API"""
        logger.info(f"Generating JD spec using model: {self.model}")
        logger.debug(f"JD text length: {len(jd_text)} chars")

        url = f"{self.base_url}/api/generate"
        prompt = self.JD_SPEC_PROMPT_TEMPLATE.format(jd_text=jd_text)

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"  # Request JSON output
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                timeout=60.0  # Longer timeout for local models
            )
            response.raise_for_status()
            data = response.json()
            logger.debug(f"Ollama JD spec API response: {data}")

            try:
                content = data["response"].strip()
                # Clean up potential markdown code blocks
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                spec = json.loads(content)
                logger.info(f"Generated JD spec: languages={spec.get('languages')}, domains={spec.get('core_domains')}, keywords={spec.get('core_keywords')}")
                return spec
            except (KeyError, json.JSONDecodeError) as e:
                logger.error(f"Failed to parse Ollama JD spec response: {e}")
                raise ValueError(f"Failed to parse Ollama JD spec response: {e}")
