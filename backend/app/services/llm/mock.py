import re
import logging
from typing import Dict, Any
from .base import LLMProvider

logger = logging.getLogger("gitscout.llm.mock")


class MockLLMProvider(LLMProvider):
    """Mock LLM provider for testing - uses simple keyword extraction"""

    async def generate_search_query(self, jd_text: str) -> str:
        """Generate search query using keyword extraction"""
        logger.info("Generating search query using mock provider (keyword extraction)")
        logger.debug(f"JD text length: {len(jd_text)} chars")

        jd_lower = jd_text.lower()

        # Extract programming languages
        languages = []
        common_langs = ['python', 'javascript', 'typescript', 'java', 'go', 'rust',
                       'c++', 'ruby', 'php', 'swift', 'kotlin', 'scala']

        for lang in common_langs:
            if lang in jd_lower:
                languages.append(f"language:{lang}")

        # Extract tech keywords
        tech_keywords = []
        tech_terms = ['machine learning', 'deep learning', 'ai', 'data science',
                     'distributed systems', 'kubernetes', 'docker', 'react', 'vue',
                     'angular', 'node.js', 'django', 'flask', 'tensorflow', 'pytorch']

        for term in tech_terms:
            if term in jd_lower:
                tech_keywords.append(term.replace(' ', '+'))

        # Build query
        query_parts = []

        # Add languages
        if languages:
            query_parts.extend(languages[:2])  # Limit to 2 languages

        # Add tech keywords
        if tech_keywords:
            query_parts.extend(tech_keywords[:2])  # Limit to 2 keywords

        # Add minimum requirements
        query_parts.append("repos:>5")
        query_parts.append("followers:>10")

        query = " ".join(query_parts) if query_parts else "repos:>10 followers:>20"
        logger.info(f"Generated search query: {query}")
        return query

    async def generate_jd_spec(self, jd_text: str) -> Dict[str, Any]:
        """Generate JD spec using simple keyword extraction"""
        logger.info("Generating JD spec using mock provider (keyword extraction)")
        logger.debug(f"JD text length: {len(jd_text)} chars")

        jd_lower = jd_text.lower()

        # Extract languages
        languages = []
        lang_map = {
            'python': 'Python', 'javascript': 'JavaScript', 'typescript': 'TypeScript',
            'java': 'Java', 'go': 'Go', 'golang': 'Go', 'rust': 'Rust',
            'c++': 'C++', 'ruby': 'Ruby', 'php': 'PHP', 'swift': 'Swift',
            'kotlin': 'Kotlin', 'scala': 'Scala'
        }
        for key, value in lang_map.items():
            if key in jd_lower and value not in languages:
                languages.append(value)

        # Extract domains
        domains = []
        domain_keywords = {
            'machine learning': 'machine-learning', 'ml': 'machine-learning',
            'distributed systems': 'distributed-systems', 'backend': 'backend',
            'frontend': 'frontend', 'full stack': 'fullstack', 'devops': 'devops',
            'data science': 'data-science', 'deep learning': 'deep-learning',
            'web development': 'web-development', 'mobile': 'mobile',
            'cloud': 'cloud-computing', 'microservices': 'microservices'
        }
        for key, value in domain_keywords.items():
            if key in jd_lower and value not in domains:
                domains.append(value)

        # Extract core keywords
        core_keywords = []
        keyword_list = ['kubernetes', 'docker', 'kafka', 'grpc', 'ray', 'spark',
                        'tensorflow', 'pytorch', 'react', 'vue', 'angular',
                        'django', 'fastapi', 'flask', 'aws', 'gcp', 'azure',
                        'postgres', 'mongodb', 'redis', 'elasticsearch',
                        'graphql', 'rest', 'airflow', 'celery']
        for kw in keyword_list:
            if kw in jd_lower and kw not in core_keywords:
                core_keywords.append(kw)

        # If we have languages but no keywords/domains, add generic defaults
        if languages and not core_keywords and not domains:
            core_keywords = ["api", "library", "framework", "cli", "sdk"]

        # Extract nice-to-have keywords (less common)
        nice_keywords = []
        nice_list = ['terraform', 'ansible', 'jenkins', 'gitlab', 'prometheus',
                     'grafana', 'nginx', 'rabbitmq', 'consul', 'vault']
        for kw in nice_list:
            if kw in jd_lower and kw not in nice_keywords:
                nice_keywords.append(kw)

        # Determine seniority
        is_senior = any(term in jd_lower for term in ['senior', 'staff', 'principal', 'lead', '5+ years', '7+ years', '10+ years'])

        # Extract location hint
        location_hint = None
        location_patterns = ['remote', 'san francisco', 'new york', 'london', 'berlin', 'seattle', 'austin']
        for loc in location_patterns:
            if loc in jd_lower:
                location_hint = loc if loc != 'remote' else None
                break

        spec = {
            "role_title": None,
            "languages": languages[:3],
            "core_domains": domains[:3],
            "core_keywords": core_keywords[:8],
            "nice_keywords": nice_keywords[:5],
            "recency_days": 365,
            "min_repo_stars": 50 if is_senior else 20,
            "exclude_forks": True,
            "exclude_archived": True,
            "min_followers": 10 if is_senior else 0,
            "location_hint": location_hint,
            "max_repo_queries": 8,
            "max_repos_per_query": 20
        }
        logger.info(f"Generated JD spec: languages={spec['languages']}, domains={spec['core_domains']}, keywords={spec['core_keywords']}")
        return spec
