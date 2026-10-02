"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { SearchIcon, CloseIcon, CafeIcon, RestaurantIcon } from "@/components/ui/icons";
import Chip from "@/components/ui/Chip";
import { useKakaoSearch } from "@/hooks/use-kakao-search";
import MobileSearchScreen from "./MobileSearchScreen";
import SearchResultList, { type PlaceResult } from "./SearchResultList";
import type { Category } from "./types";

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
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const historyPushedRef = useRef(false);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
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

  const handleRetry = useCallback(() => {
    searchDebounced(query, 0, searchPosition);
  }, [query, searchDebounced, searchPosition]);

  const handleSelect = useCallback(
    (place: PlaceResult) => {
      onPlaceSelect(place);
      setQuery(place.place_name);
      clear();
      closeDropdown();
    },
    [onPlaceSelect, clear, closeDropdown]
  );

  // ── 모바일 전체화면 검색 ──
  const openMobileSearch = useCallback(() => {
    // iOS에서 키보드가 올라오도록 탭 이벤트 안에서 바로 포커스
    mobileInputRef.current?.focus({ preventScroll: true });
    onSearchOpen?.();
    setIsMobileSearchOpen(true);
    window.history.pushState(window.history.state, "");
    historyPushedRef.current = true;
    if (query.trim() && results.length === 0) {
      searchDebounced(query, 0, searchPosition);
    }
  }, [onSearchOpen, query, results.length, searchDebounced, searchPosition]);

  // 화면만 닫고, 검색 화면용으로 쌓은 히스토리를 되돌림
  const dismissMobileSearch = useCallback(() => {
    mobileInputRef.current?.blur();
    setIsMobileSearchOpen(false);
    if (historyPushedRef.current) {
      historyPushedRef.current = false;
      window.history.back();
    }
  }, []);

  const handleMobileBack = useCallback(() => {
    dismissMobileSearch();
    onSearchClose?.();
  }, [dismissMobileSearch, onSearchClose]);

  const handleMobileQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (!value.trim()) {
        clear();
        return;
      }
      searchDebounced(value, 400, searchPosition);
    },
    [clear, searchDebounced, searchPosition]
  );

  const handleMobileClear = useCallback(() => {
    setQuery("");
    clear();
    mobileInputRef.current?.focus();
  }, [clear]);

  const handleMobileSelect = useCallback(
    (place: PlaceResult) => {
      dismissMobileSearch();
      onPlaceSelect(place);
      setQuery(place.place_name);
      clear();
    },
    [dismissMobileSearch, onPlaceSelect, clear]
  );

  // 휴대폰/브라우저 뒤로가기로 검색 화면 닫기
  useEffect(() => {
    if (!isMobileSearchOpen) return;

    const handlePopState = () => {
      historyPushedRef.current = false;
      mobileInputRef.current?.blur();
      setIsMobileSearchOpen(false);
      onSearchClose?.();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isMobileSearchOpen, onSearchClose]);

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
      {/* 모바일 검색바: 탭하면 전체화면 검색 화면으로 전환 */}
      <div className="pointer-events-auto relative md:hidden">
        <button
          type="button"
          onClick={openMobileSearch}
          className="flex h-12 w-full items-center gap-2.5 rounded-[14px] bg-bg pl-4 pr-10 text-left"
          aria-label="장소 검색"
        >
          <SearchIcon size={17} color="var(--color-text-tertiary)" />
          <span className={["truncate text-[15px]", query ? "text-text-primary" : "text-text-tertiary"].join(" ")}>
            {query || "장소 검색"}
          </span>
        </button>
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center"
            aria-label="검색어 지우기"
          >
            <CloseIcon size={17} color="var(--color-text-tertiary)" />
          </button>
        )}
      </div>

      {/* 데스크탑 검색바 + 드롭다운 */}
      <div ref={searchAreaRef} className="pointer-events-auto relative z-10 hidden md:block">
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
          className="h-11 w-full rounded-xl border-0 bg-bg py-0 pl-10 pr-10 text-[14.5px] text-text-primary outline-none placeholder:text-text-tertiary"
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

        {isOpen && (
          <div className="nepick-fade-in absolute left-0 right-0 top-full mt-2 min-h-[174px] max-h-60 overflow-y-auto rounded-[14px] bg-surface p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
            <SearchResultList
              results={results}
              isLoading={isLoading}
              error={error}
              onRetry={handleRetry}
              onSelect={handleSelect}
            />
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

      <MobileSearchScreen
        isOpen={isMobileSearchOpen}
        inputRef={mobileInputRef}
        query={query}
        onQueryChange={handleMobileQueryChange}
        onClear={handleMobileClear}
        onBack={handleMobileBack}
        results={results}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
        onSelect={handleMobileSelect}
      />
    </div>
  );
}
