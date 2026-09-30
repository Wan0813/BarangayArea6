export default function Loading({ label = 'Loading…', full = false }) {
  return (
    <div className={`loading ${full ? 'loading-full' : ''}`} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
