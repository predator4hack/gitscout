import os
import logging
import random
import httpx
import asyncio
from typing import List, Dict, Any, Optional, Callable, TypeVar, Awaitable
from .queries import SEARCH_USERS_QUERY, SEARCH_REPOS_QUERY, HYDRATE_USERS_QUERY
from ...config import config

logger = logging.getLogger("gitscout.github")

T = TypeVar('T')


async def _retry_request(
    request_func: Callable[[], Awaitable[T]],
    max_retries: int = 3,
    base_delay: float = 1.0,
    retryable_statuses: tuple = (502, 503, 504)
) -> T:
    """
    Execute request with exponential backoff retry for transient errors.

    Args:
        request_func: Async function that makes the HTTP request
        max_retries: Maximum retry attempts
        base_delay: Base delay in seconds (doubles each retry)
        retryable_statuses: HTTP status codes to retry

    Returns:
        The result of request_func on success

    Raises:
        The last exception if all retries fail
    """
    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            return await request_func()
        except httpx.HTTPStatusError as e:
            if e.response.status_code not in retryable_statuses:
                raise
            last_exception = e
            if attempt < max_retries:
                delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                logger.warning(
                    f"Request failed with {e.response.status_code}, "
                    f"retrying in {delay:.1f}s (attempt {attempt + 1}/{max_retries})"
                )
                await asyncio.sleep(delay)
        except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.RemoteProtocolError) as e:
            last_exception = e
            if attempt < max_retries:
                delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                logger.warning(
                    f"Request failed ({type(e).__name__}), retrying in {delay:.1f}s "
                    f"(attempt {attempt + 1}/{max_retries})"
                )
                await asyncio.sleep(delay)

    raise last_exception


class GitHubClient:
    """GitHub GraphQL API client"""

    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN")
        if not self.token:
            raise ValueError("GITHUB_TOKEN environment variable not set")
        self.graphql_url = "https://api.github.com/graphql"
        self.rest_url = "https://api.github.com"

    async def search_users(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """
        Search for GitHub users using GraphQL API

        Args:
            query: GitHub search query string
            limit: Maximum number of results to return

        Returns:
            Dictionary containing search results
        """
        logger.info(f"Searching users with query: {query}")
        logger.debug(f"Search limit: {limit}")

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

        async def make_request():
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.graphql_url,
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()

        data = await _retry_request(make_request)

        # Check for GraphQL errors
        if "errors" in data:
            error_messages = [err.get("message", "Unknown error") for err in data["errors"]]
            logger.error(f"GitHub GraphQL errors: {error_messages}")
            raise ValueError(f"GitHub GraphQL errors: {', '.join(error_messages)}")

        result = data["data"]["search"]
        user_count = result.get("userCount", 0)
        nodes_count = len(result.get("nodes", []))
        logger.info(f"Found {user_count} users, returned {nodes_count} results")
        return result

    async def search_repos(self, query: str, limit: int = 100) -> Dict[str, Any]:
        """
        Search for GitHub repositories using GraphQL API

        Args:
            query: GitHub search query string (e.g., "language:Python topic:ml stars:>20")
            limit: Maximum number of results to return

        Returns:
            Dictionary containing search results
        """
        logger.info(f"Searching repos with query: {query}")
        logger.debug(f"Search limit: {limit}")

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        payload = {
            "query": SEARCH_REPOS_QUERY,
            "variables": {
                "query": query,
                "first": min(limit, 100),  # GitHub max per page
                "after": None
            }
        }

        async def make_request():
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.graphql_url,
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()

        data = await _retry_request(make_request)

        if "errors" in data:
            error_messages = [err.get("message", "Unknown error") for err in data["errors"]]
            logger.error(f"GitHub GraphQL errors: {error_messages}")
            raise ValueError(f"GitHub GraphQL errors: {', '.join(error_messages)}")

        result = data["data"]["search"]
        repo_count = result.get("repositoryCount", 0)
        nodes_count = len(result.get("nodes", []))
        logger.info(f"Found {repo_count} repos, returned {nodes_count} results")
        return result

    async def get_contributors(self, owner: str, repo: str, per_page: int = 10) -> List[Dict[str, Any]]:
        """
        Get repository contributors using REST API

        Args:
            owner: Repository owner login
            repo: Repository name
            per_page: Number of contributors to fetch (default 10)

        Returns:
            List of contributor dictionaries with login, node_id, contributions
        """
        logger.debug(f"Fetching contributors for {owner}/{repo} (limit: {per_page})")

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }

        url = f"{self.rest_url}/repos/{owner}/{repo}/contributors"

        async def make_request():
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers=headers,
                    params={"per_page": per_page},
                    timeout=30.0
                )
                # Don't retry 404s - they're not transient
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                return response.json()

        contributors = await _retry_request(make_request)

        if contributors is None:
            logger.debug(f"Repo {owner}/{repo} not found or no contributors")
            return []  # Repo not found or no contributors
        user_contributors = [
            {
                "login": c.get("login"),
                "node_id": c.get("node_id"),
                "contributions": c.get("contributions", 0)
            }
            for c in contributors
            if c.get("type") == "User"  # Exclude bots
        ]
        logger.debug(f"Found {len(user_contributors)} contributors for {owner}/{repo}")
        return user_contributors

    async def get_contributors_batch(
        self,
        repos: List[Dict[str, str]],
        per_page: int = 10,
        max_concurrent: Optional[int] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Fetch contributors for multiple repos concurrently

        Args:
            repos: List of dicts with 'owner' and 'name' keys
            per_page: Contributors per repo
            max_concurrent: Max concurrent requests

        Returns:
            Dict mapping nameWithOwner to list of contributors
        """
        if max_concurrent is None:
            max_concurrent = config.MAX_CONCURRENT_REQUESTS
        logger.info(f"Fetching contributors for {len(repos)} repos (concurrency: {max_concurrent})")

        semaphore = asyncio.Semaphore(max_concurrent)

        async def fetch_with_limit(owner: str, name: str):
            async with semaphore:
                return await self.get_contributors(owner, name, per_page)

        tasks = []
        repo_keys = []
        for repo in repos:
            owner = repo.get("owner")
            name = repo.get("name")
            if owner and name:
                tasks.append(fetch_with_limit(owner, name))
                repo_keys.append(f"{owner}/{name}")

        results = await asyncio.gather(*tasks, return_exceptions=True)

        contributors_by_repo = {}
        errors_count = 0
        for key, result in zip(repo_keys, results):
            if isinstance(result, Exception):
                contributors_by_repo[key] = []
                errors_count += 1
            else:
                contributors_by_repo[key] = result

        total_contributors = sum(len(c) for c in contributors_by_repo.values())
        logger.info(f"Fetched {total_contributors} total contributors from {len(repos)} repos ({errors_count} errors)")
        return contributors_by_repo

    async def hydrate_users(self, node_ids: List[str], batch_size: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Batch fetch user details using node IDs

        Args:
            node_ids: List of GitHub node IDs
            batch_size: Number of IDs per GraphQL request

        Returns:
            List of user data dictionaries
        """
        if batch_size is None:
            batch_size = config.HYDRATE_BATCH_SIZE
        logger.info(f"Hydrating {len(node_ids)} users in batches of {batch_size}")

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        all_users = []
        batches_count = (len(node_ids) + batch_size - 1) // batch_size

        for i in range(0, len(node_ids), batch_size):
            batch = node_ids[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            logger.debug(f"Processing batch {batch_num}/{batches_count} ({len(batch)} users)")

            payload = {
                "query": HYDRATE_USERS_QUERY,
                "variables": {"ids": batch}
            }

            async def make_request():
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        self.graphql_url,
                        json=payload,
                        headers=headers,
                        timeout=30.0
                    )
                    response.raise_for_status()
                    return response.json()

            data = await _retry_request(make_request)

            if "errors" in data:
                error_messages = [err.get("message", "Unknown error") for err in data["errors"]]
                logger.error(f"GitHub GraphQL errors in hydration: {error_messages}")
                raise ValueError(f"GitHub GraphQL errors: {', '.join(error_messages)}")

            nodes = data.get("data", {}).get("nodes", [])
            # Filter out None nodes (deleted users, orgs, etc.)
            valid_nodes = [n for n in nodes if n is not None]
            all_users.extend(valid_nodes)
            logger.debug(f"Batch {batch_num}: hydrated {len(valid_nodes)} users")

        logger.info(f"Successfully hydrated {len(all_users)} users")
        return all_users

    def parse_repo_data(self, repo_node: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parse raw repository data from GraphQL response

        Args:
            repo_node: Raw repository node from GraphQL

        Returns:
            Cleaned repository data dictionary or None
        """
        if not repo_node:
            return None

        # Extract languages
        languages = []
        if repo_node.get("primaryLanguage"):
            languages.append(repo_node["primaryLanguage"]["name"])

        if repo_node.get("languages") and repo_node["languages"].get("edges"):
            for edge in repo_node["languages"]["edges"]:
                lang_name = edge["node"]["name"]
                if lang_name not in languages:
                    languages.append(lang_name)

        # Extract topics
        topics = []
        if repo_node.get("repositoryTopics") and repo_node["repositoryTopics"].get("nodes"):
            topics = [
                node["topic"]["name"]
                for node in repo_node["repositoryTopics"]["nodes"]
                if node and node.get("topic")
            ]

        return {
            "name": repo_node.get("name", ""),
            "nameWithOwner": repo_node.get("nameWithOwner", ""),
            "url": repo_node.get("url", ""),
            "description": repo_node.get("description"),
            "stargazerCount": repo_node.get("stargazerCount", 0),
            "forkCount": repo_node.get("forkCount", 0),
            "isFork": repo_node.get("isFork", False),
            "isArchived": repo_node.get("isArchived", False),
            "pushedAt": repo_node.get("pushedAt"),
            "owner_login": repo_node.get("owner", {}).get("login", ""),
            "primaryLanguage": repo_node.get("primaryLanguage", {}).get("name") if repo_node.get("primaryLanguage") else None,
            "languages": languages,
            "topics": topics
        }

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
        calendar = contributions.get("contributionCalendar", {})

        # Extract last contribution date from calendar weeks
        last_contribution_date = None
        weeks = calendar.get("weeks", [])
        for week in reversed(weeks):
            for day in reversed(week.get("contributionDays", [])):
                if day.get("contributionCount", 0) > 0:
                    last_contribution_date = day.get("date")
                    break
            if last_contribution_date:
                break

        return {
            "login": user_node.get("login", ""),
            "name": user_node.get("name"),
            "url": user_node.get("url", ""),
            "avatarUrl": user_node.get("avatarUrl", ""),
            "bio": user_node.get("bio"),
            "location": user_node.get("location"),
            "company": user_node.get("company"),
            "email": user_node.get("email"),
            "twitterUsername": user_node.get("twitterUsername"),
            "websiteUrl": user_node.get("websiteUrl"),
            "followers": user_node.get("followers", {}).get("totalCount", 0),
            "totalContributions": calendar.get("totalContributions", 0),
            "totalCommits": contributions.get("totalCommitContributions", 0),
            "totalPRs": contributions.get("totalPullRequestContributions", 0),
            "totalIssues": contributions.get("totalIssueContributions", 0),
            "totalReviews": contributions.get("totalPullRequestReviewContributions", 0),
            "lastContributionDate": last_contribution_date,
            "repositories": repos
        }
