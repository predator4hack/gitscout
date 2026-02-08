"""LLM-powered clarification question generator for chat assistant."""

import json
import logging
from typing import Optional, List, Dict, Any
from app.models.chat import MultiClarificationContent, ClarificationQuestion, ClarificationOption
from ..llm.base import LLMProvider
from ..llm.gemini import GeminiLLMProvider
from ..llm.groq import GroqLLMProvider

logger = logging.getLogger("gitscout.chat.clarification_generator")


class ClarificationGenerator:
    """Generates contextual clarification questions using LLM."""

    CLARIFICATION_PROMPT_TEMPLATE = """You are a technical recruitment assistant helping to clarify job requirements.

Context:
- Original Job Description: {job_description}
- User's Request: {user_query}
- Current Candidates Found: {candidate_count}
- Previous Conversation: {conversation_history}

The user wants to refine the candidate search. Generate 1-3 clarification questions to better understand their requirements.

For each question:
1. Ask about ONE specific aspect (e.g., skill level, technology depth, experience type)
2. Provide 3-5 concrete options
3. Allow custom input if the options don't cover all cases

Return JSON format:
{{
  "questions": [
    {{
      "question": "What level of CUDA experience are you looking for?",
      "options": [
        {{"label": "Written CUDA kernels from scratch", "value": "cuda_expert"}},
        {{"label": "Used CUDA through PyTorch/TensorFlow", "value": "cuda_through_frameworks"}},
        {{"label": "Familiar with CUDA concepts", "value": "cuda_familiar"}}
      ],
      "allow_custom": true,
      "field_name": "cuda_experience_level"
    }}
  ]
}}

IMPORTANT:
- Focus on disambiguating the user's intent
- Questions should be specific to technologies mentioned
- Options should be mutually exclusive within a question
- Use snake_case for field_name values
- Return ONLY valid JSON, no explanation or markdown code blocks
- Generate 1-3 questions maximum

JSON:"""

    def __init__(self, provider: str = "gemini", model: Optional[str] = None):
        """Initialize the clarification generator.

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
            if self.provider == "gemini":
                self._llm_provider = GeminiLLMProvider(model=self.model or "gemini-pro")
            elif self.provider == "groq":
                self._llm_provider = GroqLLMProvider(model=self.model or "llama-3.3-70b-versatile")
            else:
                raise ValueError(f"Unknown provider: {self.provider}")
        return self._llm_provider

    async def generate_clarifications(
        self,
        user_query: str,
        job_description: str,
        candidate_count: int,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> MultiClarificationContent:
        """Generate clarification questions based on user query and context.

        Args:
            user_query: The user's request for filtering/refining
            job_description: Original job description
            candidate_count: Number of candidates currently found
            conversation_history: Previous messages for context

        Returns:
            MultiClarificationContent with generated questions
        """
        logger.info(f"Generating clarifications for query: {user_query[:100]}...")

        # Format conversation history
        history_text = ""
        if conversation_history:
            history_text = "\n".join([
                f"{msg.get('role', 'unknown')}: {msg.get('content', '')[:200]}"
                for msg in conversation_history[-5:]  # Last 5 messages
            ])

        # Build prompt
        prompt = self.CLARIFICATION_PROMPT_TEMPLATE.format(
            job_description=job_description[:500],  # Limit JD length
            user_query=user_query,
            candidate_count=candidate_count,
            conversation_history=history_text or "No previous conversation"
        )

        try:
            # Call LLM using the existing pattern
            llm_provider = self._get_llm_provider()
            response = await self._call_llm(llm_provider, prompt)

            # Parse JSON response
            clarification_data = self._parse_json_response(response)

            # Convert to MultiClarificationContent
            questions = []
            for q_data in clarification_data.get("questions", [])[:3]:  # Max 3 questions
                options = [
                    ClarificationOption(
                        label=opt.get("label", ""),
                        value=opt.get("value", "")
                    )
                    for opt in q_data.get("options", [])
                ]

                questions.append(
                    ClarificationQuestion(
                        question=q_data.get("question", ""),
                        options=options,
                        allow_custom=q_data.get("allow_custom", True),
                        field_name=q_data.get("field_name", "")
                    )
                )

            if not questions:
                logger.warning("No questions generated, using fallback")
                return self._fallback_clarifications(user_query)

            return MultiClarificationContent(
                questions=questions,
                answers=None,
                all_answered=False
            )

        except Exception as e:
            logger.error(f"Error generating clarifications: {e}", exc_info=True)
            # Fallback to rule-based clarifications
            return self._fallback_clarifications(user_query)

    async def _call_llm(self, llm_provider: LLMProvider, prompt: str) -> str:
        """Call the LLM provider with the given prompt.

        Args:
            llm_provider: The LLM provider instance
            prompt: The prompt to send

        Returns:
            Raw LLM response text
        """
        # Use the provider's method to make a generic completion call
        # We'll need to use the same pattern as generate_jd_spec
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
                    "temperature": 0.3,
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
                "temperature": 0.3,
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

    def _fallback_clarifications(self, user_query: str) -> MultiClarificationContent:
        """Generate fallback clarifications using rule-based approach.

        Args:
            user_query: The user's request

        Returns:
            MultiClarificationContent with basic questions
        """
        logger.info("Using fallback rule-based clarifications")

        query_lower = user_query.lower()
        questions = []

        # Check for experience-related keywords
        if any(word in query_lower for word in ["experience", "senior", "expert", "proficient"]):
            questions.append(
                ClarificationQuestion(
                    question="What level of experience are you looking for?",
                    options=[
                        ClarificationOption(label="Entry level (0-2 years)", value="entry"),
                        ClarificationOption(label="Mid level (2-5 years)", value="mid"),
                        ClarificationOption(label="Senior level (5+ years)", value="senior"),
                        ClarificationOption(label="Expert level (10+ years)", value="expert"),
                    ],
                    allow_custom=True,
                    field_name="experience_level"
                )
            )

        # Check for activity-related keywords
        if any(word in query_lower for word in ["active", "recent", "contributing"]):
            questions.append(
                ClarificationQuestion(
                    question="How recent should their activity be?",
                    options=[
                        ClarificationOption(label="Last 30 days", value="30d"),
                        ClarificationOption(label="Last 3 months", value="3m"),
                        ClarificationOption(label="Last 6 months", value="6m"),
                        ClarificationOption(label="Last year", value="1y"),
                    ],
                    allow_custom=False,
                    field_name="activity_recency"
                )
            )

        # Default question if nothing specific found
        if not questions:
            questions.append(
                ClarificationQuestion(
                    question="What is the most important criteria for filtering?",
                    options=[
                        ClarificationOption(label="Years of experience", value="experience"),
                        ClarificationOption(label="Specific technology expertise", value="technology"),
                        ClarificationOption(label="Recent activity", value="activity"),
                        ClarificationOption(label="Location", value="location"),
                    ],
                    allow_custom=True,
                    field_name="primary_criteria"
                )
            )

        return MultiClarificationContent(
            questions=questions[:3],  # Max 3 questions
            answers=None,
            all_answered=False
        )


# Global instance
_clarification_generator: Optional[ClarificationGenerator] = None


def get_clarification_generator(provider: str = "gemini", model: Optional[str] = None) -> ClarificationGenerator:
    """Get the global ClarificationGenerator instance.

    Args:
        provider: LLM provider name (gemini, groq)
        model: Optional model name for the provider

    Returns:
        ClarificationGenerator instance
    """
    global _clarification_generator
    if _clarification_generator is None:
        _clarification_generator = ClarificationGenerator(provider=provider, model=model)
    return _clarification_generator
