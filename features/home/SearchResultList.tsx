"use client";

import { CafeIcon, RestaurantIcon } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";
import type { KakaoSearchResult } from "@/hooks/use-kakao-search";

export type PlaceResult = Pick<
  KakaoSearchResult,
  "id" | "place_name" | "category_name" | "category_group_code" | "road_address_name" | "address_name" | "phone" | "x" | "y" | "distance"
>;

interface SearchResultListProps {
  results: PlaceResult[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (place: PlaceResult) => void;
  /** 상태 안내(로딩/오류/빈 결과) 영역 최소 높이 클래스 */
  stateClassName?: string;
}

function formatDistance(meters: string | undefined): string | null {
  const m = Number(meters);
  if (!meters || isNaN(m)) return null;
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}

export default function SearchResultList({
  results,
  isLoading,
  error,
  onRetry,
  onSelect,
  stateClassName = "min-h-[152px] md:min-h-[154px]",
}: SearchResultListProps) {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-5 ${stateClassName}`}>
        <Spinner size={22} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 text-center ${stateClassName}`}>
        <p className="text-[13px] text-text-secondary">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="min-h-10 rounded-[10px] px-4 text-[13px] font-bold text-primary hover:bg-primary-soft active:bg-primary-soft"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <p className={`nepick-fade-in flex items-center justify-center text-[13px] text-text-secondary ${stateClassName}`}>
        검색 결과가 없어요
      </p>
    );
  }

  return (
    <ul>
      {results.map((place) => {
        const distance = formatDistance(place.distance);
        const isCafe = place.category_group_code === "CE7";
        return (
          <li key={place.id} className="border-b border-border last:border-none">
            <button
              onClick={() => onSelect(place)}
              data-gtm-event="search_select"
              className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 text-left hover:bg-bg-soft active:bg-bg"
            >
              <span className={[
                "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px]",
                isCafe ? "bg-bg-soft text-text-body" : "bg-primary-soft text-primary",
              ].join(" ")}>
                {isCafe ? <CafeIcon size={17} /> : <RestaurantIcon size={17} />}
              </span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-[14px] font-bold text-text-primary">{place.place_name}</p>
                <p className="truncate text-[12px] text-text-tertiary">
                  {place.road_address_name || place.address_name}
                </p>
              </div>
              {distance && (
                <span className="shrink-0 text-[11px] text-text-tertiary">{distance}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
