import { CandidateWindowHeader } from "./CandidateWindowHeader";
import { CandidateSummaryCard } from "./CandidateSummaryCard";
import { SkillsTabs } from "./SkillsTabs";
import { useCandidateSkills } from "../../../hooks/useCandidateSkills";
import type { DashboardCandidate } from "../../../types/dashboard";
import type { CandidateContext } from "../../../types/candidate";

interface CandidateWindowProps {
    candidate: DashboardCandidate;
    sessionId: string;
    onClose: () => void;
    onOpenChat: (context: CandidateContext) => void;
}

export function CandidateWindow({
    candidate,
    sessionId,
    onClose,
    onOpenChat,
}: CandidateWindowProps) {
    const { skills, isLoading, error } = useCandidateSkills({
        login: candidate.login,
        sessionId,
        enabled: true,
    });

    const handleChatClick = () => {
        onOpenChat({
            login: candidate.login,
            name: candidate.name,
            skills: skills || undefined,
        });
    };

    return (
        <aside className="flex flex-col flex-shrink-0 bg-[#0F1115] w-full border-white/5 border-l relative h-full">
            {/* Header */}
            <CandidateWindowHeader
                login={candidate.login}
                onChatClick={handleChatClick}
                onClose={onClose}
            />

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto dashboard-scrollbar">
                {/* Summary Card */}
                <CandidateSummaryCard
                    name={candidate.name}
                    login={candidate.login}
                    profileSummary={skills?.profile_summary || null}
                    isLoading={isLoading}
                />

                {/* Error State */}
                {error && (
                    <div className="px-6 pb-4">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    </div>
                )}

                {/* Skills Tabs */}
                <SkillsTabs
                    domainExpertise={skills?.domain_expertise || []}
                    technicalExpertise={skills?.technical_expertise || []}
                    behavioralPatterns={skills?.behavioral_patterns || []}
                    isLoading={isLoading}
                />
            </div>
        </aside>
    );
}
