"use client";

import { useState, useCallback, useRef } from "react";

export interface KakaoSearchResult {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  x: string;
  y: string;
}

export function useKakaoSearch() {
  const [results, setResults] = useState<KakaoSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const res = await fetch(`/api/kakao-search?query=${encodeURIComponent(keyword)}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error("검색 실패");
      const data = await res.json();
      setResults(data.documents ?? []);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchDebounced = useCallback(
    (keyword: string, delay = 400) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(keyword), delay);
    },
    [search]
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setIsLoading(false);
  }, []);

  return { results, isLoading, search, searchDebounced, clear };
}
