from typing import Dict, Any
from datetime import datetime, timedelta


def calculate_score(user_data: Dict[str, Any]) -> float:
    """
    Calculate a score (0-100) for a candidate based on their GitHub profile

    Scoring breakdown:
    - Repo count (max 12 points): min(repo_count / 2, 12)
    - Stars (max 18 points): min(total_stars / 50, 18)
    - Contributions (max 18 points): min(total_commits / 100, 18)
    - Language diversity (max 20 points): based on unique languages in repos
    - Recent activity (max 10 points): commits in last 6 months
    - Follower count (max 7 points): min(followers / 100, 7)
    - Contribution seed (max 15 points): from repo contributors pipeline

    Args:
        user_data: Parsed user data dictionary

    Returns:
        Score from 0 to 100
    """
    score = 0.0

    # 1. Repository count (max 12 points)
    repo_count = len(user_data.get("repositories", []))
    score += min(repo_count / 2.0, 12.0)

    # 2. Total stars (max 18 points)
    total_stars = sum(
        repo.get("stargazerCount", 0)
        for repo in user_data.get("repositories", [])
        if not repo.get("isFork", False)  # Exclude forks
    )
    score += min(total_stars / 50.0, 18.0)

    # 3. Contributions (max 18 points)
    total_commits = user_data.get("totalCommits", 0)
    score += min(total_commits / 100.0, 18.0)

    # 4. Language diversity (max 20 points)
    all_languages = set()
    for repo in user_data.get("repositories", []):
        all_languages.update(repo.get("languages", []))

    # More languages = higher score, but with diminishing returns
    lang_count = len(all_languages)
    lang_score = min(lang_count * 2.5, 20.0)
    score += lang_score

    # 5. Recent activity (max 10 points)
    # Check if repos have been pushed to in last 6 months
    six_months_ago = datetime.now() - timedelta(days=180)
    recent_repos = 0

    for repo in user_data.get("repositories", []):
        pushed_at = repo.get("pushedAt")
        if pushed_at:
            try:
                pushed_date = datetime.fromisoformat(pushed_at.replace("Z", "+00:00"))
                if pushed_date.replace(tzinfo=None) > six_months_ago:
                    recent_repos += 1
            except (ValueError, AttributeError):
                pass

    activity_score = min(recent_repos * 2, 10.0)
    score += activity_score

    # 6. Follower count (max 7 points)
    followers = user_data.get("followers", 0)
    score += min(followers / 100.0, 7.0)

    # 7. Contribution seed from repo pipeline (max 15 points)
    # This is added when searching via /search/repos endpoint
    contrib_seed = user_data.get("contrib_score_seed", 0)
    score += min(contrib_seed * 2, 15.0)

    return round(score, 2)
