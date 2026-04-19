"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPinIcon } from "@/components/ui/icons";
import {
  recommendationColors,
  recommendationLabels,
  recommendationEmojis,
  type RecommendationType,
} from "@/styles/tokens";
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
  const router = useRouter();

  const handleClick = useCallback(() => {
    onClick?.(store.id);
  }, [store.id, onClick]);

  const handleRecord = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/record?store_kakao_id=${store.kakao_id}&store_name=${encodeURIComponent(store.name)}`);
  }, [store.kakao_id, store.name, router]);

  // score → 추천도 계산
  const recommendation: RecommendationType =
    store.pick_count === 0
      ? "neutral"
      : store.score / store.pick_count >= 1.5
        ? "recommend"
        : store.score / store.pick_count >= 0.8
          ? "neutral"
          : "not_recommend";

  const badgeColor = recommendationColors[recommendation];
  const badgeLabel = recommendationLabels[recommendation];
  const badgeEmoji = recommendationEmojis[recommendation];

  return (
    <div
      className="flex w-full items-center gap-3 px-5 py-4 transition-colors active:bg-bg"
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
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold tracking-tight text-text-primary">
            {store.name}
          </span>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-tight text-white"
            style={{ background: badgeColor }}
          >
            {badgeEmoji} {badgeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <MapPinIcon size={12} color="#9CA3AF" />
          <span className="truncate text-[12px] tracking-tight text-text-secondary">
            {store.road_address ?? store.address}
          </span>
        </div>
      </div>

      {/* 우측: 픽 수 + 기록 버튼 */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <div className="text-right">
          <span className="text-[13px] font-bold text-text-primary">{store.pick_count}</span>
          <span className="text-[11px] text-text-secondary">픽</span>
        </div>
        <button
          onClick={handleRecord}
          className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white"
        >
          기록+
        </button>
      </div>
    </div>
  );
}
