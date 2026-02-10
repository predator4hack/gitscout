import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/shared/Icon';
import { useSearch } from '../contexts/SearchContext';
import { listJobSearches, deleteJobSearch, JobSearchSummary } from '../api/jobSearch';

export function HistoryPage() {
  const [searches, setSearches] = useState<JobSearchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { loadJobSearch } = useSearch();

  // Load searches on mount
  useEffect(() => {
    const loadSearches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await listJobSearches();
        setSearches(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSearches();
  }, []);

  // Handle click to load search
  const handleSelectSearch = async (searchId: string) => {
    try {
      await loadJobSearch(searchId);
      navigate('/dashboard');
    } catch (err) {
      setError(`Failed to load search: ${(err as Error).message}`);
    }
  };

  // Handle delete search
  const handleDeleteSearch = async (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    if (!window.confirm('Are you sure you want to delete this search? This will remove all conversations and data associated with it.')) {
      return;
    }

    try {
      setDeletingId(searchId);
      await deleteJobSearch(searchId);
      setSearches(prev => prev.filter(s => s.search_id !== searchId));
    } catch (err) {
      setError(`Failed to delete search: ${(err as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Truncate job description
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gs-body text-gs-text-main">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/[0.06] flex-shrink-0 bg-gs-body">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-white/[0.06] rounded-md hover:text-gs-text-main transition-colors"
            title="Go Back"
          >
            <Icon icon="lucide:arrow-left" className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Search History</h1>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gs-purple hover:bg-gs-purple-dark text-white rounded-lg transition-colors text-sm font-medium"
        >
          New Search
        </button>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-6xl">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gs-purple mb-4"></div>
            <p className="text-gs-text-muted">Loading your searches...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Icon icon="lucide:alert-circle" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-500 mb-1">Error</h3>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && searches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mb-4">
              <Icon icon="lucide:search" className="w-8 h-8 text-gs-text-muted" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No searches yet</h3>
            <p className="text-gs-text-muted mb-6 text-center max-w-md">
              Start your first job search to find the perfect candidates for your role.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-gs-purple hover:bg-gs-purple-dark text-white rounded-lg transition-colors font-medium"
            >
              Start Searching
            </button>
          </div>
        )}

        {/* Search Grid */}
        {!isLoading && searches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searches.map((search) => (
              <div
                key={search.search_id}
                onClick={() => handleSelectSearch(search.search_id)}
                className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-lg p-4 transition-all cursor-pointer"
              >
                {/* Job Description */}
                <div className="mb-4">
                  <p className="text-gs-text-main text-sm leading-relaxed line-clamp-3 mb-2">
                    {truncateText(search.job_description, 150)}
                  </p>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-gs-text-muted mb-3">
                  <div className="flex items-center gap-1" title="Total candidates found">
                    <Icon icon="lucide:users" className="w-3.5 h-3.5" />
                    <span>{search.total_found}</span>
                  </div>
                  {search.starred_count > 0 && (
                    <div className="flex items-center gap-1" title="Starred candidates">
                      <Icon icon="lucide:star" className="w-3.5 h-3.5" />
                      <span>{search.starred_count}</span>
                    </div>
                  )}
                  {search.conversation_count > 0 && (
                    <div className="flex items-center gap-1" title="Conversations">
                      <Icon icon="lucide:message-circle" className="w-3.5 h-3.5" />
                      <span>{search.conversation_count}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gs-text-muted">
                    {formatDate(search.updated_at)}
                  </span>
                  <button
                    onClick={(e) => handleDeleteSearch(search.search_id, e)}
                    disabled={deletingId === search.search_id}
                    className="p-1.5 hover:bg-red-500/10 rounded-md text-gs-text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Delete search"
                  >
                    {deletingId === search.search_id ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b border-red-500"></div>
                    ) : (
                      <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
