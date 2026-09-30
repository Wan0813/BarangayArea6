import { useEffect, useRef, useState } from 'react';

/**
 * The one search bar used by EVERY list page.
 *
 * Renders: a text input, + a children slot for the page's filter controls,
 * + a Reset button that clears the text AND every filter (restoring
 * `initialFilters`) and re-fetches page 1 through `onReset`.
 */
export default function SearchBar({
  search = '',
  onSearchChange,
  onSubmit,
  onReset,
  initialFilters = {},
  placeholder = 'Search…',
  loading = false,
  submitLabel = 'Search',
  children,
}) {
  const [text, setText] = useState(search);
  const inputRef = useRef(null);

  // Keep the input in sync when the page clears it programmatically.
  useEffect(() => {
    setText(search);
  }, [search]);

  function handleSubmit(event) {
    event.preventDefault();
    if (onSearchChange) onSearchChange(text);
    if (onSubmit) onSubmit(text);
  }

  function handleReset() {
    const cleared = {};
    Object.keys(initialFilters).forEach((key) => {
      cleared[key] = initialFilters[key];
    });
    setText('');
    if (onSearchChange) onSearchChange('');
    if (onReset) onReset(cleared);
    inputRef.current?.focus();
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <div className="search-bar-main">
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          value={text}
          placeholder={placeholder}
          onChange={(event) => setText(event.target.value)}
          aria-label={placeholder}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching…' : submitLabel}
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleReset} disabled={loading}>
          Reset
        </button>
      </div>
      {children ? <div className="search-bar-filters">{children}</div> : null}
    </form>
  );
}
