import { useState, useRef, useEffect } from 'react';
import { Icon } from '../../shared/Icon';

interface ToolbarActionsProps {
  onHelpClick: () => void;
  onExportClick: () => void;
}

export function ToolbarActions({ onHelpClick, onExportClick }: ToolbarActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleExportClick = () => {
    setIsMenuOpen(false);
    onExportClick();
  };

  const handleHelpClick = () => {
    setIsMenuOpen(false);
    onHelpClick();
  };

  return (
    <>
      {/* Desktop: show all buttons inline */}
      <div className="hidden md:flex items-center gap-4 text-xs font-medium text-gs-text-muted">
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

      {/* Mobile: overflow menu */}
      <div className="md:hidden relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1.5 hover:bg-white/[0.06] rounded-md text-gs-text-muted hover:text-white transition-colors"
        >
          <Icon icon="lucide:more-vertical" className="w-4 h-4" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 py-1 min-w-[140px] bg-[#1a1a1a] border border-white/[0.08] rounded-lg shadow-xl z-50">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gs-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
              onClick={handleExportClick}
            >
              <Icon icon="lucide:download" className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gs-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Icon icon="lucide:history" className="w-3.5 h-3.5" />
              History
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gs-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
              onClick={handleHelpClick}
            >
              <Icon icon="lucide:help-circle" className="w-3.5 h-3.5" />
              Help
            </button>
          </div>
        )}
      </div>
    </>
  );
}
