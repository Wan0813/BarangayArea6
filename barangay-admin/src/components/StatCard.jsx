export default function StatCard({ label, value, hint, accent = 'default', onClick, loading = false }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`stat-card stat-card-${accent}${onClick ? ' is-clickable' : ''}`}
      onClick={onClick}
    >
      <span className="stat-label">{label}</span>
      <span className="stat-value">{loading ? '—' : (value ?? 0)}</span>
      {hint ? <span className="stat-hint">{hint}</span> : null}
    </Tag>
  );
}
