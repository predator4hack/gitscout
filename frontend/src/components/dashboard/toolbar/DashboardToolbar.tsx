import { Icon } from '../../shared/Icon';
import { QueryTitle } from './QueryTitle';
import { ToolbarActions } from './ToolbarActions';
import { FilterPopover } from './FilterPopover';
import { CandidateFilters } from '../../../types';

interface DashboardToolbarProps {
  queryTitle: string;
  onHelpClick: () => void;
  onExportClick: () => void;
  onEnrichClick: () => void;
  filters: CandidateFilters;
  onFilterChange: (filters: CandidateFilters) => void;
  isFilterOpen: boolean;
  onFilterToggle: () => void;
}

export function DashboardToolbar({
  queryTitle,
  onHelpClick,
  onExportClick,
  onEnrichClick,
  filters,
  onFilterChange,
  isFilterOpen,
  onFilterToggle,
}: DashboardToolbarProps) {
  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined).length;

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] flex-shrink-0 bg-gs-body relative">
      <div className="flex items-center gap-4 min-w-0">
        <QueryTitle title={queryTitle} />

        <div className="h-4 w-px bg-white/[0.06] mx-1" />

        <div className="flex items-center gap-1 text-gs-text-muted">
          <button
            onClick={onFilterToggle}
            className="p-1.5 hover:bg-white/[0.06] rounded-md hover:text-gs-text-main transition-colors relative"
          >
            <Icon icon="lucide:filter" className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-medium rounded-full bg-blue-500 text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button className="p-1.5 hover:bg-white/[0.06] rounded-md hover:text-gs-text-main transition-colors">
            <Icon icon="lucide:pencil" className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-white/[0.06] rounded-md hover:text-gs-text-main transition-colors">
            <Icon icon="lucide:link" className="w-4 h-4" />
          </button>
        </div>

        <button onClick={onEnrichClick} className="flex items-center gap-2 text-xs font-medium text-gs-text-muted hover:text-white px-3 py-1.5 hover:bg-white/[0.06] rounded-md border border-transparent hover:border-white/[0.06] transition-all">
          <Icon icon="lucide:sparkles" className="w-3.5 h-3.5" />
          Enrich Data
        </button>
      </div>

      <ToolbarActions onHelpClick={onHelpClick} onExportClick={onExportClick} />

      {isFilterOpen && (
        <FilterPopover filters={filters} onApplyFilters={onFilterChange} onClose={onFilterToggle} />
      )}
    </header>
  );
}
