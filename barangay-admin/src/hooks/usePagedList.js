import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '../config';
import { errorMessage } from '../utils/format';

/**
 * Shared list state: search + filters + pagination + loading/error.
 *
 * const list = usePagedList(complaints.list, { initialFilters: INITIAL_FILTERS });
 * list.items / list.loading / list.error / list.page / list.meta
 *
 * `initialFilters` must be a stable object (module constant or useMemo) —
 * it defines what the SearchBar Reset button restores.
 */
export default function usePagedList(fetcher, options = {}) {
  const { initialFilters = {}, pageSize: initialPageSize = config.pageSize } = options;
  const initialFiltersRef = useRef(initialFilters);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(() => ({ ...initialFilters }));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: initialPageSize,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const requestId = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const result = await fetcherRef.current({ search, ...filters, page, pageSize });
      if (!mounted.current || id !== requestId.current) return;
      if (Array.isArray(result)) {
        setItems(result);
        setMeta({
          page: 1,
          pageSize,
          totalItems: result.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        });
      } else if (result && Array.isArray(result.items)) {
        setItems(result.items);
        setMeta({
          page: result.page ?? page,
          pageSize: result.pageSize ?? pageSize,
          totalItems: result.totalItems ?? result.items.length,
          totalPages: result.totalPages ?? 1,
          hasNext: Boolean(result.hasNext),
          hasPrevious: Boolean(result.hasPrevious),
        });
      } else {
        setItems([]);
        setMeta({
          page,
          pageSize,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        });
      }
    } catch (err) {
      if (!mounted.current || id !== requestId.current) return;
      setItems([]);
      setError(errorMessage(err));
    } finally {
      if (mounted.current && id === requestId.current) setLoading(false);
    }
  }, [search, filters, page, pageSize]);

  useEffect(() => {
    load();
  }, [load, nonce]);

  /** Reload the current page (after create / update / delete). */
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  /** Push a search term and go back to page 1. */
  const submitSearch = useCallback((value) => {
    if (value !== undefined) {
      setSearch((prev) => (prev === value ? prev : value));
    }
    setPage(1);
    setNonce((n) => n + 1);
  }, []);

  /** Change one filter (or several) and go back to page 1. */
  const setFilter = useCallback((key, value) => {
    setFilters((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
    setPage(1);
  }, []);

  const setFilterValues = useCallback((values) => {
    setFilters((prev) => ({ ...prev, ...values }));
    setPage(1);
  }, []);

  /** Clear the search box + every filter and re-fetch page 1. */
  const reset = useCallback(() => {
    setSearch('');
    setFilters({ ...initialFiltersRef.current });
    setPage(1);
    setPageSize(initialPageSize);
    setNonce((n) => n + 1);
  }, [initialPageSize]);

  /** Delete helper: step back a page when the last row on a page is removed. */
  const reloadAfterDelete = useCallback(() => {
    if (items.length <= 1 && page > 1) {
      setPage((p) => Math.max(1, p - 1));
    } else {
      setNonce((n) => n + 1);
    }
  }, [items.length, page]);

  return {
    items,
    meta,
    loading,
    error,
    page,
    pageSize,
    search,
    filters,
    setItems,
    setPage,
    setPageSize,
    setSearch,
    setFilter,
    setFilterValues,
    submitSearch,
    reload,
    reloadAfterDelete,
    reset,
  };
}
