export function LoadingIndicator() {
  return (
    <div className="flex gap-1.5 items-center justify-start py-1">
      <div
        className="w-2 h-2 bg-gs-purple rounded-full animate-bounce"
        style={{ animationDuration: '1.2s', animationDelay: '0s' }}
      />
      <div
        className="w-2 h-2 bg-gs-purple rounded-full animate-bounce"
        style={{ animationDuration: '1.2s', animationDelay: '0.15s' }}
      />
      <div
        className="w-2 h-2 bg-gs-purple rounded-full animate-bounce"
        style={{ animationDuration: '1.2s', animationDelay: '0.3s' }}
      />
    </div>
  );
}
