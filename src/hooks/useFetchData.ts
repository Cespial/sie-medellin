"use client";

import { useState, useEffect, useCallback } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Dedup: concurrent fetches for the same URL share one request
const inflight = new Map<string, Promise<unknown>>();

function fetchDedup<T>(url: string): Promise<T> {
  const existing = inflight.get(url);
  if (existing) return existing as Promise<T>;

  const promise = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .finally(() => inflight.delete(url));

  inflight.set(url, promise);
  return promise as Promise<T>;
}

export function useFetchData<T>(url: string) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const load = useCallback(() => {
    setState({ data: null, loading: true, error: null });
    fetchDedup<T>(url)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) =>
        setState({ data: null, loading: false, error: err.message })
      );
  }, [url]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, retry: load };
}
