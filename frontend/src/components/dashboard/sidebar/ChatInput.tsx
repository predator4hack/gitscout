import { useState, KeyboardEvent } from 'react';
import { Icon } from '../../shared/Icon';
import type { SuggestionChip } from '../../../types/dashboard';

interface ChatInputProps {
  suggestions: SuggestionChip[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ suggestions, onSendMessage, disabled = false }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    onSendMessage(prompt);
  };

  return (
    <div className="p-4 border-t border-white/[0.06] bg-gs-card">
      {/* Suggestion Chips */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 dashboard-scrollbar">
        {suggestions.map((chip) => (
          <button
            key={chip.id}
            onClick={() => handleSuggestionClick(chip.prompt)}
            disabled={disabled}
            className="suggestion-chip disabled:opacity-50 disabled:cursor-not-allowed"
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
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-full bg-transparent text-sm text-gs-text-main placeholder-gs-text-darker resize-none outline-none font-medium px-1 disabled:opacity-50"
          placeholder="Ask me to filter candidates or draft an email..."
        />

        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-[10px] font-medium text-gs-text-muted bg-white/5 border border-white/[0.06] px-2 py-1 rounded hover:bg-white/10 transition-colors">
              <Icon icon="lucide:sparkles" className="w-3 h-3 text-gs-purple" />
              Agent
              <Icon icon="lucide:chevron-down" className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || disabled}
            className="p-1.5 bg-white/10 text-white/50 rounded hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="lucide:arrow-up" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
