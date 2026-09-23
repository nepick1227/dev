"use client";

import { useState, useCallback, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon } from "@/components/ui/icons";
import { pushGtmEvent } from "@/lib/analytics/gtm";
import { createClient } from "@/lib/supabase/client";
import { openLoginPrompt } from "@/features/auth/login-prompt-events";
import type { Store } from "@/types/database";

export const CARD_BOTTOM_PX = 20;
export const CARD_HEIGHT_PX = 202;

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
  const categoryLabel = store.category === "cafe" ? "카페" : "음식점";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드를 사용할 수 없는 환경에서는 상태를 변경하지 않습니다.
    }
  }, [address]);

  const handleRecord = useCallback(async () => {
    pushGtmEvent("record_start_from_map");
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
    const recordPath = `/record?${params.toString()}`;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      openLoginPrompt(recordPath);
      return;
    }

    router.push(recordPath);
  }, [store, router]);

  return (
    <div
        className="desktop-store-card absolute bottom-5 left-4 right-4 z-40 rounded-[18px] bg-surface p-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.18)] md:p-5 md:shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
        style={{
          "--desktop-card-left": desktopSidebarOpen
            ? "calc(var(--home-sidebar-width) + (100vw - var(--home-sidebar-width)) / 2)"
            : "calc(var(--home-nav-width) + (100vw - var(--home-nav-width)) / 2)",
        } as CSSProperties}
      >
        <div className="flex items-center gap-2">
          {rank > 0 && (
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-[800] text-white md:h-6 md:w-6 md:text-[12.5px]">
              {rank}
            </span>
          )}
          <span className="flex h-[22px] items-center rounded-[7px] bg-bg px-2 text-[11.5px] font-bold text-text-secondary md:h-6 md:rounded-lg md:px-[9px] md:text-[12px]">
            {categoryLabel}
          </span>
          <button onClick={onClose} className="-my-[7px] -mr-[7px] ml-auto flex h-10 w-10 items-center justify-center rounded-full" aria-label="닫기">
            <CloseIcon size={16} color="var(--color-text-muted)" />
          </button>
        </div>

        <p className="mt-2.5 truncate text-[16px] font-[800] text-text-primary md:mt-3 md:text-[17px]">
          {store.name}
        </p>
        <p className="mt-1 text-[12.5px] text-text-secondary md:mt-[5px] md:text-[13px]">
          픽 {new Intl.NumberFormat("ko-KR").format(store.pick_count)}개
        </p>

        <div className="mt-[9px] flex items-center gap-2 text-[12.5px] text-text-description md:mt-2.5 md:text-[13px]">
          <span className="min-w-0 flex-1 truncate">{address}</span>
          <button
            onClick={handleCopy}
            className={[
              "relative flex h-[23px] w-10 shrink-0 items-center justify-center rounded-[7px] p-0 text-[11px] font-bold transition-colors before:absolute before:-inset-y-2 before:content-[''] md:text-[11.5px]",
              copied ? "bg-success-soft text-success-text" : "bg-bg text-text-secondary",
            ].join(" ")}
            aria-label={copied ? "주소 복사 완료" : "주소 복사"}
          >
            {copied ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12L10 17L19 8" stroke="var(--color-success-text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : "복사"}
          </button>
        </div>

        <button
          onClick={handleRecord}
          className="mt-3.5 flex h-[46px] w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[15px] font-bold text-white transition-colors hover:bg-primary-dark md:mt-4"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
          내 픽 추가하기
        </button>
    </div>
  );
}
