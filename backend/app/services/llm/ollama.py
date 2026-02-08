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

    async def rewrite_vague_query(self, jd_text: str) -> str:
        """Rewrite a vague job description into a more specific one using Ollama API"""
        logger.info(f"Rewriting vague query using model: {self.model}")
        logger.debug(f"Original JD text length: {len(jd_text)} chars")

        url = f"{self.base_url}/api/generate"
        prompt = self.QUERY_REWRITE_PROMPT_TEMPLATE.format(jd_text=jd_text)

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            logger.debug(f"Ollama rewrite API response: {data}")

            try:
                rewritten = data["response"].strip()
                logger.info(f"Rewritten JD (first 200 chars): {rewritten[:200]}...")
                return rewritten
            except KeyError as e:
                logger.error(f"Failed to parse Ollama rewrite response: {e}")
                raise ValueError(f"Failed to parse Ollama rewrite response: {e}")

    async def generate_skills_analysis(self, prompt: str) -> str:
        """Generate skills analysis using Ollama API"""
        logger.info(f"Generating skills analysis using model: {self.model}")

        url = f"{self.base_url}/api/generate"

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                timeout=120.0  # Longer timeout for local models
            )
            response.raise_for_status()
            data = response.json()
            logger.debug(f"Ollama skills analysis API response received")

            try:
                content = data["response"].strip()
                logger.info(f"Generated skills analysis (first 200 chars): {content[:200]}...")
                return content
            except KeyError as e:
                logger.error(f"Failed to parse Ollama skills analysis response: {e}")
                raise ValueError(f"Failed to parse Ollama skills analysis response: {e}")
