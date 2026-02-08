import { useState } from "react";
import { Icon } from "../../shared/Icon";

interface CandidateSummaryCardProps {
    name: string | null;
    login: string;
    profileSummary: string | null;
    isLoading: boolean;
}

export function CandidateSummaryCard({
    name,
    login,
    profileSummary,
    isLoading,
}: CandidateSummaryCardProps) {
    const [copied, setCopied] = useState(false);

    const displayName = name || login;

    const handleCopyPage = async () => {
        const content = `${displayName}\n\n${profileSummary || ""}`;
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="pt-6 pr-6 pb-2 pl-6">
            <div className="overflow-hidden group bg-[#0F1115] border-white/10 border rounded-lg pt-6 pr-6 pb-6 pl-6 relative">
                {/* Subtle gradient bg effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="flex items-start justify-between mb-5 relative z-10">
                    <h2 className="text-white font-mono text-sm tracking-[0.15em] uppercase font-bold">
                        {displayName}
                    </h2>
                    <button
                        onClick={handleCopyPage}
                        className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 border border-white/10 bg-white/[0.02] rounded px-2.5 py-1.5 hover:bg-white/5 hover:text-zinc-200 transition-colors"
                    >
                        <Icon icon="lucide:copy" className="w-3 h-3" />
                        {copied ? "Copied!" : "Copy Page"}
                        <Icon
                            icon="lucide:chevron-down"
                            className="w-3 h-3 ml-1 opacity-50"
                        />
                    </button>
                </div>

                {isLoading ? (
                    <div className="space-y-2">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                        <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
                        <div className="h-4 bg-white/5 rounded animate-pulse w-4/6" />
                    </div>
                ) : profileSummary ? (
                    <p className="leading-loose z-10 text-xs font-normal text-zinc-400 relative">
                        {profileSummary}
                    </p>
                ) : (
                    <p className="text-xs text-zinc-500 italic">
                        Profile summary not available.
                    </p>
                )}
            </div>
        </div>
    );
}
