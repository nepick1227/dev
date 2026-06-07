"use client";

import { useState, useCallback, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon } from "@/components/ui/icons";
import type { Store } from "@/types/database";

export const CARD_BOTTOM_PX = 28;
export const CARD_HEIGHT_PX = 140;

interface SelectedStoreCardProps {
  store: Store;
  rank: number;
  onClose: () => void;
  desktopSidebarOpen?: boolean;
}

export default function SelectedStoreCard({ store, rank, onClose, desktopSidebarOpen = true }: SelectedStoreCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const address = store.road_address ?? store.address;
  const categoryLabel = store.subcategory ?? (store.category === "cafe" ? "카페" : "음식점");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silent
    }
  }, [address]);

  const handleRecord = useCallback(() => {
    const params = new URLSearchParams({
      kakao_id: store.kakao_id,
      place_name: store.name,
      address_name: store.address,
      road_address_name: store.road_address ?? "",
      phone: store.phone ?? "",
      x: String(store.lng),
      y: String(store.lat),
      category_group_code: store.category === "cafe" ? "CE7" : "FD6",
      category_name: store.subcategory ?? "",
    });
    router.push(`/record?${params.toString()}`);
  }, [store, router]);

  return (
    <div
      className="desktop-store-card absolute left-3 right-3 z-40 rounded-2xl bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.16)]"
      style={{
        bottom: `${CARD_BOTTOM_PX}px`,
        "--desktop-card-left": desktopSidebarOpen
          ? "calc(var(--home-sidebar-width) + (100vw - var(--home-sidebar-width)) / 2)"
          : "calc(var(--home-nav-width) + (100vw - var(--home-nav-width)) / 2)",
      } as CSSProperties}
    >
      {/* 1행: 순위 배지 + 카테고리 배지 + 닫기 */}
      <div className="mb-2 flex items-center gap-1.5">
        {rank > 0 && (
          <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-extrabold tracking-tight text-primary">
            {rank}위
          </span>
        )}
        <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-semibold tracking-tight text-text-secondary">
          {categoryLabel}
        </span>
        <button onClick={onClose} className="ml-auto p-0.5" aria-label="닫기">
          <CloseIcon size={18} color="#9CA3AF" />
        </button>
      </div>

      {/* 2행: 가게명 + 픽 수 */}
      <div className="mb-2 flex items-center gap-2">
        <span className="flex-1 truncate text-[15px] font-bold tracking-tight text-text-primary">
          {store.name}
        </span>
        <span className="shrink-0 text-[13px] font-bold text-primary">{store.pick_count}</span>
        <span className="shrink-0 text-[11px] text-text-secondary">픽</span>
      </div>

      {/* 3행: 주소 + 복사 버튼 + 기록 버튼 */}
      <div className="flex items-center gap-2">
        <span className="flex-1 truncate text-[12px] tracking-tight text-text-secondary">
          {address}
        </span>
        <button onClick={handleCopy} className="shrink-0 rounded-full bg-bg p-1.5" aria-label="주소 복사">
          {copied ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M5 12L10 17L19 8" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="#9CA3AF" strokeWidth="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#9CA3AF" strokeWidth="2"/>
            </svg>
          )}
        </button>
        <button
          onClick={handleRecord}
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[12px] font-bold text-white"
        >
          기록+
        </button>
      </div>
    </div>
  );
}
