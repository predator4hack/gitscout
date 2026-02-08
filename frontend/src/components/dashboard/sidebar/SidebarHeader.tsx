import { Icon } from '../../shared/Icon';

interface SidebarHeaderProps {
  onClose: () => void;
  title?: string;
}

export function SidebarHeader({ onClose, title }: SidebarHeaderProps) {
  return (
    <div className="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-2 text-gs-text-main text-xs font-semibold">
        <Icon icon="lucide:bot" className="w-4 h-4 text-gs-purple" />
        {title || 'AI Assistant'}
      </div>
      <button
        onClick={onClose}
        className="text-gs-text-muted hover:text-white transition-colors"
      >
        <Icon icon="lucide:x" className="w-4 h-4" />
      </button>
    </div>
  );
}
