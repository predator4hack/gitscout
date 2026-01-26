import { useState } from 'react';
import { Icon } from '../../shared/Icon';
import type { SuggestionChip } from '../../../types/dashboard';

interface ChatInputProps {
  suggestions: SuggestionChip[];
}

export function ChatInput({ suggestions }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="p-4 border-t border-white/[0.06] bg-gs-card">
      {/* Suggestion Chips */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 dashboard-scrollbar">
        {suggestions.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setInputValue(chip.prompt)}
            className="suggestion-chip"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="relative bg-gs-card border border-white/[0.06] rounded-lg p-2 focus-within:border-white/[0.12] transition-colors">
        <textarea
          rows={2}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full bg-transparent text-sm text-gs-text-main placeholder-gs-text-darker resize-none outline-none font-medium px-1"
          placeholder="Ask me anything about your contributors... (type @ to mention)"
        />

        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-[10px] font-medium text-gs-text-muted bg-white/5 border border-white/[0.06] px-2 py-1 rounded hover:bg-white/10 transition-colors">
              <Icon icon="lucide:sparkles" className="w-3 h-3 text-gs-purple" />
              Agent
              <Icon icon="lucide:chevron-down" className="w-3 h-3 ml-0.5" />
            </button>
            <button className="p-1.5 text-gs-text-muted hover:text-gs-text-main hover:bg-white/[0.06] rounded transition-colors">
              <Icon icon="lucide:paperclip" className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            disabled={!inputValue.trim()}
            className="p-1.5 bg-white/10 text-white/50 rounded hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="lucide:arrow-up" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
