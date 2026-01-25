export function Methodology() {
  const steps = [
    {
      number: 1,
      title: 'Source',
      description:
        'We ingest public data from GitHub, GitLab, and Bitbucket, indexing millions of commits daily.',
      dotClass: 'bg-white',
    },
    {
      number: 2,
      title: 'Analyze',
      description:
        'Our LLMs read the code to understand architectural patterns, complexity, and language proficiency.',
      dotClass: 'bg-[#666]',
    },
    {
      number: 3,
      title: 'Verify',
      description:
        'We cross-reference with social graphs to ensure the candidate is active and open to opportunities.',
      dotClass: 'bg-[#666]',
    },
  ];

  return (
    <section id="workflow" className="py-24 border-t border-white/5 bg-[#030303]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-16 md:text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-white mb-4">
            From repo to hired.
          </h2>
          <p className="text-[#888888] font-light">
            We don't just scrape LinkedIn. We build a comprehensive graph of a
            developer's true capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {steps.map((step) => (
            <div key={step.number} className="relative pt-8">
              <div className="absolute top-0 left-0 md:left-1/2 md:-translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#030303] border border-white/20 z-10 flex items-center justify-center">
                <div className={`w-1.5 h-1.5 rounded-full ${step.dotClass}`} />
              </div>
              <div className="md:text-center">
                <h4 className="text-white font-medium mb-2 tracking-tight">
                  {step.number}. {step.title}
                </h4>
                <p className="text-sm text-[#888888] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
