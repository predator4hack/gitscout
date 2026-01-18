import re
from .base import LLMProvider


class MockLLMProvider(LLMProvider):
    """Mock LLM provider for testing - uses simple keyword extraction"""

    async def generate_search_query(self, jd_text: str) -> str:
        """Generate search query using keyword extraction"""
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

        return " ".join(query_parts) if query_parts else "repos:>10 followers:>20"
