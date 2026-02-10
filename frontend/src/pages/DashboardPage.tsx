import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { DashboardToolbar } from '../components/dashboard/toolbar/DashboardToolbar';
import { CandidateTable } from '../components/dashboard/table/CandidateTable';
import { AISidebar } from '../components/dashboard/sidebar/AISidebar';
import { CandidateWindow } from '../components/dashboard/candidate-window';
import { TABLE_COLUMNS } from '../data/mockDashboardData';
import { useSearch } from '../contexts/SearchContext';
import { fetchSearchPage } from '../api/search';
import { mapCandidatesToDashboard } from '../utils/candidateMapper';
import type { DashboardCandidate, PaginationState, FilterProposal } from '../types/dashboard';
import type { CandidateFilters } from '../types';
import type { CandidateContext } from '../types/candidate';

type SidebarMode = 'none' | 'ai-chat' | 'candidate-window';

export function DashboardPage() {
  const navigate = useNavigate();
  const { state: searchState, updateCandidates, toggleStarCandidate } = useSearch();

  // Sidebar state - replaces simple isSidebarOpen boolean
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('none');
  const [selectedCandidate, setSelectedCandidate] = useState<DashboardCandidate | null>(null);
  const [candidateContext, setCandidateContext] = useState<CandidateContext | null>(null);

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

  // Auto-open sidebar if was open before
  useEffect(() => {
    if (!searchState.sessionId) return;

    const storedState = localStorage.getItem(`sidebar_state_${searchState.sessionId}`);
    if (storedState === 'open') {
      setSidebarMode('ai-chat');
    }
  }, [searchState.sessionId]);

  // Save sidebar state on change
  useEffect(() => {
    if (!searchState.sessionId) return;

    const state = sidebarMode === 'ai-chat' ? 'open' : 'closed';
    localStorage.setItem(`sidebar_state_${searchState.sessionId}`, state);
  }, [sidebarMode, searchState.sessionId]);

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

        // Persist to Firestore after fetching candidates with filters
        // Convert DashboardCandidate back to Candidate for API
        const apiCandidates = response.candidates;
        await updateCandidates(apiCandidates, Object.keys(filters).length > 0 ? filters : null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidates();
  }, [searchState.sessionId, filters, updateCandidates]);

  const handleStarToggle = useCallback(async (id: string) => {
    // Optimistic UI update
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === id
          ? { ...candidate, isStarred: !candidate.isStarred }
          : candidate
      )
    );

    // Persist to Firestore
    await toggleStarCandidate(id);
  }, [toggleStarCandidate]);

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

  // Candidate click handler - opens candidate window
  const handleCandidateClick = useCallback((candidate: DashboardCandidate) => {
    setSelectedCandidate(candidate);
    setSidebarMode('candidate-window');
    setCandidateContext(null); // Clear any previous context
  }, []);

  // Chat button in candidate window - opens AI sidebar with context
  const handleOpenChatWithContext = useCallback((context: CandidateContext) => {
    setCandidateContext(context);
    setSidebarMode('ai-chat');
  }, []);

  // Close sidebar
  const handleCloseSidebar = useCallback(() => {
    setSidebarMode('none');
    setSelectedCandidate(null);
    setCandidateContext(null);
  }, []);

  // Toggle AI sidebar (from toolbar)
  const handleToggleSidebar = useCallback(() => {
    if (sidebarMode === 'ai-chat') {
      setSidebarMode('none');
      setCandidateContext(null);
    } else {
      setSidebarMode('ai-chat');
      setSelectedCandidate(null);
    }
  }, [sidebarMode]);

  const handleApplyFilters = useCallback(async (newFilters: CandidateFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, currentPage: 0 }));

    // Persist to Firestore after fetching the filtered candidates
    // We need to wait for the next render cycle to get updated candidates
    // So we'll handle persistence in the useEffect that tracks filters
  }, []);

  const handleFiltersAppliedFromChat = useCallback((filterProposal: FilterProposal) => {
    // Convert FilterProposal to CandidateFilters
    const candidateFilters: CandidateFilters = {
      location: filterProposal.location || undefined,
      followersMin: filterProposal.followers_min || undefined,
      followersMax: filterProposal.followers_max || undefined,
      hasEmail: filterProposal.has_email || undefined,
      hasAnyContact: filterProposal.has_any_contact || undefined,
      lastContribution: (filterProposal.last_contribution as "30d" | "3m" | "6m" | "1y") || undefined,
    };

    // Apply the filters (persistence happens in useEffect)
    handleApplyFilters(candidateFilters);

    // KEEP SIDEBAR OPEN - don't close it after applying filters
    // Remove these lines:
    // setSidebarMode('none');
    // setCandidateContext(null);
  }, [handleApplyFilters]);

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

  // Determine sidebar width based on mode
  const sidebarWidth = sidebarMode === 'candidate-window' ? 620 : 400;
  const isSidebarOpen = sidebarMode !== 'none';

  // Render the appropriate sidebar content
  const renderSidebar = () => {
    if (!searchState.sessionId) return null;

    if (sidebarMode === 'candidate-window' && selectedCandidate) {
      return (
        <CandidateWindow
          candidate={selectedCandidate}
          sessionId={searchState.sessionId}
          onClose={handleCloseSidebar}
          onOpenChat={handleOpenChatWithContext}
        />
      );
    }

    if (sidebarMode === 'ai-chat') {
      return (
        <AISidebar
          sessionId={searchState.sessionId}
          onClose={handleCloseSidebar}
          onFiltersApplied={handleFiltersAppliedFromChat}
          initialContext={candidateContext}
        />
      );
    }

    return null;
  };

  if (error) {
    return (
      <DashboardLayout isSidebarOpen={false} sidebar={null} sidebarWidth={400}>
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
      sidebar={renderSidebar()}
      sidebarWidth={sidebarWidth}
    >
      <DashboardToolbar
        queryTitle={queryTitle}
        onHelpClick={handleToggleSidebar}
        onExportClick={handleExportCSV}
        onEnrichClick={handleToggleSidebar}
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
          onCandidateClick={handleCandidateClick}
        />
      )}
    </DashboardLayout>
  );
}
