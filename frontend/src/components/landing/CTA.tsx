import { useState } from 'react';

export function CTA() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email submission
    console.log('Email submitted:', email);
  };

  return (
    <section id="pricing" className="py-32 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl font-medium tracking-tight text-white mb-6">
          Ready to find the top 1%?
        </h2>
        <p className="text-[#888888] mb-10 font-light max-w-xl mx-auto">
          Start filtering through noise. Start seeing the signal in the code
          repository.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="work@company.com"
            className="flex-grow bg-[#0A0A0A] border border-white/10 rounded px-4 py-2.5 text-sm text-white focus:border-white/30 focus:outline-none transition-colors placeholder-[#444]"
          />
          <button
            type="submit"
            className="bg-white hover:bg-[#EDEDED] text-black font-medium px-5 py-2.5 rounded transition-colors text-sm whitespace-nowrap"
          >
            Get Started
          </button>
        </form>
        <p className="text-[10px] text-[#444444] mt-6">
          No credit card required for 14-day trial.
        </p>
      </div>
    </section>
  );
}
