"use client";

import { useState, useCallback } from "react";
import { SearchIcon, MapPinIcon, CloseIcon } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";
import { useKakaoSearch, type KakaoSearchResult } from "@/hooks/use-kakao-search";

export type KakaoPlace = KakaoSearchResult;

interface StoreSearchProps {
  onSelect: (place: KakaoPlace) => void;
}

/**
 * 카카오 장소 검색 컴포넌트
 * Supabase Edge Function을 통해 카카오 REST API를 호출합니다.
 */
export default function StoreSearch({ onSelect }: StoreSearchProps) {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const { results, isLoading, error, searchDebounced, clear } = useKakaoSearch();

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (!value.trim()) {
        clear();
        setHasSearched(false);
        return;
      }
      setHasSearched(true);
      searchDebounced(value);
    },
    [searchDebounced, clear]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    clear();
    setHasSearched(false);
  }, [clear]);

  return (
    <div className="flex flex-col gap-3">
      {/* 검색 입력 */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <SearchIcon size={18} color="var(--color-text-tertiary)" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="가게 이름으로 검색"
          className="h-[52px] w-full rounded-[12px] border-[1.5px] border-border bg-surface pl-11 pr-10 text-[15px] text-text-primary outline-none transition-colors focus:border-primary placeholder:text-text-muted"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center"
            aria-label="검색어 지우기"
          >
            <CloseIcon size={18} color="var(--color-text-tertiary)" />
          </button>
        )}
      </div>

      {/* 검색 결과 */}
      {isLoading && (
        <div className="flex justify-center py-6">
          <Spinner size={24} />
        </div>
      )}

      {!isLoading && hasSearched && error && (
        <div className="nepick-fade-in flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-[14px] text-text-secondary">{error}</p>
          <button
            type="button"
            onClick={() => searchDebounced(query, 0)}
            className="min-h-10 rounded-[10px] px-4 text-[13px] font-bold text-primary hover:bg-primary-soft active:bg-primary-soft"
          >
            다시 시도
          </button>
        </div>
      )}

      {!isLoading && hasSearched && !error && results.length === 0 && (
        <div className="nepick-fade-in py-8 text-center text-[14px] text-text-secondary">
          검색 결과가 없어요
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <ul className="nepick-fade-in divide-y divide-border rounded-xl border border-border overflow-hidden">
          {results.map((place) => (
            <li key={place.id}>
              <button
                onClick={() => onSelect(place)}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors active:bg-bg"
              >
                <MapPinIcon size={16} color="var(--color-primary)" className="mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="truncate text-[14px] font-semibold text-text-primary">
                    {place.place_name}
                  </span>
                  <span className="truncate text-[12px] text-text-secondary">
                    {place.road_address_name || place.address_name}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
