import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List

from app.models.candidate_skills import (
    CandidateSkillsAnalysis,
    DomainSkill,
    TechnicalSkill,
    BehavioralPattern,
    SkillLevel,
)
from app.services.llm.base import LLMProvider

logger = logging.getLogger("gitscout.skills_analyzer")


# Prompt template for skills analysis
SKILLS_ANALYSIS_PROMPT = """You are an expert technical recruiter analyzing a GitHub developer profile.

Based on the following GitHub user data, generate a comprehensive skills analysis.

USER DATA:
- Username: {login}
- Name: {name}
- Bio: {bio}
- Company: {company}
- Location: {location}
- Followers: {followers}
- Total Contributions (past year): {total_contributions}
- Commits: {total_commits}, PRs: {total_prs}, Issues: {total_issues}, Reviews: {total_reviews}

TOP REPOSITORIES:
{repositories_json}

ANALYSIS REQUIREMENTS:
1. Profile Summary: 2-3 sentences summarizing this developer's background, key strengths, and focus areas. Be specific and highlight unique aspects.
2. Domain Expertise: Identify 2-4 technical domains they specialize in (e.g., "Machine Learning", "Distributed Systems", "Frontend Development", "Developer Tooling")
3. Technical Expertise: List 4-6 technologies/languages with skill levels based on repo activity
4. Behavioral Patterns: Identify 2-4 work patterns (e.g., "Open Source Contributor", "Documentation Writer", "Code Reviewer", "Community Builder")

SKILL LEVEL CRITERIA:
- Expert: Primary language/tech in 3+ repos, significant contributions, maintainer role indicators
- Advanced: Regular use in 2+ repos, substantial commits, meaningful contributions
- Intermediate: Used in 1-2 repos, moderate activity
- Beginner: Minor usage, learning projects

Return valid JSON matching this schema:
{{
  "profile_summary": "string (2-3 sentences, specific to this developer)",
  "domain_expertise": [
    {{"name": "string", "level": "Expert|Advanced|Intermediate|Beginner", "evidence": "string (brief explanation)", "repositories": ["repo1", "repo2"]}}
  ],
  "technical_expertise": [
    {{"name": "string (language/framework/tool)", "level": "Expert|Advanced|Intermediate|Beginner", "years_active": null, "evidence": "string or null", "repositories": ["repo1"]}}
  ],
  "behavioral_patterns": [
    {{"name": "string", "description": "string", "evidence": "string"}}
  ]
}}

IMPORTANT:
- Return ONLY valid JSON, no markdown code blocks or explanation
- Be specific and base analysis on the actual data provided
- Include repository names as evidence where applicable
- Limit domain_expertise to 2-4 items, technical_expertise to 4-6 items, behavioral_patterns to 2-4 items

JSON:"""


class SkillsAnalyzer:
    """
    Service for analyzing candidate skills using LLM.

    Takes raw GitHub user data and generates a structured skills analysis
    including domain expertise, technical skills, and behavioral patterns.
    """

    def __init__(self, llm_provider: LLMProvider):
        self.llm_provider = llm_provider

    def _format_repositories_for_prompt(self, repos: List[Dict[str, Any]]) -> str:
        """Format repository data for the LLM prompt"""
        if not repos:
            return "No repositories available"

        formatted = []
        for repo in repos[:8]:  # Limit to top 8 repos
            languages = ", ".join(repo.get("languages", [])[:5]) or "Unknown"
            topics = ", ".join(repo.get("topics", [])[:5]) or "None"
            stars = repo.get("stargazerCount", 0)
            description = (repo.get("description") or "No description")[:100]

            formatted.append(
                f"- {repo.get('nameWithOwner', 'Unknown')}: "
                f"Stars: {stars}, Languages: [{languages}], Topics: [{topics}], "
                f"Description: {description}"
            )

        return "\n".join(formatted)

    def _build_prompt(self, user_data: Dict[str, Any]) -> str:
        """Build the LLM prompt from user data"""
        repos_json = self._format_repositories_for_prompt(
            user_data.get("repositories", [])
        )

        return SKILLS_ANALYSIS_PROMPT.format(
            login=user_data.get("login", "Unknown"),
            name=user_data.get("name") or "Not provided",
            bio=user_data.get("bio") or "Not provided",
            company=user_data.get("company") or "Not provided",
            location=user_data.get("location") or "Not provided",
            followers=user_data.get("followers", 0),
            total_contributions=user_data.get("totalContributions", 0),
            total_commits=user_data.get("totalCommits", 0),
            total_prs=user_data.get("totalPRs", 0),
            total_issues=user_data.get("totalIssues", 0),
            total_reviews=user_data.get("totalReviews", 0),
            repositories_json=repos_json,
        )

    def _parse_skill_level(self, level_str: str) -> SkillLevel:
        """Parse skill level string to enum"""
        level_map = {
            "expert": SkillLevel.EXPERT,
            "advanced": SkillLevel.ADVANCED,
            "intermediate": SkillLevel.INTERMEDIATE,
            "beginner": SkillLevel.BEGINNER,
        }
        return level_map.get(level_str.lower(), SkillLevel.INTERMEDIATE)

    def _parse_llm_response(
        self, login: str, response_text: str
    ) -> CandidateSkillsAnalysis:
        """Parse LLM JSON response into CandidateSkillsAnalysis"""
        # Clean up potential markdown code blocks
        content = response_text.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.debug(f"Raw response: {response_text[:500]}")
            # Return a minimal analysis on parse failure
            return CandidateSkillsAnalysis(
                login=login,
                generated_at=datetime.utcnow(),
                profile_summary="Unable to generate profile summary.",
                domain_expertise=[],
                technical_expertise=[],
                behavioral_patterns=[],
            )

        # Parse domain expertise
        domain_expertise = []
        for item in data.get("domain_expertise", []):
            try:
                domain_expertise.append(
                    DomainSkill(
                        name=item.get("name", "Unknown"),
                        level=self._parse_skill_level(item.get("level", "Intermediate")),
                        evidence=item.get("evidence", ""),
                        repositories=item.get("repositories", []),
                    )
                )
            except Exception as e:
                logger.warning(f"Failed to parse domain skill: {e}")

        # Parse technical expertise
        technical_expertise = []
        for item in data.get("technical_expertise", []):
            try:
                technical_expertise.append(
                    TechnicalSkill(
                        name=item.get("name", "Unknown"),
                        level=self._parse_skill_level(item.get("level", "Intermediate")),
                        years_active=item.get("years_active"),
                        evidence=item.get("evidence"),
                        repositories=item.get("repositories", []),
                    )
                )
            except Exception as e:
                logger.warning(f"Failed to parse technical skill: {e}")

        # Parse behavioral patterns
        behavioral_patterns = []
        for item in data.get("behavioral_patterns", []):
            try:
                behavioral_patterns.append(
                    BehavioralPattern(
                        name=item.get("name", "Unknown"),
                        description=item.get("description", ""),
                        evidence=item.get("evidence", ""),
                    )
                )
            except Exception as e:
                logger.warning(f"Failed to parse behavioral pattern: {e}")

        return CandidateSkillsAnalysis(
            login=login,
            generated_at=datetime.utcnow(),
            profile_summary=data.get("profile_summary", "Profile summary not available."),
            domain_expertise=domain_expertise,
            technical_expertise=technical_expertise,
            behavioral_patterns=behavioral_patterns,
        )

    async def analyze(self, user_data: Dict[str, Any]) -> CandidateSkillsAnalysis:
        """
        Analyze a candidate's skills based on their GitHub data.

        Args:
            user_data: Parsed GitHub user data (from GitHubClient.parse_user_data)

        Returns:
            CandidateSkillsAnalysis with profile summary and categorized skills
        """
        login = user_data.get("login", "unknown")
        logger.info(f"Analyzing skills for {login}")

        prompt = self._build_prompt(user_data)

        try:
            # Use the LLM provider to generate analysis
            response = await self.llm_provider.generate_skills_analysis(prompt)
            analysis = self._parse_llm_response(login, response)
            logger.info(
                f"Skills analysis complete for {login}: "
                f"{len(analysis.domain_expertise)} domains, "
                f"{len(analysis.technical_expertise)} technical skills, "
                f"{len(analysis.behavioral_patterns)} patterns"
            )
            return analysis

        except Exception as e:
            logger.error(f"Failed to analyze skills for {login}: {e}")
            # Return minimal analysis on error
            return CandidateSkillsAnalysis(
                login=login,
                generated_at=datetime.utcnow(),
                profile_summary="Unable to generate skills analysis at this time.",
                domain_expertise=[],
                technical_expertise=[],
                behavioral_patterns=[],
            )


# Global singleton instance
_skills_analyzer: Optional[SkillsAnalyzer] = None


def get_skills_analyzer(llm_provider: Optional[LLMProvider] = None) -> SkillsAnalyzer:
    """
    Get the global skills analyzer instance.

    Args:
        llm_provider: LLM provider to use. If None, must have been set previously.

    Returns:
        SkillsAnalyzer instance
    """
    global _skills_analyzer
    if _skills_analyzer is None:
        if llm_provider is None:
            raise ValueError("LLM provider must be provided on first call")
        _skills_analyzer = SkillsAnalyzer(llm_provider)
    return _skills_analyzer
