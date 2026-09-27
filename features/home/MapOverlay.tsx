"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { SearchIcon, CloseIcon, CafeIcon, RestaurantIcon } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";
import Chip from "@/components/ui/Chip";
import { useKakaoSearch, type KakaoSearchResult } from "@/hooks/use-kakao-search";
import type { Category } from "./types";

function formatDistance(meters: string | undefined): string | null {
  const m = Number(meters);
  if (!meters || isNaN(m)) return null;
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}

type PlaceResult = Pick<
  KakaoSearchResult,
  "id" | "place_name" | "category_name" | "category_group_code" | "road_address_name" | "address_name" | "phone" | "x" | "y" | "distance"
>;

interface MapOverlayProps {
  category: Category;
  onCategoryChange: (cat: Category) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  searchPosition?: { lat: number; lng: number };
  onSearchOpen?: () => void;
  onSearchClose?: () => void;
  desktopSidebarOpen?: boolean;
  desktopVisible?: boolean;
}

const FILTER_TABS: { key: Category; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "restaurant", label: "음식점" },
  { key: "cafe", label: "카페" },
];

export default function MapOverlay({
  category,
  onCategoryChange,
  onPlaceSelect,
  searchPosition,
  onSearchOpen,
  onSearchClose,
  desktopVisible = true,
}: MapOverlayProps) {
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, isLoading, error, searchDebounced, clear } = useKakaoSearch();

  const openDropdown = useCallback(() => {
    if (!isOpen) onSearchOpen?.();
    setIsOpen(true);
  }, [isOpen, onSearchOpen]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    onSearchClose?.();
  }, [onSearchClose]);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (!value.trim()) {
        clear();
        closeDropdown();
        return;
      }
      openDropdown();
      searchDebounced(value, 400, searchPosition);
    },
    [searchDebounced, clear, searchPosition, openDropdown, closeDropdown]
  );

  const handleFocus = useCallback(() => {
    if (!query.trim()) return;
    if (results.length > 0) {
      openDropdown();
    } else {
      openDropdown();
      searchDebounced(query, 0, searchPosition);
    }
  }, [query, results.length, searchDebounced, searchPosition, openDropdown]);

  const handleClear = useCallback(() => {
    setQuery("");
    clear();
    closeDropdown();
  }, [clear, closeDropdown]);

  const handleSelect = useCallback(
    (place: PlaceResult) => {
      onPlaceSelect(place);
      setQuery(place.place_name);
      clear();
      closeDropdown();
    },
    [onPlaceSelect, clear, closeDropdown]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!searchAreaRef.current?.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDropdown();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeDropdown]);

  return (
    <div
      className={[
        "pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 bg-surface px-4 pb-[14px] pt-6 shadow-[0_6px_20px_rgba(0,0,0,0.1)] transition-transform duration-300",
        isOpen ? "z-50" : "z-20",
        "home-desktop-search md:fixed md:inset-x-auto md:left-1/2 md:top-2.5 md:z-[60] md:w-[min(440px,38vw)] md:-translate-x-1/2 md:bg-transparent md:p-0 md:shadow-none",
        desktopVisible ? "md:flex" : "md:hidden",
      ].join(" ")}
    >
      {/* 검색바 */}
      <div ref={searchAreaRef} className="pointer-events-auto relative z-10">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <SearchIcon size={17} color="var(--color-text-tertiary)" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onClick={handleFocus}
          placeholder="장소 검색"
          className="h-12 w-full rounded-[14px] border-0 bg-bg py-3 pl-10 pr-10 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary md:h-11 md:rounded-xl md:py-0 md:text-[14.5px]"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center"
            aria-label="검색어 지우기"
          >
            <CloseIcon size={17} color="var(--color-text-tertiary)" />
          </button>
        )}

        {/* 검색 결과 드롭다운 */}
        {isOpen && (
          <div className="nepick-fade-in absolute left-0 right-0 top-full mt-2 min-h-[174px] max-h-60 overflow-y-auto rounded-[14px] bg-surface p-2 shadow-[0_12px_32px_rgba(0,0,0,0.16)] md:p-2.5">
            {isLoading ? (
              <div className="flex justify-center py-5">
                <Spinner size={22} />
              </div>
            ) : error ? (
              <div className="flex min-h-[152px] flex-col items-center justify-center gap-2 text-center md:min-h-[154px]">
                <p className="text-[13px] text-text-secondary">{error}</p>
                <button
                  type="button"
                  onClick={() => searchDebounced(query, 0, searchPosition)}
                  className="min-h-10 rounded-[10px] px-4 text-[13px] font-bold text-primary hover:bg-primary-soft active:bg-primary-soft"
                >
                  다시 시도
                </button>
              </div>
            ) : results.length === 0 ? (
              <p className="nepick-fade-in flex min-h-[152px] items-center justify-center text-[13px] text-text-secondary md:min-h-[154px]">검색 결과가 없어요</p>
            ) : (
              <ul>
                {results.map((place) => (
                  <li key={place.id} className="border-b border-border last:border-none">
                    <button
                      onClick={() => handleSelect(place)}
                      data-gtm-event="search_select"
                      className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 text-left hover:bg-bg-soft active:bg-bg"
                    >
                      <span className={[
                        "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px]",
                        place.category_group_code === "CE7" ? "bg-bg-soft text-text-body" : "bg-primary-soft text-primary",
                      ].join(" ")}>
                        {place.category_group_code === "CE7"
                          ? <CafeIcon size={17} />
                          : <RestaurantIcon size={17} />}
                      </span>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="truncate text-[14px] font-bold text-text-primary">{place.place_name}</p>
                        <p className="truncate text-[12px] text-text-tertiary">
                          {place.road_address_name || place.address_name}
                        </p>
                      </div>
                      {formatDistance(place.distance) && (
                        <span className="shrink-0 text-[11px] text-text-tertiary">
                          {formatDistance(place.distance)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div className="pointer-events-auto flex gap-2 md:hidden">
        {FILTER_TABS.map((tab) => (
          <Chip
            key={tab.key}
            className="shrink-0"
            icon={tab.key === "restaurant"
              ? <RestaurantIcon size={18} />
              : tab.key === "cafe"
                ? <CafeIcon size={18} />
                : undefined}
            label={tab.label}
            active={category === tab.key}
            onClick={() => onCategoryChange(tab.key)}
          />
        ))}
      </div>
    </div>
  );
}
