import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { TablePagination } from "./TablePagination";
import type {
    DashboardCandidate,
    TableColumn,
    PaginationState,
} from "../../../types/dashboard";

interface CandidateTableProps {
    candidates: DashboardCandidate[];
    columns: TableColumn[];
    pagination: PaginationState;
    onStarToggle: (id: string) => void;
    onPageChange: (page: number) => void;
    onCandidateClick?: (candidate: DashboardCandidate) => void;
}

export function CandidateTable({
    candidates,
    columns,
    pagination,
    onStarToggle,
    onPageChange,
    onCandidateClick,
}: CandidateTableProps) {
    return (
        <>
            {/* Table View */}
            <div className="flex-1 overflow-auto bg-gs-body dashboard-scrollbar">
                <table className="w-full text-left border-collapse">
                    <TableHeader columns={columns} />
                    <tbody className="text-xs font-medium divide-y divide-white/[0.06]">
                        {candidates.map((candidate) => (
                            <TableRow
                                key={candidate.id}
                                candidate={candidate}
                                onStarToggle={onStarToggle}
                                onCandidateClick={onCandidateClick}
                            />
                        ))}
                    </tbody>
                </table>

                {/* Partial Row to imply scroll */}
                {candidates.length > 0 && (
                    <div className="border-b border-white/[0.06] py-4 px-4 flex items-start opacity-50">
                        <div className="w-10 text-center">
                            <span className="inline-block w-3.5 h-3.5 text-gs-text-darker">
                                *
                            </span>
                        </div>
                        <div className="ml-4">
                            <span className="repo-chip">
                                langchain-ai/langchain
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Table Footer */}
            <TablePagination
                pagination={pagination}
                onPageChange={onPageChange}
            />
        </>
    );
}
