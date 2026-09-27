"use client";

import { useState, useCallback, useEffect, useRef } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const search = useCallback(async (keyword: string, position?: { lat: number; lng: number }) => {
    const requestId = ++requestIdRef.current;
    if (!keyword.trim()) {
      abortRef.current?.abort();
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
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
      if (requestId === requestIdRef.current) setResults(filtered);
    } catch (e) {
      if ((e as Error).name !== "AbortError" && requestId === requestIdRef.current) {
        setResults([]);
        setError("장소 검색에 실패했어요. 다시 시도해 주세요.");
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
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
    requestIdRef.current += 1;
    abortRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setIsLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { results, isLoading, error, search, searchDebounced, clear };
}
