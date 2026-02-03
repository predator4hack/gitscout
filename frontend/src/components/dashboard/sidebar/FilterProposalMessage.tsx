import { FilterProposal } from "../../../types/dashboard";

interface FilterProposalMessageProps {
    proposal: FilterProposal;
    messageId: string;
    onConfirm: (messageId: string, confirmed: boolean) => void;
    disabled?: boolean;
}

export function FilterProposalMessage({
    proposal,
    messageId,
    onConfirm,
    disabled = false,
}: FilterProposalMessageProps) {
    return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
            <div className="text-sm text-gray-700">
                <p className="font-medium mb-2">Filter Proposal:</p>
                <p>{proposal.explanation}</p>
            </div>

            {/* Filter details */}
            <div className="space-y-1 text-sm">
                {proposal.location && (
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{proposal.location}</span>
                    </div>
                )}
                {proposal.followers_min !== undefined &&
                    proposal.followers_min !== null && (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Min Followers:</span>
                            <span className="font-medium">
                                {proposal.followers_min}
                            </span>
                        </div>
                    )}
                {proposal.followers_max !== undefined &&
                    proposal.followers_max !== null && (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">Max Followers:</span>
                            <span className="font-medium">
                                {proposal.followers_max}
                            </span>
                        </div>
                    )}
                {proposal.has_email && (
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                            Must have public email
                        </span>
                    </div>
                )}
                {proposal.has_any_contact && (
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                            Must have contact info
                        </span>
                    </div>
                )}
                {proposal.last_contribution && (
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                            Active in last:
                        </span>
                        <span className="font-medium">
                            {proposal.last_contribution === "30d" && "30 days"}
                            {proposal.last_contribution === "3m" && "3 months"}
                            {proposal.last_contribution === "6m" && "6 months"}
                            {proposal.last_contribution === "1y" && "1 year"}
                        </span>
                    </div>
                )}
            </div>

            {/* Estimated results */}
            {proposal.estimated_count !== undefined &&
                proposal.estimated_count !== null && (
                    <div className="text-sm text-gray-600">
                        Estimated results: {proposal.estimated_count}{" "}
                        {proposal.estimated_count === 1
                            ? "candidate"
                            : "candidates"}
                    </div>
                )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
                <button
                    onClick={() => onConfirm(messageId, true)}
                    disabled={disabled}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Apply Filters
                </button>
                <button
                    onClick={() => onConfirm(messageId, false)}
                    disabled={disabled}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
