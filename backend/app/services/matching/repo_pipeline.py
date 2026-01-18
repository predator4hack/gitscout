import math
import logging
from typing import List, Dict, Any, Tuple
from collections import defaultdict
from ...models.jd_spec import GitScoutJDSpec
from ..github.client import GitHubClient

logger = logging.getLogger("gitscout.pipeline")


async def run_repo_contributors_pipeline(
    spec: GitScoutJDSpec,
    queries: List[str],
    github_client: GitHubClient,
    max_repos: int = 100,
    contributors_per_repo: int = 10
) -> Tuple[List[Dict[str, Any]], Dict[str, float]]:
    """
    Execute the repo-first contributors discovery pipeline

    Pipeline:
    1. Search repos using generated queries
    2. Dedupe and sort repos by stars/activity
    3. Fetch contributors for top repos
    4. Aggregate contributor scores across repos
    5. Hydrate user profiles via batch GraphQL

    Args:
        spec: Structured JD specification
        queries: List of repo search queries
        github_client: GitHub API client
        max_repos: Maximum repos to process
        contributors_per_repo: Contributors to fetch per repo

    Returns:
        Tuple of (enriched_users, contributor_scores)
        - enriched_users: List of hydrated user data
        - contributor_scores: Dict mapping login to contribution-based score seed
    """
    # Step 1: Search repositories
    logger.info(f"Starting repo contributors pipeline with {len(queries)} queries")
    logger.debug(f"Pipeline config: max_repos={max_repos}, contributors_per_repo={contributors_per_repo}")

    all_repos = []
    seen_repos = set()

    for query in queries:
        try:
            results = await github_client.search_repos(query, limit=50)
            for node in results.get("nodes", []):
                if node:
                    parsed = github_client.parse_repo_data(node)
                    if parsed and parsed["nameWithOwner"] not in seen_repos:
                        # Apply filters
                        if parsed["isFork"] and spec.exclude_forks:
                            continue
                        if parsed["isArchived"] and spec.exclude_archived:
                            continue
                        seen_repos.add(parsed["nameWithOwner"])
                        all_repos.append(parsed)
        except Exception as e:
            logger.warning(f"Error searching repos with query '{query}': {e}")
            continue

    logger.info(f"Found {len(all_repos)} unique repos from {len(queries)} queries")

    if not all_repos:
        logger.warning("No repos found, returning empty results")
        return [], {}

    # Sort repos by stars (desc) and recency (desc)
    all_repos.sort(key=lambda r: (r["stargazerCount"], r.get("pushedAt", "")), reverse=True)
    top_repos = all_repos[:max_repos]
    logger.info(f"Processing top {len(top_repos)} repos (sorted by stars/recency)")

    # Step 2: Fetch contributors for each repo
    repos_for_contrib = [
        {"owner": r["owner_login"], "name": r["name"]}
        for r in top_repos
    ]

    contributors_by_repo = await github_client.get_contributors_batch(
        repos_for_contrib,
        per_page=contributors_per_repo
    )

    # Step 3: Aggregate contributors and calculate score seeds
    contributor_scores: Dict[str, float] = defaultdict(float)
    contributor_node_ids: Dict[str, str] = {}

    for repo in top_repos:
        repo_key = repo["nameWithOwner"]
        # Repo weight based on stars (capped at 10)
        repo_weight = min(repo["stargazerCount"] / 100.0, 10.0)

        contributors = contributors_by_repo.get(repo_key, [])
        for rank, contrib in enumerate(contributors):
            login = contrib.get("login")
            node_id = contrib.get("node_id")
            contributions = contrib.get("contributions", 0)

            if login and node_id:
                contributor_node_ids[login] = node_id
                # Score seed: repo_weight * (1 / (rank + 1)) * log(contributions + 1)
                rank_factor = 1.0 / (rank + 1)
                contrib_factor = math.log(contributions + 1)
                contributor_scores[login] += repo_weight * rank_factor * contrib_factor

    logger.info(f"Aggregated {len(contributor_node_ids)} unique contributors from repos")

    if not contributor_node_ids:
        logger.warning("No contributors found, returning empty results")
        return [], {}

    # Step 4: Dedupe and get top contributors
    sorted_contributors = sorted(
        contributor_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )[:50]  # Top 50 contributors

    top_node_ids = [
        contributor_node_ids[login]
        for login, _ in sorted_contributors
        if login in contributor_node_ids
    ]
    logger.debug(f"Top contributor scores: {sorted_contributors[:5]}")

    # Step 5: Hydrate users via GraphQL
    if top_node_ids:
        enriched_users = await github_client.hydrate_users(top_node_ids)
    else:
        enriched_users = []

    # Convert to dict for lookup
    final_scores = dict(sorted_contributors)

    logger.info(f"Pipeline complete: {len(enriched_users)} enriched users returned")
    return enriched_users, final_scores
