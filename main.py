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