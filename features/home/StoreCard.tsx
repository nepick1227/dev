"use client";

import { useCallback } from "react";
import type { Store } from "@/types/database";

interface StoreCardProps {
  store: Store;
  rank?: number;
  onClick?: (storeId: number) => void;
}

/**
 * 가게 카드 컴포넌트 (랭킹 목록용)
 */
export default function StoreCard({ store, rank, onClick }: StoreCardProps) {
  const handleClick = useCallback(() => {
    onClick?.(store.id);
  }, [store.id, onClick]);

  const categoryLabel = store.category === "cafe" ? "카페" : "음식점";

  return (
    <div
      className="flex w-full items-center gap-3 px-5 py-3.5 transition-colors active:bg-bg"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      {/* 순위 */}
      {rank !== undefined && (
        <span
          className="w-6 shrink-0 text-center text-[15px] font-extrabold"
          style={{ color: rank <= 3 ? "#D32F2F" : "#9CA3AF" }}
        >
          {rank}
        </span>
      )}

      {/* 가게 정보 */}
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        {/* 가게명 + 카테고리 배지 */}
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-semibold tracking-tight text-text-primary">
            {store.name}
          </span>
          <span className="shrink-0 rounded-full bg-bg px-1.5 py-0.5 text-[10px] font-medium tracking-tight text-text-secondary">
            {categoryLabel}
          </span>
        </div>
        {/* 주소 */}
        <span className="truncate text-[12px] tracking-tight text-text-secondary">
          {store.road_address ?? store.address}
        </span>
      </div>

      {/* 우측: 픽 수 */}
      <div className="flex shrink-0 items-center gap-0.5">
        <span className="text-[13px] font-bold text-primary">{store.pick_count}</span>
        <span className="text-[11px] text-text-secondary">픽</span>
      </div>
    </div>
  );
}
