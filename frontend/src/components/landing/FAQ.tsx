import { useState } from 'react';
import { Icon } from '../shared/Icon';

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bento-card rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between cursor-pointer p-5 bg-transparent hover:bg-white/[0.02] transition-colors text-left"
      >
        <span className="text-sm font-medium text-[#EDEDED]">{question}</span>
        <Icon
          icon="solar:alt-arrow-down-linear"
          className={`text-[#888] transition-transform duration-300 flex-shrink-0 ml-4 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-0 animate-sweep">
          <p className="text-sm text-[#888888] leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

const faqData = [
  {
    question: 'Where does the data come from?',
    answer:
      'Gitscout aggregates publicly available data from global version-control platforms including GitHub, GitLab, and Bitbucket. We only index public repositories and contribution histories that developers have chosen to share with the community.',
  },
  {
    question: 'Is this GDPR compliant?',
    answer:
      'Yes. We take privacy seriously. Gitscout is fully GDPR and CCPA compliant. We process public data under legitimate interest for professional recruitment purposes, and we provide a simple "opt-out" mechanism for any developer who wishes to have their profile removed from our index.',
  },
  {
    question: 'How does the AI "analyze" code?',
    answer:
      'We use Large Language Models (LLMs) specifically trained on programming languages to understand the "intent" and "complexity" of code. It looks at factors like modularity, security practices, and how a developer handles edge cases, rather than just counting the number of lines written.',
  },
  {
    question: 'Can I integrate this with my ATS?',
    answer:
      'Absolutely. Gitscout offers one-click exports and API integrations with major Applicant Tracking Systems (ATS) like Greenhouse, Lever, and Ashby.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 border-t border-white/5 bg-[#050505]">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-2xl font-medium tracking-tight text-white mb-10">
          Frequently asked questions
        </h2>

        <div className="space-y-4">
          {faqData.map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
