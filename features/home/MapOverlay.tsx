"use client";

import { useState, useCallback } from "react";
import { SearchIcon, CloseIcon, MapPinIcon } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";
import Chip from "@/components/ui/Chip";
import { useKakaoSearch, type KakaoSearchResult } from "@/hooks/use-kakao-search";
import type { Category } from "./types";

type PlaceResult = Pick<KakaoSearchResult, "id" | "place_name" | "road_address_name" | "address_name" | "x" | "y">;

interface MapOverlayProps {
  category: Category;
  onCategoryChange: (cat: Category) => void;
  onPlaceSelect: (place: Pick<KakaoSearchResult, "id" | "x" | "y">) => void;
}

const FILTER_TABS: { key: Category; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "restaurant", label: "음식점" },
  { key: "cafe", label: "카페" },
];

export default function MapOverlay({ category, onCategoryChange, onPlaceSelect }: MapOverlayProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, isLoading, searchDebounced, clear } = useKakaoSearch();

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (!value.trim()) {
        clear();
        setIsOpen(false);
        return;
      }
      setIsOpen(true);
      searchDebounced(value);
    },
    [searchDebounced, clear]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    clear();
    setIsOpen(false);
  }, [clear]);

  const handleSelect = useCallback(
    (place: PlaceResult) => {
      onPlaceSelect({ id: place.id, x: place.x, y: place.y });
      setQuery(place.place_name);
      clear();
      setIsOpen(false);
    },
    [onPlaceSelect, clear]
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 px-4 pt-6">
      {/* 검색바 */}
      <div className="pointer-events-auto relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <SearchIcon size={17} color="var(--color-text-tertiary)" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="장소 검색"
          className="w-full rounded-[18px] border border-border bg-surface py-3 pl-10 pr-10 text-[14px] tracking-tight text-text-primary shadow-md outline-none placeholder:text-text-tertiary focus:border-primary"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
            aria-label="검색어 지우기"
          >
            <CloseIcon size={17} color="var(--color-text-tertiary)" />
          </button>
        )}

        {/* 검색 결과 드롭다운 */}
        {isOpen && (
          <div className="nepick-fade-in absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-border bg-surface shadow-lg">
            {isLoading ? (
              <div className="flex justify-center py-5">
                <Spinner size={22} />
              </div>
            ) : results.length === 0 ? (
              <p className="nepick-fade-in py-5 text-center text-[13px] text-text-secondary">검색 결과가 없어요</p>
            ) : (
              <ul>
                {results.map((place) => (
                  <li key={place.id} className="border-b border-border last:border-none">
                    <button
                      onClick={() => handleSelect(place)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-bg"
                    >
                      <MapPinIcon size={14} color="var(--color-primary)" className="mt-0.5 shrink-0" />
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
          <Chip
            key={tab.key}
            label={tab.label}
            active={category === tab.key}
            onClick={() => onCategoryChange(tab.key)}
          />
        ))}
      </div>
    </div>
  );
}
