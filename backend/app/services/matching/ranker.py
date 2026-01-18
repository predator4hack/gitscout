from typing import List, Dict, Any
from .scorer import calculate_score
from ...models.responses import Candidate, Repository


def generate_match_reason(user_data: Dict[str, Any]) -> str:
    """
    Generate a short explanation of why this candidate matches

    Args:
        user_data: Parsed user data dictionary

    Returns:
        Match reason string
    """
    reasons = []

    # Top languages
    all_languages = set()
    for repo in user_data.get("repositories", []):
        all_languages.update(repo.get("languages", []))

    if all_languages:
        top_langs = list(all_languages)[:3]
        reasons.append(f"Expertise in {', '.join(top_langs)}")

    # Top topics
    all_topics = set()
    for repo in user_data.get("repositories", []):
        all_topics.update(repo.get("topics", []))

    if all_topics:
        top_topics = list(all_topics)[:3]
        reasons.append(f"Experience with {', '.join(top_topics)}")

    # Contributions
    total_commits = user_data.get("totalCommits", 0)
    if total_commits > 100:
        reasons.append(f"{total_commits} contributions")

    # Stars
    total_stars = sum(
        repo.get("stargazerCount", 0)
        for repo in user_data.get("repositories", [])
        if not repo.get("isFork", False)
    )
    if total_stars > 50:
        reasons.append(f"{total_stars} stars earned")

    if not reasons:
        reasons.append("Active GitHub profile")

    return "; ".join(reasons[:3])


def rank_candidates(users: List[Dict[str, Any]], jd_text: str) -> List[Candidate]:
    """
    Rank and score candidates, then convert to response models

    Args:
        users: List of parsed user data dictionaries
        jd_text: Original job description (for context)

    Returns:
        List of Candidate objects sorted by score (highest first)
    """
    candidates = []

    for user_data in users:
        # Calculate score
        score = calculate_score(user_data)

        # Generate match reason
        match_reason = generate_match_reason(user_data)

        # Convert repositories to response model
        top_repos = []
        for repo in user_data.get("repositories", [])[:4]:  # Top 4 repos
            top_repos.append(Repository(
                nameWithOwner=repo.get("nameWithOwner", ""),
                url=repo.get("url", ""),
                description=repo.get("description"),
                stars=repo.get("stargazerCount", 0),
                languages=repo.get("languages", []),
                topics=repo.get("topics", [])
            ))

        # Create candidate
        candidate = Candidate(
            login=user_data.get("login", ""),
            name=user_data.get("name"),
            url=user_data.get("url", ""),
            avatarUrl=user_data.get("avatarUrl", ""),
            score=score,
            topRepos=top_repos,
            matchReason=match_reason
        )

        candidates.append(candidate)

    # Sort by score (highest first)
    candidates.sort(key=lambda c: c.score, reverse=True)

    return candidates
