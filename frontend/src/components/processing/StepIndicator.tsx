export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

interface StepIndicatorProps {
  steps: ProcessingStep[];
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="flex flex-col gap-2">
      {steps.map((step) => (
        <div
          key={step.id}
          className={`
            flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-300
            ${step.status === 'active' ? 'bg-white/[0.03]' : ''}
          `}
        >
          {/* Status indicator */}
          <div
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${step.status === 'complete' ? 'bg-emerald-500' : ''}
              ${step.status === 'active' ? 'bg-white animate-pulse' : ''}
              ${step.status === 'pending' ? 'bg-[#333333]' : ''}
            `}
          />

          {/* Step label */}
          <span
            className={`
              text-[12px] font-mono tracking-wide transition-colors duration-300
              ${step.status === 'complete' ? 'text-[#666666]' : ''}
              ${step.status === 'active' ? 'text-white' : ''}
              ${step.status === 'pending' ? 'text-[#444444]' : ''}
            `}
          >
            {step.label}
          </span>

          {/* Checkmark for completed */}
          {step.status === 'complete' && (
            <svg
              className="w-3 h-3 text-emerald-500 ml-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
