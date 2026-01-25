import { Icon } from '../shared/Icon';

export function BentoGrid() {
  return (
    <section id="product" className="py-24 border-t border-white/5 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-white mb-4">
            Search deeper than the headline.
          </h2>
          <p className="text-zinc-400 max-w-xl">
            Our AI agents read code, not just resumes. We verify actual proficiency by
            analyzing open source contributions and commit history.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Natural Language Search (Large) */}
          <div className="bento-card rounded-2xl md:col-span-2 relative overflow-hidden group min-h-[320px] flex flex-col justify-between p-8">
            <div className="shimmer" />
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800/50 border border-white/5 text-[#D591FE]">
                <Icon icon="solar:chat-round-line-linear" width={20} />
              </div>
              <h3 className="text-xl font-medium text-white mb-2 tracking-tight">
                Search like a Lead Engineer.
              </h3>
              <p className="text-sm text-zinc-400 font-light max-w-md">
                Stop wrestling with Boolean strings. Ask for what you need:
                "Find a React developer who understands low-latency architecture."
              </p>
            </div>

            {/* UI Visualization */}
            <div className="mt-8 relative w-full bg-[#16181C] border border-white/5 rounded-lg p-4 font-mono text-xs shadow-lg translate-y-4 group-hover:translate-y-2 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                <div className="w-2 h-2 rounded-full bg-red-500/20" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                <div className="w-2 h-2 rounded-full bg-green-500/20" />
                <span className="ml-auto text-zinc-600">agent_search.ts</span>
              </div>
              <div className="text-zinc-400">
                <span className="text-purple-400">Query:</span> "High-traffic open source contributor"<br />
                <span className="text-blue-400">Analyzing:</span> GitHub, GitLab, BitBucket...<br />
                <span className="text-green-400">Found:</span> 12 candidates matching architecture patterns.
              </div>
            </div>
          </div>

          {/* Card 2: Commit Level Analysis */}
          <div className="bento-card rounded-2xl md:col-span-1 relative overflow-hidden group min-h-[320px] flex flex-col p-8">
            <div className="shimmer" />
            <div className="mb-auto">
              <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800/50 border border-white/5 text-[#00FFD1]">
                <Icon icon="solar:git-commit-linear" width={20} />
              </div>
              <h3 className="text-xl font-medium text-white mb-2 tracking-tight">
                Commit-Level Analysis
              </h3>
              <p className="text-sm text-zinc-400 font-light">
                The proof is in the repo. We look at logic, commit frequency, and PR
                complexity.
              </p>
            </div>

            {/* Graph Visualization */}
            <div className="mt-6 flex items-end gap-1 h-24 w-full">
              <div className="w-full bg-[#1E2125] rounded-sm relative overflow-hidden h-full flex items-end gap-[2px] opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-[30%] bg-zinc-700 rounded-t-sm" />
                <div className="w-1.5 h-[50%] bg-zinc-700 rounded-t-sm" />
                <div className="w-1.5 h-[40%] bg-zinc-700 rounded-t-sm" />
                <div className="w-1.5 h-[80%] bg-green-500/80 rounded-t-sm shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                <div className="w-1.5 h-[60%] bg-zinc-700 rounded-t-sm" />
                <div className="w-1.5 h-[45%] bg-zinc-700 rounded-t-sm" />
                <div className="w-1.5 h-[90%] bg-green-500/80 rounded-t-sm shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                <div className="w-1.5 h-[20%] bg-zinc-700 rounded-t-sm" />
                <div className="w-1.5 h-[35%] bg-zinc-700 rounded-t-sm" />
                <div className="w-1.5 h-[75%] bg-green-500/80 rounded-t-sm shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                <div className="w-1.5 h-[50%] bg-zinc-700 rounded-t-sm" />
                <div className="w-1.5 h-[40%] bg-zinc-700 rounded-t-sm" />
              </div>
            </div>
          </div>

          {/* Card 3: Multi-Agent Ranking */}
          <div className="bento-card rounded-2xl md:col-span-1 relative overflow-hidden group min-h-[320px] flex flex-col p-8">
            <div className="shimmer" />
            <div className="mb-6">
              <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800/50 border border-white/5 text-blue-400">
                <Icon icon="solar:users-group-rounded-linear" width={20} />
              </div>
              <h3 className="text-xl font-medium text-white mb-2 tracking-tight">
                Multi-Agent Ranking
              </h3>
              <p className="text-sm text-zinc-400 font-light">
                An AI-powered technical interview—before the first call. Agents
                debate candidate quality.
              </p>
            </div>

            {/* Agents Visual */}
            <div className="mt-auto flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-[#16181C] p-2 rounded-lg border border-white/5">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-400">
                  A1
                </div>
                <div className="h-1.5 w-16 bg-zinc-800 rounded-full" />
                <div className="ml-auto text-[10px] text-green-400 font-mono">98/100</div>
              </div>
              <div className="flex items-center gap-3 bg-[#16181C] p-2 rounded-lg border border-white/5">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px] text-rose-400">
                  A2
                </div>
                <div className="h-1.5 w-24 bg-zinc-800 rounded-full" />
                <div className="ml-auto text-[10px] text-yellow-400 font-mono">84/100</div>
              </div>
            </div>
          </div>

          {/* Card 4: Email Drafts */}
          <div className="bento-card rounded-2xl md:col-span-2 relative overflow-hidden group min-h-[320px] flex flex-col md:flex-row items-center p-0">
            <div className="shimmer" />
            <div className="p-8 md:w-1/2 z-10">
              <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800/50 border border-white/5 text-orange-400">
                <Icon icon="solar:letter-linear" width={20} />
              </div>
              <h3 className="text-xl font-medium text-white mb-2 tracking-tight">
                Draft &amp; Send Emails
              </h3>
              <p className="text-sm text-zinc-400 font-light">
                Avoid the "spam" folder. GitScout drafts hyper-personalized emails
                referencing specific code contributions.
              </p>
            </div>

            <div className="md:w-1/2 h-full bg-[#16181C] border-l border-white/5 p-6 flex flex-col justify-center relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Icon icon="solar:plain-bold" width={60} />
              </div>
              <div className="space-y-3 font-mono text-[10px] text-zinc-400">
                <div className="flex gap-2">
                  <span className="text-zinc-600">To:</span>
                  <span>alex.dev@gmail.com</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-zinc-600">Subject:</span>
                  <span className="text-white">Regarding your contribution to React 18...</span>
                </div>
                <div className="h-px w-full bg-white/5 my-2" />
                <p className="leading-relaxed opacity-70">
                  Hi Alex,<br /><br />
                  I noticed your recent commit optimizing the concurrent renderer. We're solving a similar race condition at GitScout...
                </p>
                <button className="mt-4 bg-white text-black px-3 py-1.5 rounded text-xs font-semibold w-fit">
                  Send via Gmail
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
