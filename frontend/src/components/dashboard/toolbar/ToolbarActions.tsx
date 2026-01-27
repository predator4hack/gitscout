import { Icon } from '../../shared/Icon';

interface ToolbarActionsProps {
  onHelpClick: () => void;
  onExportClick: () => void;
}

export function ToolbarActions({ onHelpClick, onExportClick }: ToolbarActionsProps) {
  return (
    <div className="flex items-center gap-4 text-xs font-medium text-gs-text-muted">
      <button
        className="flex items-center gap-1.5 hover:text-white transition-colors"
        onClick={onExportClick}
      >
        <Icon icon="lucide:download" className="w-3.5 h-3.5" />
        Export CSV
      </button>
      <button className="flex items-center gap-1.5 hover:text-white transition-colors">
        <Icon icon="lucide:history" className="w-3.5 h-3.5" />
        History
      </button>
      <button
        className="flex items-center gap-1.5 hover:text-white transition-colors"
        onClick={onHelpClick}
      >
        <Icon icon="lucide:help-circle" className="w-3.5 h-3.5" />
        Help
      </button>
    </div>
  );
}
