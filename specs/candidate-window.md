# Candidate Window

## Objective

The objective of this task is to build a candidate window which would appear on clicking a candidate that appears on the dashboard.

## Implementation details

I need you to go through the frontend and understand the dashboard page. There will be candidates in the candidate table. As per the new feature, when the user clicks on the candidate user id, a candidate window should appear on the right.

Your task is to build that candidate window for me.

I'm providing a baisc HTML structure of how the window would look like. You need to build the window and integrate it in the existing dashboard strictly adhering to the existing dashboard design, style and layout.

You can choose to add or subtract the information provided in the candidate window based on the information that is fetched from the github API and the information we have. However, we can even modify the graphql API to fetch more information(if feasible) if it is relevant and would be helpful for the recuriter(user)

```html
<aside
    class="flex flex-col flex-shrink-0 bg-[#0F1115] w-[620px] border-white/5 border-l relative"
>
    <!-- Header -->
    <div
        class="flex flex-shrink-0 bg-[#0F1115] h-14 border-white/5 border-b pr-6 pl-6 items-center justify-between"
    >
        <div class="text-white font-mono text-xs font-semibold tracking-wide">
            emmanuel-ferdman
        </div>
        <div class="flex items-center gap-3">
            <button
                class="flex items-center gap-2 text-[11px] text-zinc-400 hover:text-white transition-colors border border-white/10 hover:border-white/20 rounded px-3 py-1.5 group"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    data-lucide="message-square"
                    aria-hidden="true"
                    class="lucide lucide-message-square w-3.5 h-3.5 group-hover:text-white transition-colors"
                >
                    <path
                        d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
                    ></path>
                </svg>
                Chat
            </button>
            <button
                class="text-zinc-500 hover:text-white transition-colors p-1"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    data-lucide="x"
                    aria-hidden="true"
                    class="lucide lucide-x w-4 h-4"
                >
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                </svg>
            </button>
        </div>
    </div>

    <!-- Profile Content -->
    <div class="flex-1 overflow-y-auto">
        <!-- Summary Card -->
        <div class="pt-6 pr-6 pb-2 pl-6">
            <div
                class="overflow-hidden group bg-[#0F1115] border-white/10 border rounded-lg pt-6 pr-6 pb-6 pl-6 relative"
            >
                <!-- Subtle gradient bg effect -->
                <div
                    class="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"
                ></div>

                <div
                    class="flex items-start justify-between mb-5 relative z-10"
                >
                    <h2
                        class="text-white font-mono text-sm tracking-[0.15em] uppercase font-bold"
                    >
                        Emmanuel Ferdman
                    </h2>
                    <button
                        class="flex items-center gap-2 text-[10px] font-medium text-zinc-400 border border-white/10 bg-white/[0.02] rounded px-2.5 py-1.5 hover:bg-white/5 hover:text-zinc-200 transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            data-lucide="copy"
                            aria-hidden="true"
                            class="lucide lucide-copy w-3 h-3"
                        >
                            <rect
                                width="14"
                                height="14"
                                x="8"
                                y="8"
                                rx="2"
                                ry="2"
                            ></rect>
                            <path
                                d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
                            ></path>
                        </svg>
                        Copy Page
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            data-lucide="chevron-down"
                            aria-hidden="true"
                            class="lucide lucide-chevron-down w-3 h-3 ml-1 opacity-50"
                        >
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </button>
                </div>
                <p
                    class="leading-loose z-10 text-xs font-normal text-zinc-400 relative"
                >
                    Holds an MS in Computer Science with a focus on Machine
                    Learning and Computer Vision, working as a full-time
                    software developer at Intel. Works across multiple
                    programming languages including Rust, Python, JavaScript,
                    TypeScript, and functional languages like Haskell. Develops
                    developer tools and GitHub workflow enhancements. Explores
                    data structures and algorithms through practical
                    implementations. Creates interactive visualization and
                    educational tools. Contributes to open-source formatting and
                    tooling projects.
                </p>
            </div>
        </div>

        <!-- Skills Divider -->
        <div class="flex items-center gap-6 px-6 py-6">
            <div class="h-px bg-white/5 flex-1"></div>
            <span
                class="text-[10px] tracking-[0.2em] text-zinc-600 font-mono uppercase font-medium"
                >Skills</span
            >
            <div class="h-px bg-white/5 flex-1"></div>
        </div>

        <!-- Skills Tabs/Grid -->
        <div class="border-y border-white/5 bg-[#0F1115]">
            <div class="grid grid-cols-3 divide-x divide-white/5">
                <!-- Tab 1 (Active) -->
                <div class="p-5 bg-white/[0.02] cursor-pointer">
                    <div class="flex items-center justify-between mb-2">
                        <span
                            class="text-[10px] uppercase tracking-wider text-white font-semibold"
                            >Domain Expertise</span
                        >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            data-lucide="chevron-down"
                            aria-hidden="true"
                            class="lucide lucide-chevron-down w-3 h-3 text-zinc-500"
                        >
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </div>
                    <div class="text-[10px] text-zinc-500 font-mono">x 4</div>
                </div>
                <!-- Tab 2 -->
                <div class="p-5 hover:bg-white/[0.01] cursor-pointer group">
                    <div class="flex items-center justify-between mb-2">
                        <span
                            class="text-[10px] uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors font-medium"
                            >Technical Expertise</span
                        >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            data-lucide="chevron-right"
                            aria-hidden="true"
                            class="lucide lucide-chevron-right w-3 h-3 text-zinc-600 group-hover:text-zinc-400"
                        >
                            <path d="m9 18 6-6-6-6"></path>
                        </svg>
                    </div>
                    <div class="text-[10px] text-zinc-600 font-mono">x 5</div>
                </div>
                <!-- Tab 3 -->
                <div class="p-5 hover:bg-white/[0.01] cursor-pointer group">
                    <div class="flex items-center justify-between mb-2">
                        <span
                            class="text-[10px] uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors font-medium"
                            >Behavioral Patterns</span
                        >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            data-lucide="chevron-right"
                            aria-hidden="true"
                            class="lucide lucide-chevron-right w-3 h-3 text-zinc-600 group-hover:text-zinc-400"
                        >
                            <path d="m9 18 6-6-6-6"></path>
                        </svg>
                    </div>
                    <div class="text-[10px] text-zinc-600 font-mono">x 3</div>
                </div>
            </div>
        </div>

        <!-- Skills List -->
        <div class="divide-y divide-white/5">
            <!-- Item 1 -->
            <div
                class="p-5 hover:bg-white/[0.02] cursor-pointer group transition-colors"
            >
                <div class="flex items-center justify-between mb-1.5">
                    <h3
                        class="text-[11px] text-zinc-300 font-mono uppercase tracking-wide font-medium"
                    >
                        Developer Tooling &amp; CLI Extension Architecture
                    </h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        data-lucide="chevron-right"
                        aria-hidden="true"
                        class="lucide lucide-chevron-right w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5 duration-200"
                    >
                        <path d="m9 18 6-6-6-6"></path>
                    </svg>
                </div>
                <p
                    class="text-[11px] text-zinc-500/80 leading-relaxed font-normal"
                >
                    Builds plugin-based extensibility patterns leveraging
                    existing CLI ecosystems
                </p>
            </div>

            <!-- Item 2 -->
            <div
                class="p-5 hover:bg-white/[0.02] cursor-pointer group transition-colors"
            >
                <div class="flex items-center justify-between mb-1.5">
                    <h3
                        class="text-[11px] text-zinc-300 font-mono uppercase tracking-wide font-medium"
                    >
                        Algorithm Design &amp; Self-Optimizing Data Structures
                    </h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        data-lucide="chevron-right"
                        aria-hidden="true"
                        class="lucide lucide-chevron-right w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5 duration-200"
                    >
                        <path d="m9 18 6-6-6-6"></path>
                    </svg>
                </div>
                <p
                    class="text-[11px] text-zinc-500/80 leading-relaxed font-normal"
                >
                    Implements adaptive algorithms that optimize based on
                    runtime access patterns
                </p>
            </div>

            <!-- Item 3 -->
            <div
                class="p-5 hover:bg-white/[0.02] cursor-pointer group transition-colors"
            >
                <div class="flex items-center justify-between mb-1.5">
                    <h3
                        class="text-[11px] text-zinc-300 font-mono uppercase tracking-wide font-medium"
                    >
                        Real-Time Data Transformation &amp; Interactive
                        Visualization
                    </h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        data-lucide="chevron-right"
                        aria-hidden="true"
                        class="lucide lucide-chevron-right w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5 duration-200"
                    >
                        <path d="m9 18 6-6-6-6"></path>
                    </svg>
                </div>
                <p
                    class="text-[11px] text-zinc-500/80 leading-relaxed font-normal"
                >
                    Designs multi-format conversion pipelines for real-time data
                    transformation
                </p>
            </div>

            <!-- Item 4 -->
            <div
                class="p-5 hover:bg-white/[0.02] cursor-pointer group transition-colors"
            >
                <div class="flex items-center justify-between mb-1.5">
                    <h3
                        class="text-[11px] text-zinc-300 font-mono uppercase tracking-wide font-medium"
                    >
                        Language Tooling &amp; Configuration-Driven Systems
                    </h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        data-lucide="chevron-right"
                        aria-hidden="true"
                        class="lucide lucide-chevron-right w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5 duration-200"
                    >
                        <path d="m9 18 6-6-6-6"></path>
                    </svg>
                </div>
                <p
                    class="text-[11px] text-zinc-500/80 leading-relaxed font-normal"
                >
                    Works with compiler infrastructure and code formatting
                    toolchains
                </p>
            </div>

            <!-- Item 5 (Implicit to show list continues) -->
            <div
                class="p-5 hover:bg-white/[0.02] cursor-pointer group transition-colors opacity-50"
            >
                <div class="flex items-center justify-between mb-1.5">
                    <h3
                        class="text-[11px] uppercase font-medium text-zinc-300 tracking-wide font-mono"
                    >
                        Distributed Systems Consensus
                    </h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        data-lucide="chevron-right"
                        aria-hidden="true"
                        class="lucide lucide-chevron-right w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5 duration-200"
                    >
                        <path d="m9 18 6-6-6-6"></path>
                    </svg>
                </div>
                <p
                    class="text-[11px] text-zinc-500/80 leading-relaxed font-normal"
                >
                    Exploration of Raft and Paxos implementations in Rust
                    environments
                </p>
            </div>
        </div>
    </div>
</aside>
```
