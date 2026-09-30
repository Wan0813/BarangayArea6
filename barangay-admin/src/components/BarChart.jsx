/**
 * Pure-CSS bar chart (no chart library).
 * items: [{ label, value, hint? }]
 */
export default function BarChart({ title, items = [], emptyLabel = 'No data yet.' }) {
  const max = Math.max(1, ...items.map((item) => Number(item.value) || 0));
  const total = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <section className="panel bar-chart">
      <header className="panel-head">
        <h2>{title}</h2>
        <span className="panel-head-meta">total {total}</span>
      </header>

      {items.length === 0 ? (
        <p className="muted">{emptyLabel}</p>
      ) : (
        <div className="bars">
          {items.map((item) => {
            const value = Number(item.value) || 0;
            const pct = Math.round((value / max) * 100);
            return (
              <div className="bar-row" key={item.label}>
                <span className="bar-label" title={item.label}>
                  {item.label}
                </span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: value ? `${Math.max(pct, 2)}%` : 0 }} />
                </span>
                <span className="bar-value">{value}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
