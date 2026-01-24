import { useState, useCallback } from "react";
import { CandidateFilters, LastContributionPeriod } from "../types";

interface FilterPanelProps {
    filters: CandidateFilters;
    onFiltersChange: (filters: CandidateFilters) => void;
    disabled?: boolean;
}

export function FilterPanel({
    filters,
    onFiltersChange,
    disabled,
}: FilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const updateFilter = useCallback(
        <K extends keyof CandidateFilters>(
            key: K,
            value: CandidateFilters[K]
        ) => {
            onFiltersChange({ ...filters, [key]: value || undefined });
        },
        [filters, onFiltersChange]
    );

    const clearFilters = useCallback(() => {
        onFiltersChange({});
    }, [onFiltersChange]);

    const activeFilterCount = Object.values(filters).filter(
        (v) => v !== undefined
    ).length;

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
                    {activeFilterCount > 0 && (
                        <span className="filter-badge">{activeFilterCount}</span>
                    )}
                    <span className={`chevron ${isExpanded ? "expanded" : ""}`}>
                        ▼
                    </span>
                </button>
                {activeFilterCount > 0 && (
                    <button
                        type="button"
                        className="clear-filters"
                        onClick={clearFilters}
                        disabled={disabled}
                    >
                        Clear all
                    </button>
                )}
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
                            value={filters.location || ""}
                            onChange={(e) =>
                                updateFilter("location", e.target.value || undefined)
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
                                value={filters.followersMin ?? ""}
                                onChange={(e) =>
                                    updateFilter(
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
                                value={filters.followersMax ?? ""}
                                onChange={(e) =>
                                    updateFilter(
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
                                checked={filters.hasEmail || false}
                                onChange={(e) =>
                                    updateFilter(
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
                                checked={filters.hasAnyContact || false}
                                onChange={(e) =>
                                    updateFilter(
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
                            value={filters.lastContribution || ""}
                            onChange={(e) =>
                                updateFilter(
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
                </div>
            )}
        </div>
    );
}
