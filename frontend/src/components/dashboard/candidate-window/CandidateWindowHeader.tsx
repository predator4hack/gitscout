import { Icon } from "../../shared/Icon";

interface CandidateWindowHeaderProps {
    login: string;
    onChatClick: () => void;
    onClose: () => void;
}

export function CandidateWindowHeader({
    login,
    onChatClick,
    onClose,
}: CandidateWindowHeaderProps) {
    return (
        <div className="flex flex-shrink-0 bg-[#0F1115] h-14 border-white/5 border-b pr-6 pl-6 items-center justify-between">
            <div className="text-white font-mono text-xs font-semibold tracking-wide">
                {login}
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onChatClick}
                    className="flex items-center gap-2 text-[11px] text-zinc-400 hover:text-white transition-colors border border-white/10 hover:border-white/20 rounded px-3 py-1.5 group"
                >
                    <Icon
                        icon="lucide:message-square"
                        className="w-3.5 h-3.5 group-hover:text-white transition-colors"
                    />
                    Chat
                </button>
                <button
                    onClick={onClose}
                    className="text-zinc-500 hover:text-white transition-colors p-1"
                >
                    <Icon icon="lucide:x" className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
