from typing import Dict, Any
from datetime import datetime, timedelta


def calculate_score(user_data: Dict[str, Any]) -> float:
    """
    Calculate a score (0-100) for a candidate based on their GitHub profile

    Scoring breakdown:
    - Repo count (max 15 points): min(repo_count / 2, 15)
    - Stars (max 20 points): min(total_stars / 50, 20)
    - Contributions (max 20 points): min(total_commits / 100, 20)
    - Language diversity (max 25 points): based on unique languages in repos
    - Recent activity (max 10 points): commits in last 6 months
    - Follower count (max 10 points): min(followers / 100, 10)

    Args:
        user_data: Parsed user data dictionary

    Returns:
        Score from 0 to 100
    """
    score = 0.0

    # 1. Repository count (max 15 points)
    repo_count = len(user_data.get("repositories", []))
    score += min(repo_count / 2.0, 15.0)

    # 2. Total stars (max 20 points)
    total_stars = sum(
        repo.get("stargazerCount", 0)
        for repo in user_data.get("repositories", [])
        if not repo.get("isFork", False)  # Exclude forks
    )
    score += min(total_stars / 50.0, 20.0)

    # 3. Contributions (max 20 points)
    total_commits = user_data.get("totalCommits", 0)
    score += min(total_commits / 100.0, 20.0)

    # 4. Language diversity (max 25 points)
    all_languages = set()
    for repo in user_data.get("repositories", []):
        all_languages.update(repo.get("languages", []))

    # More languages = higher score, but with diminishing returns
    lang_count = len(all_languages)
    lang_score = min(lang_count * 3, 25.0)
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

    # 6. Follower count (max 10 points)
    followers = user_data.get("followers", 0)
    score += min(followers / 100.0, 10.0)

    return round(score, 2)
