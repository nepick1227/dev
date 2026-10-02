"use client";

import { useSyncExternalStore, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ChevronLeftIcon, CloseIcon } from "@/components/ui/icons";
import SearchResultList, { type PlaceResult } from "./SearchResultList";

interface MobileSearchScreenProps {
  isOpen: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  onQueryChange: (value: string) => void;
  onClear: () => void;
  onBack: () => void;
  results: PlaceResult[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (place: PlaceResult) => void;
}

const subscribeNoop = () => () => {};

/**
 * 모바일 전체화면 검색 화면
 * 홈 검색창 탭 시 키보드가 바로 올라오도록 닫힌 상태에서도 렌더링해 두고 투명 처리합니다.
 */
export default function MobileSearchScreen({
  isOpen,
  inputRef,
  query,
  onQueryChange,
  onClear,
  onBack,
  results,
  isLoading,
  error,
  onRetry,
  onSelect,
}: MobileSearchScreenProps) {
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!isClient) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="장소 검색"
      aria-hidden={!isOpen}
      className={[
        "fixed inset-0 z-[90] flex flex-col bg-surface transition-opacity duration-200 md:hidden",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    >
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-divider pl-2 pr-4">
        <button
          type="button"
          onClick={onBack}
          tabIndex={isOpen ? 0 : -1}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors active:bg-bg"
          aria-label="뒤로가기"
        >
          <ChevronLeftIcon size={24} color="var(--color-text-primary)" />
        </button>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            tabIndex={isOpen ? 0 : -1}
            placeholder="장소 검색"
            className="h-10 w-full rounded-xl border-0 bg-bg py-2 pl-3.5 pr-10 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary [&::-webkit-search-cancel-button]:hidden"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={onClear}
              tabIndex={isOpen ? 0 : -1}
              className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center"
              aria-label="검색어 지우기"
            >
              <CloseIcon size={17} color="var(--color-text-tertiary)" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2">
        {query.trim() ? (
          <SearchResultList
            results={results}
            isLoading={isLoading}
            error={error}
            onRetry={onRetry}
            onSelect={onSelect}
            stateClassName="min-h-[200px]"
          />
        ) : (
          <p className="flex min-h-[200px] items-center justify-center text-[13px] text-text-secondary">
            가게 이름을 검색해 보세요
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
