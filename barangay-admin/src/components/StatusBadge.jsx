import { humanize, slug } from '../utils/format';

export default function StatusBadge({ status, label }) {
  if (!status) return <span className="badge badge-muted">—</span>;
  return <span className={`badge badge-${slug(status)}`}>{label || humanize(status)}</span>;
}
