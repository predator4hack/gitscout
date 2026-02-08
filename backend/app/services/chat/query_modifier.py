"""LLM-powered query modifier for updating search specifications based on user answers."""

import json
import logging
from typing import Optional, Dict, Any
from app.models.jd_spec import GitScoutJDSpec
from ..llm.base import LLMProvider
from ..llm.gemini import GeminiLLMProvider
from ..llm.groq import GroqLLMProvider

logger = logging.getLogger("gitscout.chat.query_modifier")


class QueryModifier:
    """Modifies GitScoutJDSpec based on user clarification answers using LLM."""

    QUERY_MODIFIER_PROMPT_TEMPLATE = """You are a technical recruiter assistant modifying a job search specification.

Original Job Description:
{original_jd}

User's Clarification Answers:
{clarification_answers}

Original Search Specification:
{original_spec_json}

Based on the user's answers, modify the search specification to better match their requirements.
Update fields like:
- core_keywords: Add or emphasize specific technologies
- nice_keywords: Adjust optional skills
- core_domains: Refine technical domains
- languages: Modify if user specified language preferences
- min_repo_stars: Adjust based on experience level implied (entry: 10, mid: 20, senior: 50, expert: 100)
- min_followers: Adjust based on experience level (entry: 0, mid: 5, senior: 10, expert: 20)
- recency_days: Adjust based on activity requirements (30d: 30, 3m: 90, 6m: 180, 1y: 365)

IMPORTANT:
- Return ONLY the updated JSON specification following the same structure
- Do not add fields that don't exist in the original spec
- Keep existing values if the answers don't relate to them
- Ensure all list fields remain as lists
- Ensure all integer fields remain as integers
- Return ONLY valid JSON, no explanation or markdown code blocks

Updated JSON:"""

    def __init__(self, provider: str = "gemini", model: Optional[str] = None):
        """Initialize the query modifier.

        Args:
            provider: LLM provider name (gemini, groq)
            model: Optional model name for the provider
        """
        self.provider = provider
        self.model = model
        self._llm_provider: Optional[LLMProvider] = None

    def _get_llm_provider(self) -> LLMProvider:
        """Get or create the LLM provider instance."""
        if self._llm_provider is None:
            # Use provided model or default based on provider
            model = self.model
            if not model:
                if self.provider == "gemini":
                    model = "gemini-1.5-flash"
                elif self.provider == "groq":
                    model = "llama-3.3-70b-versatile"

            if self.provider == "gemini":
                self._llm_provider = GeminiLLMProvider(model=model)
            elif self.provider == "groq":
                self._llm_provider = GroqLLMProvider(model=model)
            else:
                raise ValueError(f"Unknown provider: {self.provider}")
        return self._llm_provider

    async def modify_spec(
        self,
        original_spec: GitScoutJDSpec,
        answers: Dict[str, str],
        original_jd: str
    ) -> GitScoutJDSpec:
        """Modify the search specification based on user answers.

        Args:
            original_spec: The original GitScoutJDSpec
            answers: User's answers to clarification questions (field_name -> answer)
            original_jd: Original job description text

        Returns:
            Updated GitScoutJDSpec
        """
        logger.info(f"Modifying spec based on {len(answers)} answers")

        # Format answers for prompt
        answers_text = "\n".join([
            f"- {field_name}: {answer}"
            for field_name, answer in answers.items()
        ])

        # Convert spec to JSON for prompt
        original_spec_json = original_spec.model_dump_json(indent=2)

        # Build prompt
        prompt = self.QUERY_MODIFIER_PROMPT_TEMPLATE.format(
            original_jd=original_jd[:500],  # Limit JD length
            clarification_answers=answers_text,
            original_spec_json=original_spec_json
        )

        try:
            # Call LLM
            llm_provider = self._get_llm_provider()
            response = await self._call_llm(llm_provider, prompt)

            # Parse JSON response
            spec_data = self._parse_json_response(response)

            # Validate and create new spec
            updated_spec = GitScoutJDSpec(**spec_data)

            logger.info(f"Successfully modified spec")
            return updated_spec

        except Exception as e:
            logger.error(f"Error modifying spec: {e}", exc_info=True)
            # Fallback to rule-based modification
            return self._fallback_modify(original_spec, answers)

    async def _call_llm(self, llm_provider: LLMProvider, prompt: str) -> str:
        """Call the LLM provider with the given prompt.

        Args:
            llm_provider: The LLM provider instance
            prompt: The prompt to send

        Returns:
            Raw LLM response text
        """
        if isinstance(llm_provider, GeminiLLMProvider):
            import httpx

            url = f"{llm_provider.base_url}/{llm_provider.model}:generateContent"
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 1000
                }
            }

            async def make_request():
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        url,
                        json=payload,
                        params={"key": llm_provider.api_key},
                        timeout=30.0
                    )
                    response.raise_for_status()
                    return response.json()

            data = await llm_provider._retry_request(make_request)
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()

        elif isinstance(llm_provider, GroqLLMProvider):
            import httpx

            url = f"{llm_provider.base_url}/chat/completions"
            payload = {
                "model": llm_provider.model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 1000
            }

            async def make_request():
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        url,
                        json=payload,
                        headers={
                            "Authorization": f"Bearer {llm_provider.api_key}",
                            "Content-Type": "application/json"
                        },
                        timeout=30.0
                    )
                    response.raise_for_status()
                    return response.json()

            data = await llm_provider._retry_request(make_request)
            return data["choices"][0]["message"]["content"].strip()

        else:
            raise ValueError(f"Unsupported LLM provider: {type(llm_provider)}")

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON from LLM response, handling code blocks.

        Args:
            response: Raw LLM response text

        Returns:
            Parsed JSON dict
        """
        content = response.strip()

        # Clean up potential markdown code blocks
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        # Remove any trailing code block markers
        if content.endswith("```"):
            content = content[:-3].strip()

        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}\nContent: {content}")
            raise

    def _fallback_modify(
        self,
        original_spec: GitScoutJDSpec,
        answers: Dict[str, str]
    ) -> GitScoutJDSpec:
        """Fallback rule-based modification of spec.

        Args:
            original_spec: The original spec
            answers: User's answers

        Returns:
            Modified spec
        """
        logger.info("Using fallback rule-based modification")

        # Create a copy of the spec
        spec_dict = original_spec.model_dump()

        # Apply rule-based modifications
        for field_name, answer in answers.items():
            answer_lower = answer.lower()

            # Handle experience level
            if "experience" in field_name or "level" in field_name:
                if "entry" in answer_lower:
                    spec_dict["min_repo_stars"] = 10
                    spec_dict["min_followers"] = 0
                elif "mid" in answer_lower:
                    spec_dict["min_repo_stars"] = 20
                    spec_dict["min_followers"] = 5
                elif "senior" in answer_lower:
                    spec_dict["min_repo_stars"] = 50
                    spec_dict["min_followers"] = 10
                elif "expert" in answer_lower:
                    spec_dict["min_repo_stars"] = 100
                    spec_dict["min_followers"] = 20

            # Handle activity recency
            if "activity" in field_name or "recency" in field_name:
                if "30d" in answer_lower or "30 days" in answer_lower:
                    spec_dict["recency_days"] = 30
                elif "3m" in answer_lower or "3 months" in answer_lower:
                    spec_dict["recency_days"] = 90
                elif "6m" in answer_lower or "6 months" in answer_lower:
                    spec_dict["recency_days"] = 180
                elif "1y" in answer_lower or "year" in answer_lower:
                    spec_dict["recency_days"] = 365

            # Handle technology keywords
            if "technology" in field_name or "skill" in field_name:
                # Add as core keyword if not already there
                if answer and answer not in spec_dict["core_keywords"]:
                    spec_dict["core_keywords"].append(answer.lower())

        return GitScoutJDSpec(**spec_dict)


# Global instance
_query_modifier: Optional[QueryModifier] = None


def get_query_modifier(provider: str = "gemini", model: Optional[str] = None) -> QueryModifier:
    """Get the global QueryModifier instance.

    Args:
        provider: LLM provider name (gemini, groq)
        model: Optional model name for the provider

    Returns:
        QueryModifier instance
    """
    global _query_modifier
    if _query_modifier is None:
        _query_modifier = QueryModifier(provider=provider, model=model)
    return _query_modifier
