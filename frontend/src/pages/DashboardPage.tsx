import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { DashboardToolbar } from '../components/dashboard/toolbar/DashboardToolbar';
import { CandidateTable } from '../components/dashboard/table/CandidateTable';
import { AISidebar } from '../components/dashboard/sidebar/AISidebar';
import {
  TABLE_COLUMNS,
  MOCK_CHAT_MESSAGES,
  SUGGESTION_CHIPS,
} from '../data/mockDashboardData';
import { useSearch } from '../context/SearchContext';
import { fetchSearchPage } from '../api/search';
import { mapCandidatesToDashboard } from '../utils/candidateMapper';
import type { DashboardCandidate, PaginationState } from '../types/dashboard';
import type { CandidateFilters } from '../types';

export function DashboardPage() {
  const navigate = useNavigate();
  const { state: searchState } = useSearch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [candidates, setCandidates] = useState<DashboardCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 0,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<CandidateFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Redirect if no session
  useEffect(() => {
    if (!searchState.sessionId) {
      navigate('/');
    }
  }, [searchState.sessionId, navigate]);

  // Fetch initial data and refetch when filters change
  useEffect(() => {
    if (!searchState.sessionId) return;

    const loadCandidates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchSearchPage(
          searchState.sessionId!,
          0,
          pagination.pageSize,
          Object.keys(filters).length > 0 ? filters : undefined
        );
        const dashboardCandidates = mapCandidatesToDashboard(response.candidates);
        setCandidates(dashboardCandidates);
        setPagination({
          currentPage: response.page,
          pageSize: response.pageSize,
          totalItems: response.totalCached,
          totalPages: Math.ceil(response.totalCached / response.pageSize),
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidates();
  }, [searchState.sessionId, filters]);

  const handleStarToggle = useCallback((id: string) => {
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === id
          ? { ...candidate, isStarred: !candidate.isStarred }
          : candidate
      )
    );
  }, []);

  const handlePageChange = useCallback(async (page: number) => {
    if (!searchState.sessionId) return;

    try {
      setIsLoading(true);
      const response = await fetchSearchPage(
        searchState.sessionId,
        page,
        pagination.pageSize,
        Object.keys(filters).length > 0 ? filters : undefined
      );
      const dashboardCandidates = mapCandidatesToDashboard(response.candidates);
      setCandidates(dashboardCandidates);
      setPagination((prev) => ({ ...prev, currentPage: page }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [searchState.sessionId, pagination.pageSize, filters]);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleApplyFilters = useCallback((newFilters: CandidateFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
  }, []);

  const handleToggleFilter = useCallback(() => {
    setIsFilterOpen((prev) => !prev);
  }, []);

  const handleExportCSV = useCallback(() => {
    if (candidates.length === 0) return;

    const headers = ['Username', 'Name', 'Email', 'Location', 'Followers', 'Score', 'Repositories', 'LinkedIn', 'Twitter', 'Website'];
    const rows = candidates.map((c) => [
      c.login,
      c.name || '',
      c.email || '',
      c.location || '',
      c.followers.toString(),
      c.score.toString(),
      c.repositories.map((r) => r.name).join('; '),
      c.linkedInUrl || '',
      c.twitterUsername || '',
      c.websiteUrl || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'candidates.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [candidates]);

  // Generate query title from job description or use fallback
  const queryTitle = searchState.jobDescription
    ? searchState.jobDescription.slice(0, 50) + (searchState.jobDescription.length > 50 ? '...' : '')
    : 'Search Results';

  if (error) {
    return (
      <DashboardLayout isSidebarOpen={false} sidebar={null}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <button
              onClick={() => navigate('/')}
              className="text-white underline"
            >
              Start new search
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      isSidebarOpen={isSidebarOpen}
      sidebar={
        <AISidebar
          messages={MOCK_CHAT_MESSAGES}
          suggestions={SUGGESTION_CHIPS}
          onClose={handleCloseSidebar}
        />
      }
    >
      <DashboardToolbar
        queryTitle={queryTitle}
        onHelpClick={handleToggleSidebar}
        onExportClick={handleExportCSV}
        filters={filters}
        onFilterChange={handleApplyFilters}
        isFilterOpen={isFilterOpen}
        onFilterToggle={handleToggleFilter}
      />
      {isLoading && candidates.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gs-text-muted">Loading candidates...</p>
        </div>
      ) : (
        <CandidateTable
          candidates={candidates}
          columns={TABLE_COLUMNS}
          pagination={pagination}
          onStarToggle={handleStarToggle}
          onPageChange={handlePageChange}
        />
      )}
    </DashboardLayout>
  );
}
