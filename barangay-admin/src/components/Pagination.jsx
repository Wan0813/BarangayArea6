import { config } from '../config';

export default function Pagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = config.pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}) {
  const pages = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  const canPrev = current > 1 && !disabled;
  const canNext = current < pages && !disabled;

  return (
    <div className="pagination">
      <span className="pagination-info">
        {totalItems} item{totalItems === 1 ? '' : 's'} · page {current} of {pages}
      </span>

      <div className="pagination-controls">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPageChange?.(1)} disabled={!canPrev}>
          « First
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onPageChange?.(current - 1)}
          disabled={!canPrev}
        >
          ‹ Prev
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onPageChange?.(current + 1)}
          disabled={!canNext}
        >
          Next ›
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onPageChange?.(pages)}
          disabled={!canNext}
        >
          Last »
        </button>

        {onPageSizeChange ? (
          <label className="pagination-size">
            Per page
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              disabled={disabled}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </div>
  );
}
