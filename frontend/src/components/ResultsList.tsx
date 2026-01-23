import { Candidate } from '../types';
import { CandidateCard } from './CandidateCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

interface ResultsListProps {
  candidates: Candidate[];
  query: string;
  totalFound: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  loadMoreError: string | null;
}

export function ResultsList({
  candidates,
  query,
  totalFound,
  hasMore,
  isLoadingMore,
  onLoadMore,
  loadMoreError
}: ResultsListProps) {
  const { sentinelRef } = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading: isLoadingMore,
    threshold: 200,
  });

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
        <h2>
          Showing {candidates.length} of {totalFound} Candidates
        </h2>
        <p className="query-used">GitHub query: <code>{query}</code></p>
      </div>

      <div className="candidates">
        {candidates.map((candidate) => (
          <CandidateCard key={candidate.login} candidate={candidate} />
        ))}
      </div>

      {/* Sentinel element for intersection observer - always rendered so ref is available */}
      <div ref={sentinelRef} className="load-more-sentinel" style={{ display: hasMore ? 'flex' : 'none' }}>
        {isLoadingMore && (
          <div className="loading-more">
            <div className="loading-spinner"></div>
            <span>Loading more candidates...</span>
          </div>
        )}
      </div>

      {/* Error state for load more */}
      {loadMoreError && (
        <div className="load-more-error">
          <p>Error loading more results: {loadMoreError}</p>
          <button onClick={onLoadMore} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {/* End of results indicator */}
      {!hasMore && candidates.length > 0 && (
        <div className="end-of-results">
          <p>All {totalFound} candidates loaded</p>
        </div>
      )}
    </div>
  );
}
