from ..llm.base import LLMProvider as BaseLLMProvider
from ..llm.mock import MockLLMProvider
from ..llm.gemini import GeminiLLMProvider
from ..llm.groq import GroqLLMProvider
from ..llm.ollama import OllamaLLMProvider
from typing import Optional


async def generate_query(jd_text: str, provider: str, model: Optional[str] = None) -> str:
    """
    Generate GitHub search query from job description using specified LLM provider

    Args:
        jd_text: Job description text
        provider: LLM provider name (gemini, groq, ollama, mock)
        model: Optional model name for the provider

    Returns:
        GitHub search query string
    """
    # Select provider
    llm_provider: BaseLLMProvider

    if provider == "mock":
        llm_provider = MockLLMProvider()
    elif provider == "gemini":
        llm_provider = GeminiLLMProvider(model=model or "gemini-pro")
    elif provider == "groq":
        llm_provider = GroqLLMProvider(model=model or "llama-3.3-70b-versatile")
    elif provider == "ollama":
        llm_provider = OllamaLLMProvider(model=model or "llama2")
    else:
        raise ValueError(f"Unknown provider: {provider}")

    # Generate query
    try:
        query = await llm_provider.generate_search_query(jd_text)
        return query
    except Exception as e:
        # Fallback to mock provider if LLM fails
        print(f"LLM provider {provider} failed: {e}. Falling back to mock provider.")
        fallback_provider = MockLLMProvider()
        return await fallback_provider.generate_search_query(jd_text)
