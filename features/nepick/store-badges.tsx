"use client";

import { useEffect, useState } from "react";
import { formatNepickIndex } from "@/lib/nepick";
import type { NepickStoreBadge } from "@/types/database";
import { fetchNepickStoreBadges } from "./api";

const MAX_VISIBLE_BADGES = 2;

interface StoreBadgesProps {
  storeId: number;
}

/**
 * 홈에서 선택한 가게의 음식 뱃지. 2개까지 보이고 나머지는 "외 N"으로 줄인다.
 * 뱃지가 없거나 불러오지 못하면 아무것도 보여 주지 않는다 (카드의 다른 기능을 막지 않는다).
 */
export default function StoreBadges({ storeId }: StoreBadgesProps) {
  const [loaded, setLoaded] = useState<{ storeId: number; badges: NepickStoreBadge[] } | null>(null);
  // 아직 저장되지 않은 검색 결과 가게는 음수 id를 쓴다
  const isSavedStore = storeId > 0;

  useEffect(() => {
    if (!isSavedStore) return;
    let active = true;
    fetchNepickStoreBadges(storeId)
      .then((badges) => {
        if (active) setLoaded({ storeId, badges });
      })
      .catch(() => {
        // 뱃지는 보조 정보라 실패를 알리지 않는다
      });
    return () => {
      active = false;
    };
  }, [isSavedStore, storeId]);

  // 다른 가게로 바뀐 직후 이전 가게의 뱃지를 보여 주지 않는다
  const badges = loaded?.storeId === storeId ? loaded.badges : [];
  if (badges.length === 0) return null;

  const hiddenCount = badges.length - MAX_VISIBLE_BADGES;

  return (
    <ul className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="네 픽 뱃지">
      {badges.slice(0, MAX_VISIBLE_BADGES).map((badge) => (
        <li
          key={badge.slug}
          className="max-w-full truncate rounded-[7px] bg-primary-soft px-[7px] py-[3px] text-[11px] font-bold text-primary"
        >
          {formatNepickIndex(badge.food_name, badge.nepick_index)}
        </li>
      ))}
      {hiddenCount > 0 && (
        <li className="shrink-0 text-[11px] font-bold text-text-secondary">외 {hiddenCount}</li>
      )}
    </ul>
  );
}
