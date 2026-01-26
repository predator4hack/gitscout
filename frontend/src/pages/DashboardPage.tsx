import { useState, useCallback } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { DashboardToolbar } from '../components/dashboard/toolbar/DashboardToolbar';
import { CandidateTable } from '../components/dashboard/table/CandidateTable';
import { AISidebar } from '../components/dashboard/sidebar/AISidebar';
import {
  MOCK_QUERY_TITLE,
  TABLE_COLUMNS,
  MOCK_CANDIDATES,
  MOCK_CHAT_MESSAGES,
  SUGGESTION_CHIPS,
  INITIAL_PAGINATION,
} from '../data/mockDashboardData';
import type { DashboardCandidate, PaginationState } from '../types/dashboard';

export function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [candidates, setCandidates] = useState<DashboardCandidate[]>(MOCK_CANDIDATES);
  const [pagination, setPagination] = useState<PaginationState>(INITIAL_PAGINATION);

  const handleStarToggle = useCallback((id: string) => {
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === id
          ? { ...candidate, isStarred: !candidate.isStarred }
          : candidate
      )
    );
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
    // In a real app, this would fetch new data
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

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
      <DashboardToolbar queryTitle={MOCK_QUERY_TITLE} onHelpClick={handleToggleSidebar} />
      <CandidateTable
        candidates={candidates}
        columns={TABLE_COLUMNS}
        pagination={pagination}
        onStarToggle={handleStarToggle}
        onPageChange={handlePageChange}
      />
    </DashboardLayout>
  );
}
