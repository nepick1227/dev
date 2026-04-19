"use client";

import { useState, useCallback, useRef } from "react";
import { SearchIcon, MapPinIcon, CloseIcon } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";

export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  x: string; // lng
  y: string; // lat
}

interface StoreSearchProps {
  onSelect: (place: KakaoPlace) => void;
}

/**
 * 카카오 장소 검색 컴포넌트
 * Supabase Edge Function을 통해 카카오 REST API를 호출합니다.
 */
export default function StoreSearch({ onSelect }: StoreSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(
        `/api/kakao-search?query=${encodeURIComponent(keyword)}`
      );
      if (!res.ok) throw new Error("검색 실패");
      const data = await res.json();
      setResults(data.documents ?? []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(value), 400);
    },
    [search]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* 검색 입력 */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <SearchIcon size={18} color="#9CA3AF" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="가게 이름으로 검색"
          className="w-full rounded-xl border-[1.5px] border-border bg-white py-3.5 pl-10 pr-10 text-[15px] tracking-tight text-text-primary outline-none transition-colors focus:border-primary placeholder:text-text-secondary"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
            aria-label="검색어 지우기"
          >
            <CloseIcon size={18} color="#9CA3AF" />
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
        <div className="py-8 text-center text-[14px] text-text-secondary">
          검색 결과가 없어요
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {results.map((place) => (
            <li key={place.id}>
              <button
                onClick={() => onSelect(place)}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors active:bg-bg"
              >
                <MapPinIcon size={16} color="#D32F2F" className="mt-0.5 shrink-0" />
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
