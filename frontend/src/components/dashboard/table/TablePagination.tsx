import type { PaginationState } from '../../../types/dashboard';

interface TablePaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}

export function TablePagination({ pagination, onPageChange }: TablePaginationProps) {
  const { currentPage, pageSize, totalItems, totalPages } = pagination;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="h-10 border-t border-white/[0.06] bg-gs-body flex items-center justify-between px-6 flex-shrink-0 text-[10px] font-mono text-gs-text-muted">
      <div>
        SHOWING {startItem}-{endItem} OF {totalItems.toLocaleString()}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-6 h-6 flex items-center justify-center hover:bg-white/[0.06] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &lt;
        </button>
        <span>
          Page {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-6 h-6 flex items-center justify-center hover:bg-white/[0.06] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
