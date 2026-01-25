import { Icon } from '../shared/Icon';

export function BentoGrid() {
  return (
    <section id="product" className="py-24 border-t border-white/5 bg-[#050505]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Feature 1 - Natural Language Search */}
          <div className="bento-card rounded-xl md:col-span-2 relative overflow-hidden group min-h-[340px] p-8 flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
              <Icon
                icon="solar:code-file-bold-duotone"
                width={120}
                className="rotate-12 translate-x-8 -translate-y-8"
              />
            </div>
            <div className="relative z-10 max-w-lg">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white mb-6">
                <Icon icon="solar:chat-line-linear" width={16} />
              </div>
              <h3 className="text-lg font-medium text-white mb-3 tracking-tight">
                Natural Language Search
              </h3>
              <p className="text-sm text-[#888888] font-light leading-relaxed mb-8">
                Query your candidate database like you talk to a coworker. Our LLM
                converts semantic requests into complex database filters instantly.
              </p>

              {/* Mini Code Interface */}
              <div className="bg-[#0F0F0F] border border-white/5 rounded-lg p-4 font-mono text-[11px] text-[#666] w-full max-w-md shadow-lg">
                <div className="flex gap-2 mb-2">
                  <span className="text-blue-400">user &gt;</span>
                  <span className="text-[#EDEDED]">
                    Find devs with &gt; 3 years Rust experience
                  </span>
                </div>
                <div className="flex gap-2 opacity-50">
                  <span className="text-green-400">sys &gt;</span>
                  <span>Analyzing 14,203 profiles...</span>
                </div>
                <div className="flex gap-2 mt-2 pt-2 border-t border-white/5 text-[#EDEDED]">
                  <span className="text-purple-400">result &gt;</span>
                  <span>Found 12 candidates matching "Rust" &amp;&amp; "Senior"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 - Velocity Metrics */}
          <div className="bento-card rounded-xl md:col-span-1 relative overflow-hidden group min-h-[340px] p-8">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white mb-6">
              <Icon icon="solar:graph-up-linear" width={16} />
            </div>
            <h3 className="text-lg font-medium text-white mb-3 tracking-tight">
              Velocity Metrics
            </h3>
            <p className="text-sm text-[#888888] font-light leading-relaxed">
              Measure impact, not hours. We visualize commit velocity and code churn.
            </p>

            <div className="mt-8 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-[#666] uppercase tracking-wider font-medium">
                <span>Commits / Week</span>
                <span className="text-green-400">+12%</span>
              </div>
              <div className="flex items-end gap-1 h-16 border-b border-white/5 pb-2">
                <div className="w-full bg-white/5 h-[30%] rounded-sm" />
                <div className="w-full bg-white/5 h-[50%] rounded-sm" />
                <div className="w-full bg-white/10 h-[40%] rounded-sm" />
                <div className="w-full bg-white/20 h-[70%] rounded-sm" />
                <div className="w-full bg-white/40 h-[60%] rounded-sm" />
                <div className="w-full bg-white h-[80%] rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
              </div>
            </div>
          </div>

          {/* Feature 3 - Team Fit Analysis */}
          <div className="bento-card rounded-xl md:col-span-1 relative overflow-hidden group min-h-[300px] p-8">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white mb-6">
              <Icon icon="solar:users-group-rounded-linear" width={16} />
            </div>
            <h3 className="text-lg font-medium text-white mb-3 tracking-tight">
              Team Fit Analysis
            </h3>
            <p className="text-sm text-[#888888] font-light leading-relaxed">
              AI agents predict cultural fit based on PR comment sentiment and
              collaboration patterns.
            </p>
          </div>

          {/* Feature 4 - Automated Vetting */}
          <div className="bento-card rounded-xl md:col-span-2 relative overflow-hidden group min-h-[300px] p-8 flex items-center">
            <div className="max-w-sm z-10">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white mb-6">
                <Icon icon="solar:shield-check-linear" width={16} />
              </div>
              <h3 className="text-lg font-medium text-white mb-3 tracking-tight">
                Automated Vetting
              </h3>
              <p className="text-sm text-[#888888] font-light leading-relaxed">
                Every profile is pre-scanned for code quality, security practices,
                and documentation standards before you ever see it.
              </p>
            </div>
            <div className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2">
              <div className="flex flex-col gap-3 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                <div className="flex items-center gap-3 bg-[#0F0F0F] border border-white/5 px-4 py-2 rounded text-xs text-[#888]">
                  <Icon icon="solar:check-circle-bold" className="text-green-500" />
                  <span>Clean Architecture</span>
                </div>
                <div className="flex items-center gap-3 bg-[#0F0F0F] border border-white/5 px-4 py-2 rounded text-xs text-[#888]">
                  <Icon icon="solar:check-circle-bold" className="text-green-500" />
                  <span>High Test Coverage</span>
                </div>
                <div className="flex items-center gap-3 bg-[#0F0F0F] border border-white/5 px-4 py-2 rounded text-xs text-[#888]">
                  <Icon icon="solar:check-circle-bold" className="text-green-500" />
                  <span>Consistent Styling</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
