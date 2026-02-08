import { useState } from "react";
import { Icon } from "../../shared/Icon";
import { SkillItem } from "./SkillItem";
import type {
    DomainSkill,
    TechnicalSkill,
    BehavioralPattern,
} from "../../../types/candidate";

type TabKey = "domain" | "technical" | "behavioral";

interface SkillsTabsProps {
    domainExpertise: DomainSkill[];
    technicalExpertise: TechnicalSkill[];
    behavioralPatterns: BehavioralPattern[];
    isLoading: boolean;
}

export function SkillsTabs({
    domainExpertise,
    technicalExpertise,
    behavioralPatterns,
    isLoading,
}: SkillsTabsProps) {
    const [activeTab, setActiveTab] = useState<TabKey>("domain");

    const tabs: { key: TabKey; label: string; count: number }[] = [
        { key: "domain", label: "Domain Expertise", count: domainExpertise.length },
        { key: "technical", label: "Technical Expertise", count: technicalExpertise.length },
        { key: "behavioral", label: "Behavioral Patterns", count: behavioralPatterns.length },
    ];

    const renderSkillItems = () => {
        if (isLoading) {
            return (
                <div className="divide-y divide-white/5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-5">
                            <div className="h-4 bg-white/5 rounded animate-pulse mb-2 w-2/3" />
                            <div className="h-3 bg-white/5 rounded animate-pulse w-full" />
                        </div>
                    ))}
                </div>
            );
        }

        switch (activeTab) {
            case "domain":
                if (domainExpertise.length === 0) {
                    return (
                        <div className="p-5 text-xs text-zinc-500 italic">
                            No domain expertise identified.
                        </div>
                    );
                }
                return (
                    <div className="divide-y divide-white/5">
                        {domainExpertise.map((skill, idx) => (
                            <SkillItem
                                key={idx}
                                name={skill.name}
                                level={skill.level}
                                description={skill.evidence}
                                repositories={skill.repositories}
                                isLast={idx === domainExpertise.length - 1 && domainExpertise.length > 3}
                            />
                        ))}
                    </div>
                );

            case "technical":
                if (technicalExpertise.length === 0) {
                    return (
                        <div className="p-5 text-xs text-zinc-500 italic">
                            No technical expertise identified.
                        </div>
                    );
                }
                return (
                    <div className="divide-y divide-white/5">
                        {technicalExpertise.map((skill, idx) => (
                            <SkillItem
                                key={idx}
                                name={skill.name}
                                level={skill.level}
                                description={
                                    skill.evidence ||
                                    `Proficiency in ${skill.name}`
                                }
                                repositories={skill.repositories}
                                isLast={idx === technicalExpertise.length - 1 && technicalExpertise.length > 4}
                            />
                        ))}
                    </div>
                );

            case "behavioral":
                if (behavioralPatterns.length === 0) {
                    return (
                        <div className="p-5 text-xs text-zinc-500 italic">
                            No behavioral patterns identified.
                        </div>
                    );
                }
                return (
                    <div className="divide-y divide-white/5">
                        {behavioralPatterns.map((pattern, idx) => (
                            <SkillItem
                                key={idx}
                                name={pattern.name}
                                description={pattern.description}
                                evidence={pattern.evidence}
                                isLast={idx === behavioralPatterns.length - 1 && behavioralPatterns.length > 3}
                            />
                        ))}
                    </div>
                );
        }
    };

    return (
        <>
            {/* Skills Divider */}
            <div className="flex items-center gap-6 px-6 py-6">
                <div className="h-px bg-white/5 flex-1" />
                <span className="text-[10px] tracking-[0.2em] text-zinc-600 font-mono uppercase font-medium">
                    Skills
                </span>
                <div className="h-px bg-white/5 flex-1" />
            </div>

            {/* Skills Tabs */}
            <div className="border-y border-white/5 bg-[#0F1115]">
                <div className="grid grid-cols-3 divide-x divide-white/5">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <div
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`p-5 cursor-pointer group ${
                                    isActive
                                        ? "bg-white/[0.02]"
                                        : "hover:bg-white/[0.01]"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span
                                        className={`text-[10px] uppercase tracking-wider font-medium transition-colors ${
                                            isActive
                                                ? "text-white font-semibold"
                                                : "text-zinc-500 group-hover:text-zinc-300"
                                        }`}
                                    >
                                        {tab.label}
                                    </span>
                                    <Icon
                                        icon={
                                            isActive
                                                ? "lucide:chevron-down"
                                                : "lucide:chevron-right"
                                        }
                                        className={`w-3 h-3 ${
                                            isActive
                                                ? "text-zinc-500"
                                                : "text-zinc-600 group-hover:text-zinc-400"
                                        }`}
                                    />
                                </div>
                                <div
                                    className={`text-[10px] font-mono ${
                                        isActive ? "text-zinc-500" : "text-zinc-600"
                                    }`}
                                >
                                    {isLoading ? "..." : `x ${tab.count}`}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Skills List */}
            {renderSkillItems()}
        </>
    );
}
