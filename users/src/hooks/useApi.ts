import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Result<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** GET a public endpoint. Re-fetches when `path` changes; pass null to skip. */
export function useApi<T>(path: string | null): Result<T> {
  // `key` records which path the stored result belongs to, so "loading" is derived
  // (path !== key) instead of being set synchronously inside the effect.
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null }>({
    key: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    api
      .get<T>(path)
      .then((data) => !cancelled && setState({ key: path, data, error: null }))
      .catch(
        (e: unknown) =>
          !cancelled && setState({ key: path, data: null, error: e instanceof Error ? e.message : 'Failed to load' }),
      );
    return () => {
      cancelled = true;
    };
  }, [path]);

  const fresh = path !== null && state.key === path;
  return {
    data: fresh ? state.data : null,
    loading: path !== null && !fresh,
    error: fresh ? state.error : null,
  };
}
