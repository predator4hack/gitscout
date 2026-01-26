import { Icon } from '../../shared/Icon';
import { QueryTitle } from './QueryTitle';
import { ToolbarActions } from './ToolbarActions';

interface DashboardToolbarProps {
  queryTitle: string;
}

export function DashboardToolbar({ queryTitle }: DashboardToolbarProps) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] flex-shrink-0 bg-gs-body">
      <div className="flex items-center gap-4 min-w-0">
        <QueryTitle title={queryTitle} />

        <div className="h-4 w-px bg-white/[0.06] mx-1" />

        <div className="flex items-center gap-1 text-gs-text-muted">
          <button className="p-1.5 hover:bg-white/[0.06] rounded-md hover:text-gs-text-main transition-colors">
            <Icon icon="lucide:filter" className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-white/[0.06] rounded-md hover:text-gs-text-main transition-colors">
            <Icon icon="lucide:pencil" className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-white/[0.06] rounded-md hover:text-gs-text-main transition-colors">
            <Icon icon="lucide:link" className="w-4 h-4" />
          </button>
        </div>

        <button className="flex items-center gap-2 text-xs font-medium text-gs-text-muted hover:text-white px-3 py-1.5 hover:bg-white/[0.06] rounded-md border border-transparent hover:border-white/[0.06] transition-all">
          <Icon icon="lucide:sparkles" className="w-3.5 h-3.5" />
          Enrich Data
        </button>
      </div>

      <ToolbarActions />
    </header>
  );
}
