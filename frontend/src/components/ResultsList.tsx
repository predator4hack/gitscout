import { Candidate } from '../types';
import { CandidateCard } from './CandidateCard';

interface ResultsListProps {
  candidates: Candidate[];
  query: string;
}

export function ResultsList({ candidates, query }: ResultsListProps) {
  if (candidates.length === 0) {
    return (
      <div className="empty-state">
        <p>No candidates found. Try adjusting your job description.</p>
        <p className="query-used">Query used: {query}</p>
      </div>
    );
  }

  return (
    <div className="results-list">
      <div className="results-header">
        <h2>Found {candidates.length} Candidates</h2>
        <p className="query-used">GitHub query: <code>{query}</code></p>
      </div>

      <div className="candidates">
        {candidates.map((candidate) => (
          <CandidateCard key={candidate.login} candidate={candidate} />
        ))}
      </div>
    </div>
  );
}
