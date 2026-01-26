import { Icon } from '../../shared/Icon';
import type { DashboardCandidate } from '../../../types/dashboard';

interface TableRowProps {
  candidate: DashboardCandidate;
  onStarToggle: (id: string) => void;
}

const MAX_VISIBLE_REPOS = 3;

export function TableRow({ candidate, onStarToggle }: TableRowProps) {
  const visibleRepos = candidate.repositories.slice(0, MAX_VISIBLE_REPOS);
  const remainingCount = candidate.repositories.length - MAX_VISIBLE_REPOS;

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
          <a
            href={candidate.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gs-text-main font-semibold hover:underline"
          >
            @{candidate.login}
          </a>
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

      {/* Actions Cell */}
      <td className="py-4 px-4 align-top">
        <div className="flex flex-col gap-2 items-start">
          {candidate.hasEmail && (
            <button className="action-btn action-btn-blue">
              <Icon icon="lucide:mail" className="w-3 h-3" />
              Reach out
            </button>
          )}
          {!candidate.hasEmail && (
            <button className="action-btn action-btn-yellow">
              Find email
            </button>
          )}
          {candidate.linkedInUrl && (
            <a
              href={candidate.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn action-btn-gray"
            >
              LinkedIn
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
    </tr>
  );
}
