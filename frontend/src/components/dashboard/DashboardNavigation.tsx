import { Link } from 'react-router-dom';
import { Icon } from '../shared/Icon';

export function DashboardNavigation() {
  return (
    <nav className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-gs-body flex-shrink-0">
      {/* Left: Logo + Name */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-white text-black">
          <Icon icon="solar:code-scan-bold" className="text-sm" />
        </div>
        <span className="font-medium tracking-tight text-sm text-gs-text-main">
          GitScout
        </span>
      </Link>

      {/* Right: Actions */}
      <div className="flex items-center gap-4 text-[13px] font-medium">
        <Link
          to="/"
          className="text-gs-text-muted hover:text-white flex items-center gap-1.5 transition-colors duration-200"
        >
          <Icon icon="lucide:search" className="w-4 h-4" />
          New Search
        </Link>
        <button className="text-gs-text-muted hover:text-white flex items-center gap-1.5 transition-colors duration-200">
          <Icon icon="lucide:settings" className="w-4 h-4" />
          Settings
        </button>
        <button className="text-gs-text-muted hover:text-white flex items-center gap-1.5 transition-colors duration-200">
          <Icon icon="lucide:log-out" className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
