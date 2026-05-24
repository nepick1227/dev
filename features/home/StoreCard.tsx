"use client";

import { useCallback } from "react";
import { CategoryBadge } from "@/components/ui/Badge";
import type { Store } from "@/types/database";

interface StoreCardProps {
  store: Store;
  rank?: number;
  onClick?: (storeId: number) => void;
}

export default function StoreCard({ store, rank, onClick }: StoreCardProps) {
  const handleClick = useCallback(() => {
    onClick?.(store.id);
  }, [store.id, onClick]);

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
        <span className={[
          "w-6 shrink-0 text-center text-[15px] font-extrabold",
          rank <= 3 ? "text-primary" : "text-text-tertiary",
        ].join(" ")}>
          {rank}
        </span>
      )}

      {/* 가게 정보 */}
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-semibold tracking-tight text-text-primary">
            {store.name}
          </span>
          <CategoryBadge category={store.category} />
        </div>
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
