import { Icon } from '../../shared/Icon';
import type { DashboardCandidate } from '../../../types/dashboard';

interface TableRowProps {
  candidate: DashboardCandidate;
  onStarToggle: (id: string) => void;
  onCandidateClick?: (candidate: DashboardCandidate) => void;
}

const MAX_VISIBLE_REPOS = 3;

export function TableRow({ candidate, onStarToggle, onCandidateClick }: TableRowProps) {
  const visibleRepos = candidate.repositories.slice(0, MAX_VISIBLE_REPOS);
  const remainingCount = candidate.repositories.length - MAX_VISIBLE_REPOS;

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onCandidateClick) {
      onCandidateClick(candidate);
    }
  };

  return (
    <tr className="dashboard-row-hover group transition-colors">
      {/* Star Cell */}
      <td className="py-4 px-4 text-center">
        <button onClick={() => onStarToggle(candidate.id)}>
          <Icon
            icon={candidate.isStarred ? 'lucide:star' : 'lucide:star'}
            className={`w-3.5 h-3.5 transition-colors cursor-pointer ${
              candidate.isStarred
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gs-text-darker group-hover:text-gs-text-muted'
            }`}
          />
        </button>
      </td>

      {/* Username Cell */}
      <td className="py-4 px-4 align-top">
        <div className="flex items-center gap-3">
          <button
            onClick={handleUsernameClick}
            className="text-gs-text-main font-semibold hover:underline hover:text-gs-purple transition-colors text-left"
          >
            @{candidate.login}
          </button>
        </div>
      </td>

      {/* Repositories Cell */}
      <td className="py-4 px-4 align-top">
        <div className="flex flex-wrap gap-2 max-w-sm">
          {visibleRepos.map((repo) => (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="repo-chip hover:text-gs-text-main transition-colors"
            >
              {repo.name}
            </a>
          ))}
          {remainingCount > 0 && (
            <span className="repo-chip repo-chip-overflow">
              +{remainingCount} more
            </span>
          )}
        </div>
      </td>

      {/* Actions Cell - Contact Links with Priority: Email > LinkedIn > Twitter */}
      <td className="py-4 px-4 align-top">
        <div className="flex flex-col gap-2 items-start">
          {/* Priority 1: Email - show "Reach out" if available, otherwise "Find email" */}
          {candidate.email ? (
            <a
              href={`mailto:${candidate.email}`}
              className="action-btn action-btn-blue"
            >
              <Icon icon="lucide:mail" className="w-3 h-3" />
              Reach out
            </a>
          ) : (
            <button className="action-btn action-btn-yellow">
              Find email
            </button>
          )}

          {/* Priority 2: LinkedIn */}
          {candidate.linkedInUrl && (
            <a
              href={candidate.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn action-btn-gray"
            >
              <Icon icon="lucide:linkedin" className="w-3 h-3" />
              LinkedIn
            </a>
          )}

          {/* Priority 3: Twitter (only show if no LinkedIn) */}
          {candidate.twitterUsername && !candidate.linkedInUrl && (
            <a
              href={`https://twitter.com/${candidate.twitterUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn action-btn-gray"
            >
              <Icon icon="lucide:twitter" className="w-3 h-3" />
              Twitter
            </a>
          )}

          {/* Website link (only if not already used as LinkedIn) */}
          {candidate.websiteUrl && !candidate.linkedInUrl && (
            <a
              href={candidate.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn action-btn-gray"
            >
              <Icon icon="lucide:globe" className="w-3 h-3" />
              Website
            </a>
          )}
        </div>
      </td>

      {/* Location Cell */}
      <td className="py-4 px-4 align-top text-gs-text-muted">
        {candidate.location || '—'}
      </td>

      {/* Description Cell */}
      <td className="py-4 px-4 align-top text-gs-text-muted leading-relaxed">
        {candidate.description}
      </td>

      {/* Followers Cell */}
      <td className="py-4 px-4 align-top text-right pr-6 font-mono text-gs-text-muted">
        {candidate.followers.toLocaleString()}
      </td>

      {/* Score Cell */}
      <td className="py-4 px-4 align-top text-right pr-6 font-mono text-gs-text-muted">
        {candidate.score}
      </td>
    </tr>
  );
}
