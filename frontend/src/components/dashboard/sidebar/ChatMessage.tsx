import type { ChatMessage as ChatMessageType } from '../../../types/dashboard';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.type === 'user') {
    return (
      <div className="flex flex-col items-end">
        <div className="text-[10px] text-gs-text-muted mb-1 mr-1">You</div>
        <div className="chat-user-message text-xs p-3 shadow-lg max-w-[90%] leading-relaxed font-medium">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.type === 'step' && message.steps) {
    // Group steps into rows of 2
    const stepRows: typeof message.steps[] = [];
    for (let i = 0; i < message.steps.length; i += 2) {
      stepRows.push(message.steps.slice(i, i + 2));
    }

    return (
      <div className="pl-4 space-y-2.5">
        {stepRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {row.map((step) => (
              <div key={step.id} className="step-chip">
                <span className="step-chip-dot" />
                {step.label}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (message.type === 'ai') {
    return (
      <div className="flex flex-col items-start max-w-[95%]">
        <div className="flex items-center justify-between w-full mb-1">
          <span className="text-[10px] text-gs-text-muted ml-1">AI Assistant</span>
          <button className="text-[10px] text-gs-text-dim hover:text-gs-text-muted transition-colors">
            Copy
          </button>
        </div>
        <div className="chat-ai-message text-gs-text-main text-xs p-3 shadow-sm leading-relaxed font-mono">
          {message.content}
        </div>
      </div>
    );
  }

  return null;
}
