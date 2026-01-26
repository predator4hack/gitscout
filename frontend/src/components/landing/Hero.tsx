import { Icon } from "../shared/Icon";

export function Hero() {
    return (
        <main className="flex-grow pt-32 pb-20 relative">
            <div className="max-w-6xl mx-auto px-6 flex flex-col items-center text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] mb-8">
                    <span className="text-[11px] font-medium tracking-wide text-[#888888] uppercase">
                        Introducing GitScout v1.0
                    </span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-white mb-8 max-w-4xl leading-[1.05]">
                    Technical recruiting,
                    <br />
                    <span className="text-[#666666]">decoded by code</span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg text-[#888888] max-w-2xl mb-12 font-light leading-relaxed">
                    Stop keyword matching. Start logic matching. GitScout
                    analyzes repositories, commits, and architectural decisions
                    to find engineers who actually write the code you need.
                </p>

                {/* Search UI Mock */}
                <div className="w-full max-w-2xl relative group mb-20">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700" />
                    <div className="relative bg-[#0A0A0A] rounded-xl border border-white/10 p-1.5 flex items-center shadow-2xl ring-1 ring-white/5">
                        <div className="pl-3 pr-2 text-[#444444]">
                            <Icon icon="solar:magnifer-linear" width={18} />
                        </div>
                        <input
                            type="text"
                            className="w-full bg-transparent border-none outline-none text-[13px] text-white placeholder-[#444444] h-9 font-mono"
                            placeholder='Try "Find a React dev who contributes to high-traffic open-source projects..."'
                            readOnly
                        />
                        <div className="hidden sm:flex items-center gap-1 pr-2">
                            <span className="text-[10px] text-[#444444] border border-[#333] rounded px-1.5 py-0.5">
                                ⌘ K
                            </span>
                        </div>
                    </div>
                </div>

                {/* Trusted Logos */}
                <div className="w-full border-t border-white/5 pt-12">
                    <p className="text-[11px] font-medium text-[#444444] uppercase tracking-widest mb-8">
                        Trusted by engineering teams at
                    </p>
                    <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-40 grayscale">
                        <Icon
                            icon="simple-icons:vercel"
                            width={22}
                            className="hover:text-white transition-colors duration-300"
                        />
                        <Icon
                            icon="simple-icons:linear"
                            width={22}
                            className="hover:text-white transition-colors duration-300"
                        />
                        <Icon
                            icon="simple-icons:stripe"
                            width={22}
                            className="hover:text-white transition-colors duration-300"
                        />
                        <Icon
                            icon="simple-icons:raycast"
                            width={22}
                            className="hover:text-white transition-colors duration-300"
                        />
                        <Icon
                            icon="simple-icons:github"
                            width={22}
                            className="hover:text-white transition-colors duration-300"
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
