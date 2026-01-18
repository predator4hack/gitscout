import os
import httpx
from typing import List, Dict, Any, Optional
from .queries import SEARCH_USERS_QUERY


class GitHubClient:
    """GitHub GraphQL API client"""

    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN")
        if not self.token:
            raise ValueError("GITHUB_TOKEN environment variable not set")
        self.url = "https://api.github.com/graphql"

    async def search_users(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """
        Search for GitHub users using GraphQL API

        Args:
            query: GitHub search query string
            limit: Maximum number of results to return

        Returns:
            Dictionary containing search results
        """
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        payload = {
            "query": SEARCH_USERS_QUERY,
            "variables": {
                "query": query,
                "first": limit,
                "after": None
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.url,
                json=payload,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()

            data = response.json()

            # Check for GraphQL errors
            if "errors" in data:
                error_messages = [err.get("message", "Unknown error") for err in data["errors"]]
                raise ValueError(f"GitHub GraphQL errors: {', '.join(error_messages)}")

            return data["data"]["search"]

    def parse_user_data(self, user_node: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse raw user data from GraphQL response into a clean format

        Args:
            user_node: Raw user node from GraphQL response

        Returns:
            Cleaned user data dictionary
        """
        # Parse repositories
        repos = []
        if user_node.get("repositories") and user_node["repositories"].get("nodes"):
            for repo in user_node["repositories"]["nodes"]:
                if not repo:
                    continue

                # Extract languages
                languages = []
                if repo.get("primaryLanguage"):
                    languages.append(repo["primaryLanguage"]["name"])

                if repo.get("languages") and repo["languages"].get("edges"):
                    for edge in repo["languages"]["edges"]:
                        lang_name = edge["node"]["name"]
                        if lang_name not in languages:
                            languages.append(lang_name)

                # Extract topics
                topics = []
                if repo.get("repositoryTopics") and repo["repositoryTopics"].get("nodes"):
                    topics = [
                        node["topic"]["name"]
                        for node in repo["repositoryTopics"]["nodes"]
                        if node and node.get("topic")
                    ]

                repos.append({
                    "nameWithOwner": repo.get("nameWithOwner", ""),
                    "url": repo.get("url", ""),
                    "description": repo.get("description"),
                    "stargazerCount": repo.get("stargazerCount", 0),
                    "forkCount": repo.get("forkCount", 0),
                    "isFork": repo.get("isFork", False),
                    "pushedAt": repo.get("pushedAt"),
                    "languages": languages,
                    "topics": topics
                })

        # Parse contributions
        contributions = user_node.get("contributionsCollection", {})

        return {
            "login": user_node.get("login", ""),
            "name": user_node.get("name"),
            "url": user_node.get("url", ""),
            "avatarUrl": user_node.get("avatarUrl", ""),
            "bio": user_node.get("bio"),
            "location": user_node.get("location"),
            "company": user_node.get("company"),
            "followers": user_node.get("followers", {}).get("totalCount", 0),
            "totalContributions": contributions.get("contributionCalendar", {}).get("totalContributions", 0),
            "totalCommits": contributions.get("totalCommitContributions", 0),
            "totalPRs": contributions.get("totalPullRequestContributions", 0),
            "totalIssues": contributions.get("totalIssueContributions", 0),
            "totalReviews": contributions.get("totalPullRequestReviewContributions", 0),
            "repositories": repos
        }
