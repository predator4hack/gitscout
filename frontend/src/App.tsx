import { useState, useCallback } from 'react';
import { SearchForm } from './components/SearchForm';
import { ResultsList } from './components/ResultsList';
import { searchCandidates, fetchSearchPage } from './api/search';
import { SearchRequest, Candidate } from './types';
import './App.css';

interface PaginationState {
  sessionId: string | null;
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;
}

function App() {
  // Candidate state - accumulated list
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [query, setQuery] = useState<string>('');
  const [totalFound, setTotalFound] = useState<number>(0);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    sessionId: null,
    currentPage: 0,
    hasMore: false,
    isLoadingMore: false,
  });

  // Initial search handler
  const handleSearch = async (request: SearchRequest) => {
    setLoading(true);
    setError(null);
    setLoadMoreError(null);
    setCandidates([]);
    setPagination({
      sessionId: null,
      currentPage: 0,
      hasMore: false,
      isLoadingMore: false,
    });

    try {
      const response = await searchCandidates(request);

      setCandidates(response.candidates);
      setQuery(response.query);
      setTotalFound(response.totalFound);
      setPagination({
        sessionId: response.sessionId,
        currentPage: response.page,
        hasMore: response.hasMore,
        isLoadingMore: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Load more handler for infinite scroll
  const handleLoadMore = useCallback(async () => {
    // Guard clauses
    if (!pagination.sessionId || !pagination.hasMore || pagination.isLoadingMore) {
      return;
    }

    setPagination(prev => ({ ...prev, isLoadingMore: true }));
    setLoadMoreError(null);

    try {
      const nextPage = pagination.currentPage + 1;
      const response = await fetchSearchPage(pagination.sessionId, nextPage);

      // Append new candidates to existing list
      setCandidates(prev => [...prev, ...response.candidates]);

      setPagination({
        sessionId: response.sessionId,
        currentPage: response.page,
        hasMore: response.hasMore,
        isLoadingMore: false,
      });
    } catch (err) {
      setLoadMoreError(err instanceof Error ? err.message : 'Failed to load more results');
      setPagination(prev => ({ ...prev, isLoadingMore: false }));
    }
  }, [pagination.sessionId, pagination.currentPage, pagination.hasMore, pagination.isLoadingMore]);

  const hasResults = candidates.length > 0;

  return (
    <div className="app">
      <header className="header">
        <h1>GitScout</h1>
        <p>Discover GitHub candidates based on job requirements</p>
      </header>

      <main className="main">
        <SearchForm onSearch={handleSearch} loading={loading} />

        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {hasResults && (
          <ResultsList
            candidates={candidates}
            query={query}
            totalFound={totalFound}
            hasMore={pagination.hasMore}
            isLoadingMore={pagination.isLoadingMore}
            onLoadMore={handleLoadMore}
            loadMoreError={loadMoreError}
          />
        )}
      </main>

      <footer className="footer">
        <p>GitScout MVP - Powered by GitHub GraphQL API</p>
      </footer>
    </div>
  );
}

export default App;
