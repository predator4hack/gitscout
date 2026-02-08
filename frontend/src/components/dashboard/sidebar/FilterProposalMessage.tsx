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
        <div className="rounded-xl rounded-tl-sm border border-white/5 bg-[#1E2024] p-4 space-y-3">
            <div className="text-sm text-zinc-300">
                <p className="font-medium mb-2">Filter Proposal:</p>
                <p>{proposal.explanation}</p>
            </div>

            {/* Filter details */}
            <div className="space-y-1 text-sm">
                {proposal.location && (
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500">Location:</span>
                        <span className="font-medium text-zinc-300">{proposal.location}</span>
                    </div>
                )}
                {proposal.followers_min !== undefined &&
                    proposal.followers_min !== null && (
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-500">Min Followers:</span>
                            <span className="font-medium text-zinc-300">
                                {proposal.followers_min}
                            </span>
                        </div>
                    )}
                {proposal.followers_max !== undefined &&
                    proposal.followers_max !== null && (
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-500">Max Followers:</span>
                            <span className="font-medium text-zinc-300">
                                {proposal.followers_max}
                            </span>
                        </div>
                    )}
                {proposal.has_email && (
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500">
                            Must have public email
                        </span>
                    </div>
                )}
                {proposal.has_any_contact && (
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500">
                            Must have contact info
                        </span>
                    </div>
                )}
                {proposal.last_contribution && (
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500">
                            Active in last:
                        </span>
                        <span className="font-medium text-zinc-300">
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
                    <div className="text-sm text-zinc-500">
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
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gs-purple rounded-md hover:bg-gs-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Apply Filters
                </button>
                <button
                    onClick={() => onConfirm(messageId, false)}
                    disabled={disabled}
                    className="flex-1 px-4 py-2 text-sm font-medium text-zinc-300 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
