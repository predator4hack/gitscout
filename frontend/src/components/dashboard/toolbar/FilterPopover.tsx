import { useState, useCallback, useEffect, useRef } from 'react';
import { CandidateFilters, LastContributionPeriod } from '../../../types';

interface FilterPopoverProps {
  filters: CandidateFilters;
  onApplyFilters: (filters: CandidateFilters) => void;
  onClose: () => void;
  disabled?: boolean;
}

export function FilterPopover({ filters, onApplyFilters, onClose, disabled }: FilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [localFilters, setLocalFilters] = useState<CandidateFilters>(filters);

  // Sync local filters with applied filters when they change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const updateLocalFilter = useCallback(
    <K extends keyof CandidateFilters>(key: K, value: CandidateFilters[K]) => {
      setLocalFilters((prev) => ({ ...prev, [key]: value || undefined }));
    },
    []
  );

  const handleApplyFilters = useCallback(() => {
    onApplyFilters(localFilters);
    onClose();
  }, [localFilters, onApplyFilters, onClose]);

  const handleClearFilters = useCallback(() => {
    setLocalFilters({});
    onApplyFilters({});
    onClose();
  }, [onApplyFilters, onClose]);

  const localFilterCount = Object.values(localFilters).filter((v) => v !== undefined).length;
  const appliedFilterCount = Object.values(filters).filter((v) => v !== undefined).length;
  const hasUnappliedChanges = JSON.stringify(localFilters) !== JSON.stringify(filters);

  return (
    <div className="fixed top-10 left-0 right-0 bottom-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Popover */}
      <div
        ref={popoverRef}
        className="absolute top-[60px] left-[280px] w-[320px] bg-[#1a1a1a] border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden"
      >
        {/* Filter content - no header to save space */}
        <div className="p-3 space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto">
          {/* Location filter */}
          <div>
            <label htmlFor="filter-location" className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
              Location
            </label>
            <input
              id="filter-location"
              type="text"
              placeholder="e.g., San Francisco"
              value={localFilters.location || ''}
              onChange={(e) => updateLocalFilter('location', e.target.value || undefined)}
              disabled={disabled}
              className="w-full px-2.5 py-1.5 bg-black/40 border border-white/[0.08] rounded text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
            />
          </div>

          {/* Followers range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="filter-followers-min" className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                Min Followers
              </label>
              <input
                id="filter-followers-min"
                type="number"
                min="0"
                placeholder="0"
                value={localFilters.followersMin ?? ''}
                onChange={(e) =>
                  updateLocalFilter('followersMin', e.target.value ? parseInt(e.target.value) : undefined)
                }
                disabled={disabled}
                className="w-full px-2.5 py-1.5 bg-black/40 border border-white/[0.08] rounded text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="filter-followers-max" className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                Max Followers
              </label>
              <input
                id="filter-followers-max"
                type="number"
                min="0"
                placeholder="Any"
                value={localFilters.followersMax ?? ''}
                onChange={(e) =>
                  updateLocalFilter('followersMax', e.target.value ? parseInt(e.target.value) : undefined)
                }
                disabled={disabled}
                className="w-full px-2.5 py-1.5 bg-black/40 border border-white/[0.08] rounded text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Contact filters */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer py-0.5">
              <input
                type="checkbox"
                checked={localFilters.hasEmail || false}
                onChange={(e) => updateLocalFilter('hasEmail', e.target.checked || undefined)}
                disabled={disabled}
                className="w-3.5 h-3.5 rounded border-white/[0.08] bg-black/40 text-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
              />
              <span className="text-[13px] text-gray-300">Has Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer py-0.5">
              <input
                type="checkbox"
                checked={localFilters.hasAnyContact || false}
                onChange={(e) => updateLocalFilter('hasAnyContact', e.target.checked || undefined)}
                disabled={disabled}
                className="w-3.5 h-3.5 rounded border-white/[0.08] bg-black/40 text-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
              />
              <span className="text-[13px] text-gray-300">Has Any Contact</span>
            </label>
          </div>

          {/* Last contribution */}
          <div>
            <label htmlFor="filter-last-contribution" className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
              Last Active
            </label>
            <select
              id="filter-last-contribution"
              value={localFilters.lastContribution || ''}
              onChange={(e) =>
                updateLocalFilter('lastContribution', (e.target.value as LastContributionPeriod) || undefined)
              }
              disabled={disabled}
              className="w-full px-2.5 py-1.5 bg-black/40 border border-white/[0.08] rounded text-[13px] text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
            >
              <option value="">Any time</option>
              <option value="30d">Last 30 days</option>
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-3 py-2.5 border-t border-white/[0.08] flex gap-2 bg-black/20">
          <button
            type="button"
            onClick={handleApplyFilters}
            disabled={disabled || !hasUnappliedChanges}
            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply {localFilterCount > 0 && `(${localFilterCount})`}
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={disabled || (localFilterCount === 0 && appliedFilterCount === 0)}
            className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] text-gray-300 text-[13px] font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
