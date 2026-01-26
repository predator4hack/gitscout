interface ProgressBarProps {
  progress: number;
  status: string;
}

export function ProgressBar({ progress, status }: ProgressBarProps) {
  return (
    <div className="w-full max-w-md">
      {/* Progress bar container */}
      <div className="flex items-center gap-4 mb-3">
        <span className="text-[11px] font-medium tracking-widest text-[#666666] uppercase">
          Processing
        </span>
        <div className="flex-1 h-[2px] bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[11px] font-mono text-[#888888] w-8 text-right">
          {progress}%
        </span>
      </div>

      {/* Status text */}
      <p className="text-[13px] text-[#666666] tracking-wide uppercase text-center">
        {status}
      </p>
    </div>
  );
}
