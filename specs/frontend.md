# Frontend

## Objective

The objective of this feature is to build an asthetic landing page for my application. I'm providing the single HTML for the draft landing page for the application, I need you to create the same in react with tailwind CSS. Keep the code modular and as per the standards of writing good react frontend.

## HTML Code for website

```html
<html lang="en" class="antialiased scroll-smooth">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GitScout - AI Technical Recruiting</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossorigin=""
        />
        <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&amp;family=JetBrains+Mono:wght@400&amp;display=swap"
            rel="stylesheet"
        />
        <style>
            :root {
                --bg-body: #030303;
                --bg-card: #0a0a0a;
                --border-subtle: rgba(255, 255, 255, 0.06);
                --text-main: #ededed;
                --text-muted: #888888;
                --accent-glow: rgba(255, 255, 255, 0.08);
            }
            body {
                background-color: var(--bg-body);
                font-family: "Inter", sans-serif;
                color: var(--text-main);
                background-image: radial-gradient(
                    circle at 50% 0%,
                    rgba(255, 255, 255, 0.03) 0%,
                    transparent 40%
                );
            }
            .font-mono {
                font-family: "JetBrains Mono", monospace;
            }
            /* Glass Navigation */
            .nav-glass {
                background: rgba(3, 3, 3, 0.6);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border-bottom: 1px solid var(--border-subtle);
            }
            /* Custom Accordion Animation */
            details > summary {
                list-style: none;
            }
            details > summary::-webkit-details-marker {
                display: none;
            }
            details[open] summary ~ * {
                animation: sweep 0.3s ease-in-out;
            }
            @keyframes sweep {
                0% {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .bento-card {
                background: linear-gradient(
                    180deg,
                    rgba(20, 20, 20, 0.6) 0%,
                    rgba(10, 10, 10, 0.4) 100%
                );
                border: 1px solid var(--border-subtle);
                box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
                transition: border-color 0.3s ease;
            }
            .bento-card:hover {
                border-color: rgba(255, 255, 255, 0.12);
            }
            /* Subtle Noise Texture */
            .noise {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 50;
                opacity: 0.03;
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            }
        </style>
    </head>
    <body
        class="min-h-screen flex flex-col overflow-x-hidden selection:bg-white/20 selection:text-white"
    >
        <div class="noise"></div>

        <!-- Sticky Glass Navigation -->
        <nav
            class="fixed top-0 w-full z-50 nav-glass transition-all duration-300"
        >
            <div
                class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between"
            >
                <a href="#" class="flex items-center gap-2 group">
                    <div
                        class="w-6 h-6 rounded flex items-center justify-center bg-white text-black"
                    >
                        <iconify-icon
                            icon="solar:code-scan-bold"
                            class="text-sm"
                        ></iconify-icon>
                    </div>
                    <span
                        class="font-medium tracking-tight text-sm text-white/90"
                        >GitScout</span
                    >
                </a>

                <div
                    class="hidden md:flex items-center gap-6 text-[13px] font-medium text-[#888888]"
                >
                    <a
                        href="#product"
                        class="hover:text-white transition-colors duration-200"
                        >Product</a
                    >
                    <a
                        href="#workflow"
                        class="hover:text-white transition-colors duration-200"
                        >Methodology</a
                    >
                    <a
                        href="#faq"
                        class="hover:text-white transition-colors duration-200"
                        >FAQ</a
                    >
                    <a
                        href="#pricing"
                        class="hover:text-white transition-colors duration-200"
                        >Pricing</a
                    >
                </div>

                <div class="flex items-center gap-3">
                    <a
                        href="#"
                        class="text-[13px] font-medium text-[#888888] hover:text-white transition-colors hidden sm:block"
                        >Log in</a
                    >
                    <a
                        href="#"
                        class="bg-[#EDEDED] hover:bg-white text-black text-[13px] font-medium px-3 py-1.5 rounded transition-colors tracking-tight"
                    >
                        Start Hiring
                    </a>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <main class="flex-grow pt-32 pb-20 relative">
            <div
                class="max-w-6xl mx-auto px-6 flex flex-col items-center text-center"
            >
                <!-- Badge -->
                <div
                    class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] mb-8"
                >
                    <span
                        class="text-[11px] font-medium tracking-wide text-[#888888] uppercase"
                        >Introducing Agent 2.0</span
                    >
                </div>

                <h1
                    class="text-5xl md:text-7xl font-medium tracking-tight text-white mb-8 max-w-4xl leading-[1.05]"
                >
                    Technical recruiting,<br />
                    <span class="text-[#666666]">decoded by code.</span>
                </h1>

                <p
                    class="text-lg text-[#888888] max-w-2xl mb-12 font-light leading-relaxed"
                >
                    Stop keyword matching. Start logic matching. GitScout
                    analyzes repositories, commits, and architectural decisions
                    to find engineers who actually write the code you need.
                </p>

                <!-- Search UI -->
                <div class="w-full max-w-2xl relative group mb-20">
                    <div
                        class="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition duration-700"
                    ></div>
                    <div
                        class="relative bg-[#0A0A0A] rounded-xl border border-white/10 p-1.5 flex items-center shadow-2xl ring-1 ring-white/5"
                    >
                        <div class="pl-3 pr-2 text-[#444444]">
                            <iconify-icon
                                icon="solar:magnifer-linear"
                                width="18"
                            ></iconify-icon>
                        </div>
                        <input
                            type="text"
                            class="w-full bg-transparent border-none outline-none text-[13px] text-white placeholder-[#444444] h-9 font-mono"
                            placeholder='Try "Find a React dev who contributes to high-traffic open-source projects..."'
                            readonly=""
                        />
                        <div class="hidden sm:flex items-center gap-1 pr-2">
                            <span
                                class="text-[10px] text-[#444444] border border-[#333] rounded px-1.5 py-0.5"
                                >⌘ K</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Logos -->
                <div class="w-full border-t border-white/5 pt-12">
                    <p
                        class="text-[11px] font-medium text-[#444444] uppercase tracking-widest mb-8"
                    >
                        Trusted by engineering teams at
                    </p>
                    <div
                        class="flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-40 grayscale"
                    >
                        <iconify-icon
                            icon="simple-icons:vercel"
                            width="22"
                            class="hover:text-white transition-colors duration-300"
                        ></iconify-icon>
                        <iconify-icon
                            icon="simple-icons:linear"
                            width="22"
                            class="hover:text-white transition-colors duration-300"
                        ></iconify-icon>
                        <iconify-icon
                            icon="simple-icons:stripe"
                            width="22"
                            class="hover:text-white transition-colors duration-300"
                        ></iconify-icon>
                        <iconify-icon
                            icon="simple-icons:raycast"
                            width="22"
                            class="hover:text-white transition-colors duration-300"
                        ></iconify-icon>
                        <iconify-icon
                            icon="simple-icons:github"
                            width="22"
                            class="hover:text-white transition-colors duration-300"
                        ></iconify-icon>
                    </div>
                </div>
            </div>
        </main>

        <!-- Bento Grid -->
        <section
            id="product"
            class="py-24 border-t border-white/5 bg-[#050505]"
        >
            <div class="max-w-6xl mx-auto px-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <!-- Feature 1 -->
                    <div
                        class="bento-card rounded-xl md:col-span-2 relative overflow-hidden group min-h-[340px] p-8 flex flex-col"
                    >
                        <div
                            class="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                        >
                            <iconify-icon
                                icon="solar:code-file-bold-duotone"
                                width="120"
                                class="rotate-12 translate-x-8 -translate-y-8"
                            ></iconify-icon>
                        </div>
                        <div class="relative z-10 max-w-lg">
                            <div
                                class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white mb-6"
                            >
                                <iconify-icon
                                    icon="solar:chat-line-linear"
                                    width="16"
                                ></iconify-icon>
                            </div>
                            <h3
                                class="text-lg font-medium text-white mb-3 tracking-tight"
                            >
                                Natural Language Search
                            </h3>
                            <p
                                class="text-sm text-[#888888] font-light leading-relaxed mb-8"
                            >
                                Query your candidate database like you talk to a
                                coworker. Our LLM converts semantic requests
                                into complex database filters instantly.
                            </p>

                            <!-- Mini Code Interface -->
                            <div
                                class="bg-[#0F0F0F] border border-white/5 rounded-lg p-4 font-mono text-[11px] text-[#666] w-full max-w-md shadow-lg"
                            >
                                <div class="flex gap-2 mb-2">
                                    <span class="text-blue-400">user &gt;</span>
                                    <span class="text-[#EDEDED]"
                                        >Find devs with &gt; 3 years Rust
                                        experience</span
                                    >
                                </div>
                                <div class="flex gap-2 opacity-50">
                                    <span class="text-green-400">sys &gt;</span>
                                    <span>Analyzing 14,203 profiles...</span>
                                </div>
                                <div
                                    class="flex gap-2 mt-2 pt-2 border-t border-white/5 text-[#EDEDED]"
                                >
                                    <span class="text-purple-400"
                                        >result &gt;</span
                                    >
                                    <span
                                        >Found 12 candidates matching "Rust"
                                        &amp;&amp; "Senior"</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Feature 2 -->
                    <div
                        class="bento-card rounded-xl md:col-span-1 relative overflow-hidden group min-h-[340px] p-8"
                    >
                        <div
                            class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white mb-6"
                        >
                            <iconify-icon
                                icon="solar:graph-up-linear"
                                width="16"
                            ></iconify-icon>
                        </div>
                        <h3
                            class="text-lg font-medium text-white mb-3 tracking-tight"
                        >
                            Velocity Metrics
                        </h3>
                        <p
                            class="text-sm text-[#888888] font-light leading-relaxed"
                        >
                            Measure impact, not hours. We visualize commit
                            velocity and code churn.
                        </p>

                        <div class="mt-8 space-y-2">
                            <div
                                class="flex items-center justify-between text-[10px] text-[#666] uppercase tracking-wider font-medium"
                            >
                                <span>Commits / Week</span>
                                <span class="text-green-400">+12%</span>
                            </div>
                            <div
                                class="flex items-end gap-1 h-16 border-b border-white/5 pb-2"
                            >
                                <div
                                    class="w-full bg-white/5 h-[30%] rounded-sm"
                                ></div>
                                <div
                                    class="w-full bg-white/5 h-[50%] rounded-sm"
                                ></div>
                                <div
                                    class="w-full bg-white/10 h-[40%] rounded-sm"
                                ></div>
                                <div
                                    class="w-full bg-white/20 h-[70%] rounded-sm"
                                ></div>
                                <div
                                    class="w-full bg-white/40 h-[60%] rounded-sm"
                                ></div>
                                <div
                                    class="w-full bg-white h-[80%] rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                ></div>
                            </div>
                        </div>
                    </div>

                    <!-- Feature 3 -->
                    <div
                        class="bento-card rounded-xl md:col-span-1 relative overflow-hidden group min-h-[300px] p-8"
                    >
                        <div
                            class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white mb-6"
                        >
                            <iconify-icon
                                icon="solar:users-group-rounded-linear"
                                width="16"
                            ></iconify-icon>
                        </div>
                        <h3
                            class="text-lg font-medium text-white mb-3 tracking-tight"
                        >
                            Team Fit Analysis
                        </h3>
                        <p
                            class="text-sm text-[#888888] font-light leading-relaxed"
                        >
                            AI agents predict cultural fit based on PR comment
                            sentiment and collaboration patterns.
                        </p>
                    </div>

                    <!-- Feature 4 -->
                    <div
                        class="bento-card rounded-xl md:col-span-2 relative overflow-hidden group min-h-[300px] p-8 flex items-center"
                    >
                        <div class="max-w-sm z-10">
                            <div
                                class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white mb-6"
                            >
                                <iconify-icon
                                    icon="solar:shield-check-linear"
                                    width="16"
                                ></iconify-icon>
                            </div>
                            <h3
                                class="text-lg font-medium text-white mb-3 tracking-tight"
                            >
                                Automated Vetting
                            </h3>
                            <p
                                class="text-sm text-[#888888] font-light leading-relaxed"
                            >
                                Every profile is pre-scanned for code quality,
                                security practices, and documentation standards
                                before you ever see it.
                            </p>
                        </div>
                        <div
                            class="hidden md:block absolute right-8 top-1/2 -translate-y-1/2"
                        >
                            <div
                                class="flex flex-col gap-3 opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                            >
                                <div
                                    class="flex items-center gap-3 bg-[#0F0F0F] border border-white/5 px-4 py-2 rounded text-xs text-[#888]"
                                >
                                    <iconify-icon
                                        icon="solar:check-circle-bold"
                                        class="text-green-500"
                                    ></iconify-icon>
                                    <span>Clean Architecture</span>
                                </div>
                                <div
                                    class="flex items-center gap-3 bg-[#0F0F0F] border border-white/5 px-4 py-2 rounded text-xs text-[#888]"
                                >
                                    <iconify-icon
                                        icon="solar:check-circle-bold"
                                        class="text-green-500"
                                    ></iconify-icon>
                                    <span>High Test Coverage</span>
                                </div>
                                <div
                                    class="flex items-center gap-3 bg-[#0F0F0F] border border-white/5 px-4 py-2 rounded text-xs text-[#888]"
                                >
                                    <iconify-icon
                                        icon="solar:check-circle-bold"
                                        class="text-green-500"
                                    ></iconify-icon>
                                    <span>Consistent Styling</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Methodology Section (New) -->
        <section
            id="workflow"
            class="py-24 border-t border-white/5 bg-[#030303]"
        >
            <div class="max-w-6xl mx-auto px-6">
                <div class="mb-16 md:text-center max-w-2xl mx-auto">
                    <h2
                        class="text-2xl md:text-3xl font-medium tracking-tight text-white mb-4"
                    >
                        From repo to hired.
                    </h2>
                    <p class="text-[#888888] font-light">
                        We don't just scrape LinkedIn. We build a comprehensive
                        graph of a developer's true capabilities.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                    <!-- Connecting Line -->
                    <div
                        class="hidden md:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    ></div>

                    <!-- Step 1 -->
                    <div class="relative pt-8">
                        <div
                            class="absolute top-0 left-0 md:left-1/2 md:-translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#030303] border border-white/20 z-10 flex items-center justify-center"
                        >
                            <div
                                class="w-1.5 h-1.5 rounded-full bg-white"
                            ></div>
                        </div>
                        <div class="md:text-center">
                            <h4
                                class="text-white font-medium mb-2 tracking-tight"
                            >
                                1. Source
                            </h4>
                            <p class="text-sm text-[#888888] leading-relaxed">
                                We ingest public data from GitHub, GitLab, and
                                Bitbucket, indexing millions of commits daily.
                            </p>
                        </div>
                    </div>

                    <!-- Step 2 -->
                    <div class="relative pt-8">
                        <div
                            class="absolute top-0 left-0 md:left-1/2 md:-translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#030303] border border-white/20 z-10 flex items-center justify-center"
                        >
                            <div
                                class="w-1.5 h-1.5 rounded-full bg-[#666]"
                            ></div>
                        </div>
                        <div class="md:text-center">
                            <h4
                                class="text-white font-medium mb-2 tracking-tight"
                            >
                                2. Analyze
                            </h4>
                            <p class="text-sm text-[#888888] leading-relaxed">
                                Our LLMs read the code to understand
                                architectural patterns, complexity, and language
                                proficiency.
                            </p>
                        </div>
                    </div>

                    <!-- Step 3 -->
                    <div class="relative pt-8">
                        <div
                            class="absolute top-0 left-0 md:left-1/2 md:-translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#030303] border border-white/20 z-10 flex items-center justify-center"
                        >
                            <div
                                class="w-1.5 h-1.5 rounded-full bg-[#666]"
                            ></div>
                        </div>
                        <div class="md:text-center">
                            <h4
                                class="text-white font-medium mb-2 tracking-tight"
                            >
                                3. Verify
                            </h4>
                            <p class="text-sm text-[#888888] leading-relaxed">
                                We cross-reference with social graphs to ensure
                                the candidate is active and open to
                                opportunities.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- FAQ Section (New) -->
        <section id="faq" class="py-24 border-t border-white/5 bg-[#050505]">
            <div class="max-w-3xl mx-auto px-6">
                <h2
                    class="text-2xl font-medium tracking-tight text-white mb-10"
                >
                    Frequently asked questions
                </h2>

                <div class="space-y-4">
                    <!-- Q1 -->
                    <details
                        class="group bento-card rounded-lg overflow-hidden"
                    >
                        <summary
                            class="flex items-center justify-between cursor-pointer p-5 bg-transparent hover:bg-white/[0.02] transition-colors"
                        >
                            <span class="text-sm font-medium text-[#EDEDED]"
                                >Where does the data come from?</span
                            >
                            <iconify-icon
                                icon="solar:alt-arrow-down-linear"
                                class="text-[#888] transition-transform duration-300 group-open:rotate-180"
                            ></iconify-icon>
                        </summary>
                        <div class="px-5 pb-5 pt-0">
                            <p class="text-sm text-[#888888] leading-relaxed">
                                Gitscout aggregates publicly available data from
                                global version-control platforms including
                                GitHub, GitLab, and Bitbucket. We only index
                                public repositories and contribution histories
                                that developers have chosen to share with the
                                community.
                            </p>
                        </div>
                    </details>

                    <!-- Q2 -->
                    <details
                        class="group bento-card rounded-lg overflow-hidden"
                    >
                        <summary
                            class="flex items-center justify-between cursor-pointer p-5 bg-transparent hover:bg-white/[0.02] transition-colors"
                        >
                            <span class="text-sm font-medium text-[#EDEDED]"
                                >Is this GDPR compliant?</span
                            >
                            <iconify-icon
                                icon="solar:alt-arrow-down-linear"
                                class="text-[#888] transition-transform duration-300 group-open:rotate-180"
                            ></iconify-icon>
                        </summary>
                        <div class="px-5 pb-5 pt-0">
                            <p class="text-sm text-[#888888] leading-relaxed">
                                Yes. We take privacy seriously. Gitscout is
                                fully GDPR and CCPA compliant. We process public
                                data under legitimate interest for professional
                                recruitment purposes, and we provide a simple
                                "opt-out" mechanism for any developer who wishes
                                to have their profile removed from our index.
                            </p>
                        </div>
                    </details>

                    <!-- Q3 -->
                    <details
                        class="group bento-card rounded-lg overflow-hidden"
                    >
                        <summary
                            class="flex items-center justify-between cursor-pointer p-5 bg-transparent hover:bg-white/[0.02] transition-colors"
                        >
                            <span class="text-sm font-medium text-[#EDEDED]"
                                >How does the AI "analyze" code?</span
                            >
                            <iconify-icon
                                icon="solar:alt-arrow-down-linear"
                                class="text-[#888] transition-transform duration-300 group-open:rotate-180"
                            ></iconify-icon>
                        </summary>
                        <div class="px-5 pb-5 pt-0">
                            <p class="text-sm text-[#888888] leading-relaxed">
                                We use Large Language Models (LLMs) specifically
                                trained on programming languages to understand
                                the "intent" and "complexity" of code. It looks
                                at factors like modularity, security practices,
                                and how a developer handles edge cases, rather
                                than just counting the number of lines written.
                            </p>
                        </div>
                    </details>

                    <!-- Q4 -->
                    <details
                        class="group bento-card rounded-lg overflow-hidden"
                    >
                        <summary
                            class="flex items-center justify-between cursor-pointer p-5 bg-transparent hover:bg-white/[0.02] transition-colors"
                        >
                            <span class="text-sm font-medium text-[#EDEDED]"
                                >Can I integrate this with my ATS?</span
                            >
                            <iconify-icon
                                icon="solar:alt-arrow-down-linear"
                                class="text-[#888] transition-transform duration-300 group-open:rotate-180"
                            ></iconify-icon>
                        </summary>
                        <div class="px-5 pb-5 pt-0">
                            <p class="text-sm text-[#888888] leading-relaxed">
                                Absolutely. Gitscout offers one-click exports
                                and API integrations with major Applicant
                                Tracking Systems (ATS) like Greenhouse, Lever,
                                and Ashby.
                            </p>
                        </div>
                    </details>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="py-32 border-t border-white/5 relative overflow-hidden">
            <div
                class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none"
            ></div>
            <div class="max-w-4xl mx-auto px-6 text-center relative z-10">
                <h2 class="text-4xl font-medium tracking-tight text-white mb-6">
                    Ready to find the top 1%?
                </h2>
                <p class="text-[#888888] mb-10 font-light max-w-xl mx-auto">
                    Start filtering through noise. Start seeing the signal in
                    the code repository.
                </p>

                <form class="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
                    <input
                        type="email"
                        placeholder="work@company.com"
                        class="flex-grow bg-[#0A0A0A] border border-white/10 rounded px-4 py-2.5 text-sm text-white focus:border-white/30 focus:outline-none transition-colors placeholder-[#444]"
                    />
                    <button
                        type="button"
                        class="bg-white hover:bg-[#EDEDED] text-black font-medium px-5 py-2.5 rounded transition-colors text-sm whitespace-nowrap"
                    >
                        Get Started
                    </button>
                </form>
                <p class="text-[10px] text-[#444444] mt-6">
                    No credit card required for 14-day trial.
                </p>
            </div>
        </section>

        <!-- Footer -->
        <footer class="border-t border-white/5 py-12 bg-[#030303]">
            <div
                class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6"
            >
                <div
                    class="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                >
                    <div
                        class="w-5 h-5 rounded flex items-center justify-center bg-[#333] text-white"
                    >
                        <iconify-icon
                            icon="solar:code-scan-bold"
                            class="text-[10px]"
                        ></iconify-icon>
                    </div>
                    <span class="font-medium tracking-tight text-xs text-[#888]"
                        >GitScout Inc.</span
                    >
                </div>

                <div
                    class="flex gap-8 text-[11px] text-[#666] font-medium uppercase tracking-wider"
                >
                    <a href="#" class="hover:text-white transition-colors"
                        >Privacy</a
                    >
                    <a href="#" class="hover:text-white transition-colors"
                        >Terms</a
                    >
                    <a href="#" class="hover:text-white transition-colors"
                        >Twitter</a
                    >
                    <a href="#" class="hover:text-white transition-colors"
                        >GitHub</a
                    >
                </div>

                <p class="text-[11px] text-[#444444]">© 2024</p>
            </div>
        </footer>
    </body>
</html>
```
