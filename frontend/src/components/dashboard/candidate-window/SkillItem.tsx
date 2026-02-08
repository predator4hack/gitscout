import { useState } from "react";
import { Icon } from "../../shared/Icon";
import type { SkillLevel } from "../../../types/candidate";

interface SkillItemProps {
    name: string;
    level?: SkillLevel;
    description: string;
    evidence?: string;
    repositories?: string[];
    isLast?: boolean;
}

export function SkillItem({
    name,
    level,
    description,
    evidence,
    repositories,
    isLast = false,
}: SkillItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasExpandableContent = evidence || (repositories && repositories.length > 0);

    return (
        <div
            className={`p-5 hover:bg-white/[0.02] cursor-pointer group transition-colors ${
                isLast ? "opacity-50" : ""
            }`}
            onClick={() => hasExpandableContent && setIsExpanded(!isExpanded)}
        >
            <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[11px] text-zinc-300 font-mono uppercase tracking-wide font-medium">
                    {name}
                </h3>
                {hasExpandableContent && (
                    <Icon
                        icon={isExpanded ? "lucide:chevron-down" : "lucide:chevron-right"}
                        className={`w-3.5 h-3.5 text-zinc-600 transition-all duration-200 ${
                            isExpanded
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100 transform group-hover:translate-x-0.5"
                        }`}
                    />
                )}
            </div>
            <p className="text-[11px] text-zinc-500/80 leading-relaxed font-normal">
                {description}
            </p>

            {/* Expandable content */}
            {isExpanded && hasExpandableContent && (
                <div className="mt-3 pt-3 border-t border-white/5">
                    {level && (
                        <div className="mb-2">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                Level:{" "}
                            </span>
                            <span
                                className={`text-[10px] font-medium ${
                                    level === "Expert"
                                        ? "text-gs-purple"
                                        : level === "Advanced"
                                        ? "text-gs-blue"
                                        : level === "Intermediate"
                                        ? "text-gs-yellow"
                                        : "text-zinc-400"
                                }`}
                            >
                                {level}
                            </span>
                        </div>
                    )}
                    {evidence && (
                        <p className="text-[10px] text-zinc-500 mb-2">
                            <span className="text-zinc-600 uppercase tracking-wider">
                                Evidence:{" "}
                            </span>
                            {evidence}
                        </p>
                    )}
                    {repositories && repositories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {repositories.map((repo, idx) => (
                                <span
                                    key={idx}
                                    className="text-[9px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded"
                                >
                                    {repo}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
