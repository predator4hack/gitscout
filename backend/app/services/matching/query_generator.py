from ..llm.base import LLMProvider as BaseLLMProvider
from ..llm.mock import MockLLMProvider
from ..llm.gemini import GeminiLLMProvider
from ..llm.groq import GroqLLMProvider
from ..llm.ollama import OllamaLLMProvider
from ...models.jd_spec import GitScoutJDSpec
from typing import Optional, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger("gitscout.query_generator")


def _get_llm_provider(provider: str, model: Optional[str] = None) -> BaseLLMProvider:
    """Get the appropriate LLM provider instance"""
    if provider == "mock":
        return MockLLMProvider()
    elif provider == "gemini":
        return GeminiLLMProvider(model=model or "gemini-pro")
    elif provider == "groq":
        return GroqLLMProvider(model=model or "llama-3.3-70b-versatile")
    elif provider == "ollama":
        return OllamaLLMProvider(model=model or "llama2")
    else:
        raise ValueError(f"Unknown provider: {provider}")


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


async def generate_jd_spec(jd_text: str, provider: str, model: Optional[str] = None) -> GitScoutJDSpec:
    """
    Extract structured JD specification from job description using LLM

    Args:
        jd_text: Job description text
        provider: LLM provider name
        model: Optional model name

    Returns:
        GitScoutJDSpec instance
    """
    llm_provider = _get_llm_provider(provider, model)

    try:
        spec_dict = await llm_provider.generate_jd_spec(jd_text)

        # Check if LLM returned empty critical fields - attempt query rewriting
        if not spec_dict.get('languages') and not spec_dict.get('core_keywords'):
            logger.warning("LLM returned empty languages and keywords, attempting query rewrite")

            # Ask LLM to rewrite the vague query into something more specific
            try:
                rewritten_jd = await llm_provider.rewrite_vague_query(jd_text)
                logger.info(f"Rewritten JD: {rewritten_jd[:200]}...")

                # Re-extract spec from rewritten JD
                spec_dict = await llm_provider.generate_jd_spec(rewritten_jd)
                logger.info(f"After rewrite: languages={spec_dict.get('languages')}, keywords={spec_dict.get('core_keywords')}")
            except Exception as rewrite_error:
                logger.warning(f"Query rewrite failed: {rewrite_error}")

            # If still empty after rewrite, use mock as ultimate fallback
            if not spec_dict.get('languages') and not spec_dict.get('core_keywords'):
                logger.warning("Query rewrite also failed, using mock fallback")
                fallback = MockLLMProvider()
                fallback_spec = await fallback.generate_jd_spec(jd_text)

                # Merge fallback data into spec (only fill empty fields)
                if not spec_dict.get('languages') and fallback_spec.get('languages'):
                    spec_dict['languages'] = fallback_spec['languages']
                if not spec_dict.get('core_domains') and fallback_spec.get('core_domains'):
                    spec_dict['core_domains'] = fallback_spec['core_domains']
                if not spec_dict.get('core_keywords') and fallback_spec.get('core_keywords'):
                    spec_dict['core_keywords'] = fallback_spec['core_keywords']
                if not spec_dict.get('nice_keywords') and fallback_spec.get('nice_keywords'):
                    spec_dict['nice_keywords'] = fallback_spec['nice_keywords']

                logger.info(f"After mock fallback: languages={spec_dict.get('languages')}, keywords={spec_dict.get('core_keywords')}")

        return GitScoutJDSpec(**spec_dict)
    except Exception as e:
        logger.error(f"LLM provider {provider} failed for JD spec: {e}. Falling back to mock.")
        fallback = MockLLMProvider()
        spec_dict = await fallback.generate_jd_spec(jd_text)
        return GitScoutJDSpec(**spec_dict)


def generate_repo_queries(spec: GitScoutJDSpec) -> List[str]:
    """
    Generate GitHub repository search queries from JD spec

    Constraints:
    - Query length limit: 256 characters
    - Boolean ops limit: max 5 AND/OR/NOT
    - Only first 1000 results accessible

    Args:
        spec: GitScoutJDSpec instance

    Returns:
        List of query strings (max spec.max_repo_queries)
    """
    queries = []

    # Calculate recency date
    recency_date = (datetime.now() - timedelta(days=spec.recency_days)).strftime("%Y-%m-%d")

    # Base filters
    base_filters = []
    if spec.min_repo_stars > 0:
        base_filters.append(f"stars:>{spec.min_repo_stars}")
    base_filters.append(f"pushed:>{recency_date}")
    if spec.exclude_forks:
        base_filters.append("fork:false")
    if spec.exclude_archived:
        base_filters.append("archived:false")

    base_filter_str = " ".join(base_filters)

    # Strategy 1: Language + Domain topic queries
    for lang in spec.languages[:3]:
        for domain in spec.core_domains[:2]:
            query = f"language:{lang} topic:{domain} {base_filter_str}"
            if len(query) <= 256 and query not in queries:
                queries.append(query)

    # Strategy 2: Language + Core keywords (with OR, max 3 per query for boolean limit)
    for lang in spec.languages[:3]:
        for i in range(0, min(len(spec.core_keywords), 6), 3):
            keywords = spec.core_keywords[i:i + 3]
            if keywords:
                keyword_str = " OR ".join(keywords)
                query = f"language:{lang} ({keyword_str}) {base_filter_str}"
                if len(query) <= 256 and query not in queries:
                    queries.append(query)

    # Strategy 3: Language + single topic keyword
    # for lang in spec.languages[:2]:
    #     for kw in spec.core_keywords[:4]:
    #         query = f"language:{lang} topic:{kw} {base_filter_str}"
    #         if len(query) <= 256 and query not in queries:
    #             queries.append(query)

    # Strategy 4: Language only (fallback if nothing else)
    if not queries and spec.languages:
        for lang in spec.languages[:2]:
            query = f"language:{lang} {base_filter_str}"
            if len(query) <= 256:
                queries.append(query)

    # Strategy 5: Domain-only queries (when no languages available)
    if not queries and spec.core_domains:
        for domain in spec.core_domains[:3]:
            query = f"topic:{domain} {base_filter_str}"
            if len(query) <= 256 and query not in queries:
                queries.append(query)

    # Strategy 6: Keyword-only queries (when no languages or domains)
    if not queries and spec.core_keywords:
        for i in range(0, min(len(spec.core_keywords), 6), 2):
            keywords = spec.core_keywords[i:i + 2]
            if keywords:
                keyword_str = " ".join(keywords)
                query = f"{keyword_str} {base_filter_str}"
                if len(query) <= 256 and query not in queries:
                    queries.append(query)

    # Strategy 7: Ultimate fallback - generic active repos query
    if not queries:
        logger.warning("All query strategies failed, using ultimate fallback")
        # Search for actively maintained repos with good star count
        query = f"stars:>100 {base_filter_str}"
        if len(query) <= 256:
            queries.append(query)

    # Dedupe and limit
    unique_queries = list(dict.fromkeys(queries))
    return unique_queries[:spec.max_repo_queries]
