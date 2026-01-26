export function ProcessingLoader() {
  return (
    <div className="processing-loader">
      {/* Top row */}
      <div className="loader-row">
        <div className="loader-block loader-block-1" />
        <div className="loader-block loader-block-2" />
        <div className="loader-block loader-block-3" />
      </div>
      {/* Bottom row */}
      <div className="loader-row">
        <div className="loader-block loader-block-4" />
        <div className="loader-block loader-block-5" />
        <div className="loader-block loader-block-6" />
      </div>
    </div>
  );
}
