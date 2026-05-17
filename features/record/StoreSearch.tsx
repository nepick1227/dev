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
  const { results, isLoading, searchDebounced, clear } = useKakaoSearch();

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
          className="h-14 w-full rounded-2xl border-[1.5px] border-border bg-surface pl-11 pr-10 text-[16px] tracking-tight text-text-primary outline-none transition-colors focus:border-primary placeholder:text-text-tertiary"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
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

      {!isLoading && hasSearched && results.length === 0 && (
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
                  <span className="truncate text-[14px] font-semibold tracking-tight text-text-primary">
                    {place.place_name}
                  </span>
                  <span className="truncate text-[12px] tracking-tight text-text-secondary">
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
