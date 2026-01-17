# GitScout: GitHub API Implementation Strategy

## Executive Summary

After analyzing GitHub's REST and GraphQL APIs, I've identified the optimal approach for building GitScout. The key insight is that **you'll need to combine multiple API endpoints strategically** because GitHub doesn't provide a single "search by skills" endpoint. Instead, you'll build an intelligent query system that uses search filters + deep analysis.

---

## 1. Core API Capabilities Overview

### A. REST API - Search Endpoints

GitHub's REST API provides powerful search capabilities with specific qualifiers:

**Base URL:** `https://api.github.com`

**Key Search Endpoints:**

-   `/search/users` - Find users by various criteria
-   `/search/repositories` - Find repos by language, stars, etc.
-   `/search/code` - Search within code files

**Rate Limits:**

-   Authenticated: 5,000 requests/hour
-   Unauthenticated: 60 requests/hour
-   Search API: 30 requests/minute (authenticated)
-   **Important:** Search results limited to 1,000 results max

### B. GraphQL API - Advanced Queries

**Endpoint:** `https://api.github.com/graphql`

**Key Advantages:**

-   Single request for multiple data points
-   Better for fetching user contribution details
-   More efficient for complex queries

**Key Limitation:**

-   Contribution data only shows **public repos** unless you have user's token
-   ContributionsCollection only includes commits merged to default branch

---

## 2. Recommended Implementation Strategy

### Phase 1: User Discovery (Primary Filtering)

Use **REST Search API** to find candidate users based on criteria:

#### API: `/search/users`

**Available Qualifiers:**

```
language:LANGUAGE       - Filter by languages in their repos
location:LOCATION       - Filter by location
followers:>N            - Minimum followers
repos:>N                - Minimum number of repos
created:DATE            - Account creation date
type:user               - Exclude organizations
```

**Example Query for "Python ML Engineer":**

```bash
GET https://api.github.com/search/users?q=language:python+location:san-francisco+followers:>50+repos:>10

# More advanced
GET https://api.github.com/search/users?q=machine+learning+language:python+language:tensorflow+repos:>20+followers:>100
```

**Response Structure:**

```json
{
    "total_count": 150,
    "incomplete_results": false,
    "items": [
        {
            "login": "johndoe",
            "id": 12345,
            "avatar_url": "...",
            "url": "https://api.github.com/users/johndoe",
            "followers_url": "...",
            "repos_url": "...",
            "type": "User",
            "score": 123.45
        }
    ]
}
```

**Key Insight:** The user search gives you a "score" field which is GitHub's relevance ranking - this is valuable!

### Phase 2: Deep Profile Analysis (Secondary Scoring)

For each candidate from Phase 1, gather detailed information:

#### 2.1 Get User's Repositories

**API:** `GET /users/{username}/repos`

**Query Parameters:**

```
?type=owner           # Only repos they own
&sort=updated         # or 'pushed', 'created', 'full_name'
&direction=desc
&per_page=100
```

**What You Get:**

```json
{
    "name": "ml-project",
    "full_name": "johndoe/ml-project",
    "description": "Machine learning project for...",
    "language": "Python",
    "stargazers_count": 150,
    "watchers_count": 150,
    "forks_count": 25,
    "created_at": "2023-01-15T10:30:00Z",
    "updated_at": "2024-01-10T15:45:00Z",
    "pushed_at": "2024-01-10T15:45:00Z",
    "size": 1024,
    "topics": ["machine-learning", "pytorch", "nlp"],
    "has_issues": true,
    "has_projects": true,
    "has_wiki": true
}
```

**Valuable Fields for Scoring:**

-   `stargazers_count` - Project popularity
-   `forks_count` - Community engagement
-   `topics` - Tech stack tags
-   `pushed_at` - Recent activity
-   `language` - Primary language

#### 2.2 Get Repository Language Breakdown

**API:** `GET /repos/{owner}/{repo}/languages`

**Response:**

```json
{
    "Python": 52035,
    "JavaScript": 12500,
    "HTML": 3200,
    "Shell": 1050
}
```

**Usage:** Calculate percentage of each language to verify tech stack alignment.

#### 2.3 Get Repository Statistics

**API:** `GET /repos/{owner}/{repo}/stats/contributors`

**Important:** This is **expensive** to compute - GitHub caches it. First call might return 202 (processing), retry after a few seconds.

**Response:**

```json
[
    {
        "author": {
            "login": "johndoe",
            "id": 12345
        },
        "total": 135, // Total commits
        "weeks": [
            {
                "w": 1367712000, // Week timestamp
                "a": 6898, // Lines added
                "d": 77, // Lines deleted
                "c": 10 // Commits
            }
        ]
    }
]
```

**Usage:**

-   Calculate commit frequency
-   Analyze code volume (additions/deletions)
-   Assess contribution consistency

#### 2.4 Get Commit Activity

**API:** `GET /repos/{owner}/{repo}/stats/commit_activity`

Returns last year of commit activity by week:

```json
[
    {
        "days": [0, 3, 26, 20, 39, 1, 0], // Sun-Sat
        "total": 89,
        "week": 1336280400
    }
]
```

### Phase 3: Advanced Analysis (GraphQL)

For top candidates, use GraphQL to get deeper insights:

#### 3.1 User Contributions Across All Repos

**GraphQL Query:**

```graphql
query ($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
        login
        name
        bio
        company
        location
        email

        # Contribution stats
        contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions

            # Commits by repository
            commitContributionsByRepository(maxRepositories: 100) {
                repository {
                    nameWithOwner
                    primaryLanguage {
                        name
                    }
                    stargazerCount
                    forkCount
                }
                contributions {
                    totalCount
                }
            }

            # Pull requests
            pullRequestContributionsByRepository(maxRepositories: 100) {
                repository {
                    nameWithOwner
                }
                contributions {
                    totalCount
                }
            }
        }

        # Recent repositories
        repositories(
            first: 50
            orderBy: { field: UPDATED_AT, direction: DESC }
        ) {
            totalCount
            nodes {
                name
                description
                primaryLanguage {
                    name
                }
                languages(first: 10) {
                    edges {
                        size
                        node {
                            name
                        }
                    }
                }
                stargazerCount
                forkCount
                updatedAt
            }
        }
    }
}
```

**Variables:**

```json
{
    "username": "johndoe",
    "from": "2023-01-01T00:00:00Z",
    "to": "2024-12-31T23:59:59Z"
}
```

This single query gives you:

-   Total contributions across all public repos
-   Breakdown by repository
-   Language distribution
-   Repository popularity metrics

---

## 3. Scoring Algorithm Design

Based on the data available, here's a comprehensive scoring system:

### 3.1 Primary Signals (70% weight)

**Tech Stack Match (30 points)**

```python
def calculate_tech_stack_score(user_repos, required_techs):
    """
    required_techs = ["Python", "TensorFlow", "Docker", "Kubernetes"]
    """
    tech_scores = {}

    for repo in user_repos:
        # Get language breakdown
        languages = get_repo_languages(repo)

        for tech in required_techs:
            if tech in languages or tech in repo.topics:
                # Weight by bytes of code + stars
                bytes_score = languages.get(tech, 0) / 1000
                star_multiplier = math.log(repo.stars + 1)
                tech_scores[tech] = tech_scores.get(tech, 0) + (bytes_score * star_multiplier)

    # Normalize to 0-30
    matched_techs = len([t for t in required_techs if tech_scores.get(t, 0) > 0])
    return (matched_techs / len(required_techs)) * 30
```

**Contribution Volume (20 points)**

```python
def calculate_contribution_score(graphql_data):
    """
    Based on commits, PRs, reviews in last year
    """
    total_commits = graphql_data['totalCommitContributions']
    total_prs = graphql_data['totalPullRequestContributions']
    total_reviews = graphql_data['totalPullRequestReviewContributions']

    # Weighted scoring
    score = (
        min(total_commits / 500, 1.0) * 10 +  # Cap at 500 commits
        min(total_prs / 100, 1.0) * 6 +        # Cap at 100 PRs
        min(total_reviews / 50, 1.0) * 4       # Cap at 50 reviews
    )

    return score
```

**Contribution Consistency (20 points)**

```python
def calculate_consistency_score(commit_activity_data):
    """
    Reward regular, sustained activity over sporadic bursts
    """
    # Get weekly commit counts for last 52 weeks
    weekly_commits = [week['total'] for week in commit_activity_data]

    # Calculate metrics
    active_weeks = sum(1 for w in weekly_commits if w > 0)
    consistency_ratio = active_weeks / 52

    # Standard deviation (lower is more consistent)
    std_dev = statistics.stdev(weekly_commits)
    consistency_score = 1 / (1 + std_dev/10)  # Normalize

    return (consistency_ratio * 0.6 + consistency_score * 0.4) * 20
```

### 3.2 Secondary Signals (30% weight)

**Project Quality (15 points)**

```python
def calculate_project_quality(repos):
    """
    Based on stars, forks, and maintenance
    """
    quality_scores = []

    for repo in repos[:10]:  # Top 10 repos
        # Star score (logarithmic to avoid skew)
        star_score = math.log(repo.stars + 1) / math.log(1000)

        # Fork ratio (indicates useful code)
        fork_ratio = repo.forks / (repo.stars + 1)

        # Recency (recently updated = maintained)
        days_since_update = (datetime.now() - repo.updated_at).days
        recency_score = max(0, 1 - days_since_update/365)

        repo_score = (star_score * 0.5 + fork_ratio * 0.2 + recency_score * 0.3)
        quality_scores.append(repo_score)

    return (sum(quality_scores) / len(quality_scores)) * 15 if quality_scores else 0
```

**Community Engagement (10 points)**

```python
def calculate_engagement_score(user_data):
    """
    Followers, following ratio, bio quality
    """
    followers = user_data.get('followers', 0)
    following = user_data.get('following', 0)

    # Follower score (logarithmic)
    follower_score = min(math.log(followers + 1) / math.log(1000), 1.0) * 6

    # Avoid follow-spam accounts
    ratio_penalty = 0 if following > followers * 3 else 1

    # Profile completeness
    completeness = sum([
        bool(user_data.get('bio')),
        bool(user_data.get('company')),
        bool(user_data.get('location')),
        bool(user_data.get('email')),
    ]) / 4 * 4

    return (follower_score * ratio_penalty) + completeness
```

**Experience Level (5 points)**

```python
def calculate_experience_score(user_data, repos):
    """
    Account age + repository count
    """
    # Account age
    account_age_years = (datetime.now() - user_data['created_at']).days / 365
    age_score = min(account_age_years / 5, 1.0) * 3  # Cap at 5 years

    # Repository diversity
    repo_count = len(repos)
    repo_score = min(repo_count / 50, 1.0) * 2  # Cap at 50 repos

    return age_score + repo_score
```

---

## 4. Implementation Architecture

### 4.1 Data Flow

```
Job Description Input
        ↓
Extract Keywords & Skills (NLP/LLM)
        ↓
Generate Search Queries
        ↓
┌───────────────────────────────┐
│   Phase 1: User Discovery     │
│   - REST /search/users        │
│   - Multiple queries          │
│   - Get ~100-500 candidates   │
└───────────────────────────────┘
        ↓
┌───────────────────────────────┐
│   Phase 2: Profile Scraping   │
│   - GET /users/{user}/repos   │
│   - GET /repos/.../languages  │
│   - Calculate basic scores    │
│   - Filter to top ~50         │
└───────────────────────────────┘
        ↓
┌───────────────────────────────┐
│  Phase 3: Deep Analysis       │
│  - GraphQL contributions      │
│  - GET /repos/.../stats       │
│  - Calculate final scores     │
│  - Rank top 20-30             │
└───────────────────────────────┘
        ↓
Display Results with Insights
```

### 4.2 Search Query Generation

For job description: "Python ML engineer with experience in distributed systems"

**Extract:**

-   Primary Languages: Python
-   Frameworks/Tools: TensorFlow, PyTorch, Scikit-learn
-   Domain: Machine Learning, Distributed Systems
-   Secondary: Kubernetes, Docker, Apache Spark

**Generate Multiple Queries:**

```python
queries = [
    # Primary tech stack
    "language:python machine learning repos:>10 followers:>20",

    # Specific frameworks
    "tensorflow pytorch language:python repos:>5",

    # Distributed systems focus
    "distributed systems language:python kafka spark repos:>5",

    # Combined
    "language:python+in:bio machine+learning distributed+systems"
]
```

**Union the results** and deduplicate by user ID.

### 4.3 Optimization Strategies

**Caching:**

```python
# Cache user profiles for 24 hours
cache_key = f"user:{username}:profile"
if cached := redis.get(cache_key):
    return cached

data = fetch_user_profile(username)
redis.setex(cache_key, 86400, data)
```

**Rate Limiting:**

```python
from ratelimit import limits, sleep_and_retry

@sleep_and_retry
@limits(calls=30, period=60)  # 30 calls per minute
def search_users(query):
    return requests.get(f"{API_BASE}/search/users?q={query}")

@sleep_and_retry
@limits(calls=5000, period=3600)  # 5000 per hour
def get_user_repos(username):
    return requests.get(f"{API_BASE}/users/{username}/repos")
```

**Parallel Processing:**

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def analyze_candidates(usernames):
    results = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        # Submit all tasks
        future_to_user = {
            executor.submit(analyze_user, username): username
            for username in usernames
        }

        # Collect results as they complete
        for future in as_completed(future_to_user):
            username = future_to_user[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                logger.error(f"Error analyzing {username}: {e}")

    return results
```

---

## 5. Key Limitations & Workarounds

### Limitation 1: Search Results Limited to 1,000

**Problem:** GitHub search only returns max 1,000 results per query.

**Workaround:**

-   Generate multiple specific queries
-   Use location filters to partition results
-   Use follower count ranges: `followers:50..100`, `followers:100..500`
-   Search by date ranges: `created:2020-01-01..2022-01-01`

### Limitation 2: No Direct "Contribution Count" Search

**Problem:** Can't search users by total commits or contributions.

**Workaround:**

-   Use `followers:>N` as proxy (more active users tend to have more followers)
-   Use `repos:>N` to find prolific users
-   Rely on two-phase approach: broad search → detailed filtering

### Limitation 3: Private Contributions Hidden

**Problem:** GraphQL API only shows public contributions for other users.

**Workaround:**

-   Focus on public work (which is what matters for recruiting anyway)
-   Note in UI: "Based on public contributions only"
-   Use repo counts and activity as proxy

### Limitation 4: Rate Limits

**Problem:** Search API limited to 30 req/min, general API to 5000/hour.

**Workaround:**

-   Implement aggressive caching
-   Use GraphQL for batch queries
-   Process in background jobs for large searches
-   Consider GitHub App installation for higher limits

### Limitation 5: Code Search Requires Scope

**Problem:** Code search must include `user:` or `repo:` or `org:`.

**Workaround:**

-   Don't rely on code search for initial discovery
-   Use it for verification: "Does user X have experience with library Y?"
-   Example: `language:python tensorflow user:johndoe`

---

## 6. Example Implementation (Python)

```python
import requests
import time
from typing import List, Dict
import math
from datetime import datetime, timedelta

class GitScout:
    def __init__(self, github_token: str):
        self.token = github_token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'token {github_token}',
            'Accept': 'application/vnd.github.v3+json'
        })

    def search_candidates(self, job_description: str) -> List[Dict]:
        """
        Main entry point: search for candidates based on JD
        """
        # Step 1: Extract skills from JD (use LLM or keyword extraction)
        skills = self.extract_skills(job_description)

        # Step 2: Generate search queries
        queries = self.generate_queries(skills)

        # Step 3: Search users
        candidates = set()
        for query in queries:
            users = self.search_users(query)
            candidates.update(user['login'] for user in users)

        # Step 4: Score candidates
        scored = []
        for username in candidates:
            try:
                score_data = self.score_candidate(username, skills)
                scored.append(score_data)
            except Exception as e:
                print(f"Error scoring {username}: {e}")
                continue

        # Step 5: Rank and return top N
        scored.sort(key=lambda x: x['total_score'], reverse=True)
        return scored[:30]

    def search_users(self, query: str, max_results: int = 100) -> List[Dict]:
        """
        Search GitHub users with query
        """
        results = []
        page = 1
        per_page = 100

        while len(results) < max_results:
            url = f"https://api.github.com/search/users"
            params = {
                'q': query,
                'per_page': per_page,
                'page': page
            }

            resp = self.session.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

            results.extend(data['items'])

            if len(data['items']) < per_page:
                break  # No more results

            page += 1
            time.sleep(2)  # Rate limiting

        return results[:max_results]

    def score_candidate(self, username: str, required_skills: Dict) -> Dict:
        """
        Deep analysis and scoring of a candidate
        """
        # Get user profile
        user = self.get_user(username)

        # Get repositories
        repos = self.get_user_repos(username, max_repos=50)

        # Get language breakdown for top repos
        languages = self.analyze_languages(repos[:10])

        # Get contribution stats via GraphQL
        contributions = self.get_contribution_stats(username)

        # Calculate scores
        scores = {
            'tech_stack': self.score_tech_stack(languages, repos, required_skills),
            'contribution_volume': self.score_contributions(contributions),
            'project_quality': self.score_project_quality(repos),
            'consistency': self.score_consistency(username, repos),
            'engagement': self.score_engagement(user),
            'experience': self.score_experience(user, repos)
        }

        total = sum(scores.values())

        return {
            'username': username,
            'name': user.get('name'),
            'avatar_url': user.get('avatar_url'),
            'location': user.get('location'),
            'bio': user.get('bio'),
            'total_score': total,
            'scores': scores,
            'top_repos': repos[:5],
            'languages': languages,
            'contribution_stats': contributions
        }

    def get_user(self, username: str) -> Dict:
        """Get user profile"""
        resp = self.session.get(f"https://api.github.com/users/{username}")
        resp.raise_for_status()
        return resp.json()

    def get_user_repos(self, username: str, max_repos: int = 100) -> List[Dict]:
        """Get user's repositories"""
        repos = []
        page = 1

        while len(repos) < max_repos:
            resp = self.session.get(
                f"https://api.github.com/users/{username}/repos",
                params={
                    'type': 'owner',
                    'sort': 'updated',
                    'per_page': 100,
                    'page': page
                }
            )
            resp.raise_for_status()
            data = resp.json()

            repos.extend(data)

            if len(data) < 100:
                break

            page += 1

        return repos[:max_repos]

    def analyze_languages(self, repos: List[Dict]) -> Dict[str, int]:
        """Get language breakdown across repos"""
        total_languages = {}

        for repo in repos:
            try:
                resp = self.session.get(
                    f"https://api.github.com/repos/{repo['full_name']}/languages"
                )
                resp.raise_for_status()
                languages = resp.json()

                for lang, bytes_count in languages.items():
                    total_languages[lang] = total_languages.get(lang, 0) + bytes_count

                time.sleep(0.5)  # Rate limiting
            except:
                continue

        return total_languages

    def get_contribution_stats(self, username: str) -> Dict:
        """Get contribution stats via GraphQL"""
        query = """
        query($username: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $username) {
            contributionsCollection(from: $from, to: $to) {
              totalCommitContributions
              totalIssueContributions
              totalPullRequestContributions
              totalPullRequestReviewContributions
            }
          }
        }
        """

        to_date = datetime.now()
        from_date = to_date - timedelta(days=365)

        variables = {
            'username': username,
            'from': from_date.isoformat(),
            'to': to_date.isoformat()
        }

        resp = self.session.post(
            'https://api.github.com/graphql',
            json={'query': query, 'variables': variables}
        )
        resp.raise_for_status()

        return resp.json()['data']['user']['contributionsCollection']

    def score_tech_stack(self, languages: Dict, repos: List[Dict],
                         required_skills: Dict) -> float:
        """Score based on tech stack match (0-30 points)"""
        required_langs = required_skills.get('languages', [])
        required_frameworks = required_skills.get('frameworks', [])

        # Language match
        lang_score = 0
        total_bytes = sum(languages.values())

        for lang in required_langs:
            if lang in languages:
                percentage = languages[lang] / total_bytes
                lang_score += percentage * 20

        # Framework/topic match
        framework_score = 0
        for repo in repos:
            topics = repo.get('topics', [])
            for framework in required_frameworks:
                if framework.lower() in [t.lower() for t in topics]:
                    # Weight by stars
                    framework_score += math.log(repo['stargazers_count'] + 1)

        framework_score = min(framework_score / 10, 10)  # Cap at 10

        return min(lang_score + framework_score, 30)

    def score_contributions(self, contrib_stats: Dict) -> float:
        """Score based on contribution volume (0-20 points)"""
        commits = contrib_stats.get('totalCommitContributions', 0)
        prs = contrib_stats.get('totalPullRequestContributions', 0)
        reviews = contrib_stats.get('totalPullRequestReviewContributions', 0)

        commit_score = min(commits / 500, 1.0) * 10
        pr_score = min(prs / 100, 1.0) * 6
        review_score = min(reviews / 50, 1.0) * 4

        return commit_score + pr_score + review_score

    def score_project_quality(self, repos: List[Dict]) -> float:
        """Score based on project quality (0-15 points)"""
        if not repos:
            return 0

        scores = []
        for repo in repos[:10]:
            stars = repo['stargazers_count']
            forks = repo['forks_count']

            # Logarithmic star score
            star_score = math.log(stars + 1) / math.log(1000)

            # Fork ratio
            fork_ratio = forks / (stars + 1)

            # Recency
            updated = datetime.strptime(repo['updated_at'], '%Y-%m-%dT%H:%M:%SZ')
            days_old = (datetime.now() - updated).days
            recency = max(0, 1 - days_old / 365)

            repo_score = (star_score * 0.5 + fork_ratio * 0.2 + recency * 0.3)
            scores.append(repo_score)

        return (sum(scores) / len(scores)) * 15

    def score_consistency(self, username: str, repos: List[Dict]) -> float:
        """Score based on contribution consistency (0-20 points)"""
        # Simplified: check push dates across repos
        if not repos:
            return 0

        push_dates = []
        for repo in repos:
            if repo['pushed_at']:
                push_dates.append(
                    datetime.strptime(repo['pushed_at'], '%Y-%m-%dT%H:%M:%SZ')
                )

        if not push_dates:
            return 0

        # Count repos updated in last 90 days
        recent_cutoff = datetime.now() - timedelta(days=90)
        recent_activity = sum(1 for d in push_dates if d > recent_cutoff)

        return min(recent_activity / 5, 1.0) * 20

    def score_engagement(self, user: Dict) -> float:
        """Score based on community engagement (0-10 points)"""
        followers = user.get('followers', 0)

        # Follower score (logarithmic)
        follower_score = min(math.log(followers + 1) / math.log(1000), 1.0) * 6

        # Profile completeness
        completeness = sum([
            bool(user.get('bio')),
            bool(user.get('company')),
            bool(user.get('location')),
            bool(user.get('email')),
        ]) / 4 * 4

        return follower_score + completeness

    def score_experience(self, user: Dict, repos: List[Dict]) -> float:
        """Score based on experience (0-5 points)"""
        # Account age
        created = datetime.strptime(user['created_at'], '%Y-%m-%dT%H:%M:%SZ')
        years = (datetime.now() - created).days / 365
        age_score = min(years / 5, 1.0) * 3

        # Repository count
        repo_score = min(len(repos) / 50, 1.0) * 2

        return age_score + repo_score

    def extract_skills(self, job_description: str) -> Dict:
        """
        Extract skills from job description
        (Simplified - use NLP/LLM in production)
        """
        # This would use an LLM or NLP in production
        # For now, simple keyword matching

        languages = []
        frameworks = []

        jd_lower = job_description.lower()

        # Detect languages
        lang_keywords = {
            'python': 'Python',
            'java': 'Java',
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'go': 'Go',
            'rust': 'Rust',
            'c++': 'C++',
        }

        for keyword, lang in lang_keywords.items():
            if keyword in jd_lower:
                languages.append(lang)

        # Detect frameworks
        framework_keywords = [
            'tensorflow', 'pytorch', 'keras', 'scikit-learn',
            'react', 'vue', 'angular', 'django', 'flask',
            'kubernetes', 'docker', 'spark', 'kafka'
        ]

        for fw in framework_keywords:
            if fw in jd_lower:
                frameworks.append(fw)

        return {
            'languages': languages,
            'frameworks': frameworks
        }

    def generate_queries(self, skills: Dict) -> List[str]:
        """Generate search queries from extracted skills"""
        queries = []

        languages = skills.get('languages', [])
        frameworks = skills.get('frameworks', [])

        # Primary language query
        if languages:
            lang_query = '+'.join(f'language:{lang.lower()}' for lang in languages[:2])
            queries.append(f"{lang_query} repos:>10 followers:>20")

        # Framework queries
        for framework in frameworks[:3]:
            queries.append(f"{framework} repos:>5")

        # Combined query
        if languages and frameworks:
            queries.append(
                f"language:{languages[0].lower()} {' '.join(frameworks[:2])} repos:>10"
            )

        return queries


# Usage
if __name__ == "__main__":
    scout = GitScout(github_token="YOUR_TOKEN_HERE")

    job_description = """
    We're looking for a Senior Machine Learning Engineer with strong experience
    in Python, TensorFlow, and distributed systems. Experience with Kubernetes
    and Apache Spark is a plus.
    """

    candidates = scout.search_candidates(job_description)

    for candidate in candidates[:10]:
        print(f"\n{candidate['username']} - Score: {candidate['total_score']:.1f}")
        print(f"  Location: {candidate['location']}")
        print(f"  Bio: {candidate['bio']}")
        print(f"  Breakdown: {candidate['scores']}")
```

---

## 7. API Response Time Estimates

Based on typical usage:

**Phase 1 (User Discovery):**

-   3-5 search queries × 2 seconds = **6-10 seconds**

**Phase 2 (Profile Scraping) for 50 candidates:**

-   50 users × (repo fetch + language analysis) = **2-3 minutes**
-   Can parallelize to ~30 seconds with 10 workers

**Phase 3 (Deep Analysis) for top 20:**

-   GraphQL queries + stats = **20-30 seconds**
-   Parallelizable to ~10 seconds

**Total:** ~1-2 minutes for end-to-end search and ranking

**Optimization:** Cache user profiles, run as background job, show incremental results

---

## 8. Advanced Features to Consider

### 8.1 Code Quality Analysis

Use the Code Search API to check for specific patterns:

```python
def check_code_quality_indicators(username, language='python'):
    """
    Check for testing, documentation, CI/CD
    """
    indicators = {
        'has_tests': False,
        'has_ci': False,
        'has_docs': False
    }

    # Search for test files
    query = f"user:{username} language:{language} filename:test"
    results = search_code(query)
    indicators['has_tests'] = results['total_count'] > 0

    # Search for CI config
    query = f"user:{username} filename:.github/workflows"
    results = search_code(query)
    indicators['has_ci'] = results['total_count'] > 0

    return indicators
```

### 8.2 Collaboration Patterns

Analyze PR and issue activity:

```python
def analyze_collaboration(username):
    """
    Check PRs to other repos, issues opened, etc.
    """
    # Search PRs to other repos
    query = f"is:pr author:{username} -user:{username}"
    prs = search_issues(query)

    # Count unique repos contributed to
    unique_repos = set(pr['repository_url'] for pr in prs['items'])

    return {
        'external_prs': prs['total_count'],
        'repos_contributed': len(unique_repos)
    }
```

### 8.3 Domain Expertise Detection

Search README content for domain keywords:

```python
def detect_domain_expertise(username, domain_keywords):
    """
    Search README files for domain-specific terms
    """
    for keyword in domain_keywords:
        query = f"user:{username} {keyword} in:readme"
        results = search_code(query)

        if results['total_count'] > 0:
            return True

    return False
```

---

## 9. Best Practices & Recommendations

### ✅ DO:

1. **Cache aggressively** - User profiles don't change frequently
2. **Use GraphQL for batch operations** - More efficient than multiple REST calls
3. **Implement exponential backoff** for rate limit handling
4. **Show incremental results** - Don't make users wait for complete analysis
5. **Normalize scores** - Make them comparable across different searches
6. **Track API usage** - Monitor rate limits and optimize accordingly
7. **Use webhooks** if building for orgs - Stay updated on repo changes

### ❌ DON'T:

1. **Don't rely solely on followers** - Can be gamed
2. **Don't ignore rate limits** - You'll get blocked
3. **Don't fetch all repos** - Focus on recent/popular ones
4. **Don't make synchronous calls** - Parallelize whenever possible
5. **Don't ignore errors** - Handle API failures gracefully
6. **Don't store excessive data** - Cache only what's needed
7. **Don't violate GitHub ToS** - Respect scraping limits

---

## 10. Future Enhancements

1. **ML-based ranking** - Train a model on successful hires
2. **GitHub Actions analysis** - Check CI/CD sophistication
3. **Code complexity metrics** - Use AST analysis on fetched code
4. **Network analysis** - Find candidates through connections
5. **Time zone alignment** - Factor in for distributed teams
6. **Sentiment analysis** - Analyze communication style in issues/PRs
7. **Real-time updates** - Stream new candidates as they match

---

## Conclusion

GitScout is absolutely feasible with GitHub's API. The key is:

1. **Multi-phase approach**: Broad search → detailed analysis → deep scoring
2. **Smart caching**: Reduce API calls and improve response times
3. **Thoughtful scoring**: Combine multiple signals for accurate ranking
4. **Rate limit respect**: Parallelize smartly, cache aggressively
5. **User experience**: Show progress, handle errors, provide insights

The biggest challenges are rate limits and the lack of a direct "search by contributions" endpoint, but the workarounds (two-phase filtering + GraphQL) are solid.

**Estimated development time**: 2-3 weeks for MVP, 1-2 months for production-ready system.

**Next Steps**:

1. Set up GitHub App for higher rate limits
2. Build the search query generator (LLM-based)
3. Implement the scoring algorithm
4. Create caching layer (Redis)
5. Build the web interface
6. Test with real job descriptions
