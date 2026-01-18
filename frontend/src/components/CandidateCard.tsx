import { Candidate } from '../types';

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const scoreColor = candidate.score >= 70 ? '#22c55e' : candidate.score >= 50 ? '#f59e0b' : '#6b7280';

  return (
    <div className="candidate-card">
      <div className="candidate-header">
        <img src={candidate.avatarUrl} alt={candidate.login} className="avatar" />
        <div className="candidate-info">
          <h3>
            <a href={candidate.url} target="_blank" rel="noopener noreferrer">
              {candidate.name || candidate.login}
            </a>
          </h3>
          <p className="login">@{candidate.login}</p>
        </div>
        <div className="score" style={{ backgroundColor: scoreColor }}>
          {candidate.score.toFixed(0)}
        </div>
      </div>

      <p className="match-reason">{candidate.matchReason}</p>

      {candidate.topRepos.length > 0 && (
        <div className="repos">
          <h4>Top Repositories</h4>
          {candidate.topRepos.slice(0, 3).map((repo) => (
            <div key={repo.url} className="repo">
              <div className="repo-header">
                <a href={repo.url} target="_blank" rel="noopener noreferrer" className="repo-name">
                  {repo.nameWithOwner}
                </a>
                <span className="stars">⭐ {repo.stars}</span>
              </div>
              {repo.description && <p className="repo-description">{repo.description}</p>}
              <div className="repo-tags">
                {repo.languages.slice(0, 3).map((lang) => (
                  <span key={lang} className="tag language">
                    {lang}
                  </span>
                ))}
                {repo.topics.slice(0, 3).map((topic) => (
                  <span key={topic} className="tag topic">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
