"use client";

import { useState, useCallback, useRef } from "react";
import { SearchIcon, CloseIcon, MapPinIcon } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";
import type { Category } from "./types";

interface PlaceResult {
  id: string;
  place_name: string;
  road_address_name: string;
  address_name: string;
  x: string;
  y: string;
}

interface MapOverlayProps {
  category: Category;
  onCategoryChange: (cat: Category) => void;
  onPlaceSelect: (lat: number, lng: number) => void;
}

const FILTER_TABS: { key: Category; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "restaurant", label: "음식점" },
  { key: "cafe", label: "카페" },
];

export default function MapOverlay({ category, onCategoryChange, onPlaceSelect }: MapOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    // 이전 요청 취소 (응답 순서 역전 방지)
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setIsOpen(true);
    try {
      const res = await fetch(`/api/kakao-search?query=${encodeURIComponent(keyword)}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.documents ?? []);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setResults([]);
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
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback(
    (place: PlaceResult) => {
      onPlaceSelect(parseFloat(place.y), parseFloat(place.x));
      setQuery(place.place_name);
      setResults([]);
      setIsOpen(false);
    },
    [onPlaceSelect]
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 px-4 pt-6">
      {/* 검색바 */}
      <div className="pointer-events-auto relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <SearchIcon size={17} color="#9CA3AF" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="장소 검색"
          className="w-full rounded-2xl border border-border bg-white py-3 pl-10 pr-10 text-[14px] tracking-tight text-text-primary shadow-md outline-none placeholder:text-text-secondary focus:border-primary"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
            aria-label="검색어 지우기"
          >
            <CloseIcon size={17} color="#9CA3AF" />
          </button>
        )}

        {/* 검색 결과 드롭다운 */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-border bg-white shadow-lg">
            {isLoading ? (
              <div className="flex justify-center py-5">
                <Spinner size={22} />
              </div>
            ) : results.length === 0 ? (
              <p className="py-5 text-center text-[13px] text-text-secondary">검색 결과가 없어요</p>
            ) : (
              <ul>
                {results.map((place) => (
                  <li key={place.id} className="border-b border-border last:border-none">
                    <button
                      onClick={() => handleSelect(place)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-bg"
                    >
                      <MapPinIcon size={14} color="#D32F2F" className="mt-0.5 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="truncate text-[13px] font-semibold text-text-primary">{place.place_name}</p>
                        <p className="truncate text-[11px] text-text-secondary">
                          {place.road_address_name || place.address_name}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div className="pointer-events-auto flex gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onCategoryChange(tab.key)}
            className="rounded-full px-4 py-1.5 text-[13px] font-semibold tracking-tight shadow-sm transition-all duration-200"
            style={{
              background: category === tab.key ? "#D32F2F" : "#ffffff",
              color: category === tab.key ? "#ffffff" : "#6B7280",
              border: category === tab.key ? "1.5px solid #D32F2F" : "1.5px solid #E5E7EB",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
