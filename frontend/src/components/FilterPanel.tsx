import { useState, useCallback } from "react";
import { CandidateFilters, LastContributionPeriod } from "../types";

interface FilterPanelProps {
    filters: CandidateFilters;
    onApplyFilters: (filters: CandidateFilters) => void;
    disabled?: boolean;
}

export function FilterPanel({
    filters,
    onApplyFilters,
    disabled,
}: FilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    // Local state for filter inputs (doesn't trigger API calls)
    const [localFilters, setLocalFilters] = useState<CandidateFilters>(filters);

    const updateLocalFilter = useCallback(
        <K extends keyof CandidateFilters>(
            key: K,
            value: CandidateFilters[K]
        ) => {
            setLocalFilters((prev) => ({ ...prev, [key]: value || undefined }));
        },
        []
    );

    const handleApplyFilters = useCallback(() => {
        onApplyFilters(localFilters);
    }, [localFilters, onApplyFilters]);

    const handleClearFilters = useCallback(() => {
        setLocalFilters({});
        onApplyFilters({});
    }, [onApplyFilters]);

    const localFilterCount = Object.values(localFilters).filter(
        (v) => v !== undefined
    ).length;

    const appliedFilterCount = Object.values(filters).filter(
        (v) => v !== undefined
    ).length;

    // Check if local filters differ from applied filters
    const hasUnappliedChanges = JSON.stringify(localFilters) !== JSON.stringify(filters);

    return (
        <div className="filter-panel">
            <div className="filter-header">
                <button
                    type="button"
                    className="filter-toggle"
                    onClick={() => setIsExpanded(!isExpanded)}
                    disabled={disabled}
                >
                    Filters{" "}
                    {appliedFilterCount > 0 && (
                        <span className="filter-badge">{appliedFilterCount}</span>
                    )}
                    <span className={`chevron ${isExpanded ? "expanded" : ""}`}>
                        ▼
                    </span>
                </button>
            </div>

            {isExpanded && (
                <div className="filter-content">
                    {/* Location filter */}
                    <div className="filter-group">
                        <label htmlFor="filter-location">Location</label>
                        <input
                            id="filter-location"
                            type="text"
                            placeholder="e.g., San Francisco, USA"
                            value={localFilters.location || ""}
                            onChange={(e) =>
                                updateLocalFilter("location", e.target.value || undefined)
                            }
                            disabled={disabled}
                        />
                    </div>

                    {/* Followers range */}
                    <div className="filter-group filter-group-row">
                        <div>
                            <label htmlFor="filter-followers-min">
                                Min Followers
                            </label>
                            <input
                                id="filter-followers-min"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={localFilters.followersMin ?? ""}
                                onChange={(e) =>
                                    updateLocalFilter(
                                        "followersMin",
                                        e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined
                                    )
                                }
                                disabled={disabled}
                            />
                        </div>
                        <div>
                            <label htmlFor="filter-followers-max">
                                Max Followers
                            </label>
                            <input
                                id="filter-followers-max"
                                type="number"
                                min="0"
                                placeholder="Any"
                                value={localFilters.followersMax ?? ""}
                                onChange={(e) =>
                                    updateLocalFilter(
                                        "followersMax",
                                        e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined
                                    )
                                }
                                disabled={disabled}
                            />
                        </div>
                    </div>

                    {/* Contact filters */}
                    <div className="filter-group filter-group-row">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={localFilters.hasEmail || false}
                                onChange={(e) =>
                                    updateLocalFilter(
                                        "hasEmail",
                                        e.target.checked || undefined
                                    )
                                }
                                disabled={disabled}
                            />
                            Has Email
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={localFilters.hasAnyContact || false}
                                onChange={(e) =>
                                    updateLocalFilter(
                                        "hasAnyContact",
                                        e.target.checked || undefined
                                    )
                                }
                                disabled={disabled}
                            />
                            Has Any Contact
                        </label>
                    </div>

                    {/* Last contribution */}
                    <div className="filter-group">
                        <label htmlFor="filter-last-contribution">
                            Last Active
                        </label>
                        <select
                            id="filter-last-contribution"
                            value={localFilters.lastContribution || ""}
                            onChange={(e) =>
                                updateLocalFilter(
                                    "lastContribution",
                                    (e.target.value as LastContributionPeriod) ||
                                        undefined
                                )
                            }
                            disabled={disabled}
                        >
                            <option value="">Any time</option>
                            <option value="30d">Last 30 days</option>
                            <option value="3m">Last 3 months</option>
                            <option value="6m">Last 6 months</option>
                            <option value="1y">Last year</option>
                        </select>
                    </div>

                    {/* Action buttons */}
                    <div className="filter-actions">
                        <button
                            type="button"
                            className="filter-apply-btn"
                            onClick={handleApplyFilters}
                            disabled={disabled || !hasUnappliedChanges}
                        >
                            Apply Filters
                            {localFilterCount > 0 && ` (${localFilterCount})`}
                        </button>
                        <button
                            type="button"
                            className="filter-clear-btn"
                            onClick={handleClearFilters}
                            disabled={disabled || (localFilterCount === 0 && appliedFilterCount === 0)}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
