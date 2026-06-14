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
  distance?: string;
}

export function useKakaoSearch() {
  const [results, setResults] = useState<KakaoSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (keyword: string, position?: { lat: number; lng: number }) => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ query: keyword });
      if (position) {
        params.set("x", String(position.lng));
        params.set("y", String(position.lat));
      }
      const res = await fetch(`/api/kakao-search?${params.toString()}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error("검색 실패");
      const data = await res.json();
      const filtered = (data.documents ?? []).filter(
        (p: KakaoSearchResult) => p.category_group_code === "FD6" || p.category_group_code === "CE7"
      );
      setResults(filtered);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchDebounced = useCallback(
    (keyword: string, delay = 400, position?: { lat: number; lng: number }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(keyword, position), delay);
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
