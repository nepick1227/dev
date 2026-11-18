import { useCallback, useEffect, useRef, useState } from "react";
import { pushGtmEvent } from "@/lib/analytics/gtm";
import type { MonthlyMenuClaimResult } from "@/lib/monthly-menu";
import { drawMonthlyMenuCollage, type CollageItem } from "./draw-collage";
import { shareOrDownloadImage } from "./share-image";

export const PHOTO_LOAD_ERROR = "사진을 불러오지 못했어요. 다시 시도해 주세요";

interface Collage {
  objectUrl: string;
  file: File;
}

/** 기록 조합 비교용 키. 고른 순서와 무관하다 */
export function toRecordKey(recordIds: number[]) {
  return [...recordIds].sort((a, b) => a - b).join(",");
}

interface BuildParams {
  title: string;
  items: CollageItem[];
}

/**
 * 콜라주를 먼저 그린 뒤 성공했을 때만 서버에서 횟수를 차감한다.
 * 같은 기록 조합으로 다시 그리는 경우(추천 메뉴만 수정)는 추가로 차감하지 않는다.
 */
export function useMonthlyMenuCollage(onClaimed: (result: MonthlyMenuClaimResult) => void) {
  const [collage, setCollage] = useState<Collage | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [claimedKey, setClaimedKey] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const replaceCollage = useCallback((next: Collage | null) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = next?.objectUrl ?? null;
    setCollage(next);
  }, []);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  /** 실패하면 사용자에게 보여 줄 문구로 throw */
  const build = useCallback(async ({ title, items }: BuildParams) => {
    setIsBuilding(true);
    try {
      let blob: Blob;
      try {
        blob = await drawMonthlyMenuCollage(title, items);
      } catch {
        throw new Error(PHOTO_LOAD_ERROR);
      }

      const recordIds = items.map((item) => item.record.id);
      const key = toRecordKey(recordIds);
      if (claimedKey !== key) {
        const response = await fetch("/api/monthly-menu/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordIds }),
        });
        const data = await response.json().catch(() => ({})) as Partial<MonthlyMenuClaimResult> & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "메뉴판 생성에 실패했습니다.");

        setClaimedKey(key);
        pushGtmEvent("monthly_menu_generate");
        onClaimed({
          remainingGenerations: data.remainingGenerations ?? 0,
          isUnlimited: Boolean(data.isUnlimited),
        });
      }

      const file = new File([blob], `${title.replace(/\s/g, "-")}.png`, { type: "image/png" });
      replaceCollage({ objectUrl: URL.createObjectURL(blob), file });
    } finally {
      setIsBuilding(false);
    }
  }, [claimedKey, onClaimed, replaceCollage]);

  /** 사진을 다시 고르면 새로 만드는 것이므로 차감 기록도 비운다 */
  const reset = useCallback(() => {
    setClaimedKey(null);
    replaceCollage(null);
  }, [replaceCollage]);

  const share = useCallback(async () => {
    if (!collage) return;
    const outcome = await shareOrDownloadImage(collage.file, collage.objectUrl);
    if (outcome !== "cancelled") {
      pushGtmEvent("monthly_menu_share", { method: outcome === "shared" ? "share_sheet" : "download" });
    }
  }, [collage]);

  return { collage, claimedKey, isBuilding, build, reset, share };
}
