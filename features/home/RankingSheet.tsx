"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import BottomSheet, { type BottomSheetHandle } from "@/components/map/BottomSheet";
import StoreCard from "./StoreCard";
import Spinner from "@/components/ui/Spinner";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/use-toast";
import MyPickMapToggle from "./MyPickMapToggle";
import type { Store } from "@/types/database";

interface RankingSheetProps {
  stores: Store[];
  isLoading: boolean;
  page?: number;
  totalPages?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onStoreClick?: (storeId: number) => void;
  onSnapChange?: (snap: "collapsed" | "half" | "full") => void;
  defaultSnap?: "collapsed" | "half" | "full";
  regionName?: string;
  isMyPickMode?: boolean;
  onMyPickToggle?: () => void;
}

export interface RankingSheetHandle {
  collapse: () => void;
  open: () => void;
}

const RankingSheet = forwardRef<RankingSheetHandle, RankingSheetProps>(function RankingSheet(
  { stores, isLoading, page = 0, totalPages = 1, hasMore, onLoadMore, onStoreClick, onSnapChange, defaultSnap = "half", regionName, isMyPickMode, onMyPickToggle },
  ref
) {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const { toast, showToast } = useToast();

  const handleLoadMore = () => {
    if (hasMore) {
      onLoadMore?.();
    } else {
      showToast("다른 곳으로 지도를 이동해보세요!");
    }
  };

  useImperativeHandle(ref, () => ({
    collapse: () => sheetRef.current?.collapse(),
    open: () => sheetRef.current?.open(),
  }));

  const header = (
    <div className="flex items-center justify-between px-1 pb-1 pt-0.5">
      <div>
        <p className="text-[11px] font-medium tracking-tight text-text-secondary">
          {isMyPickMode ? "내 픽 지도" : "맛집 랭킹"}
        </p>
        <p className="mt-0.5 text-[17px] font-extrabold tracking-tight text-text-primary leading-snug">
          {isMyPickMode ? "내가 기록한 맛집" : (regionName ?? "불러오는 중...")}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {!isMyPickMode && (
          <button
            onClick={handleLoadMore}
            className={`flex items-center gap-1 rounded-full border border-border bg-bg px-3 py-1.5 text-[12px] font-semibold text-text-secondary transition-colors ${!hasMore ? "opacity-40" : ""}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{page + 1}/{totalPages}</span>
          </button>
        )}
        <MyPickMapToggle
          checked={!!isMyPickMode}
          onChange={() => onMyPickToggle?.()}
        />
      </div>
    </div>
  );

  return (
    <>
    <Toast message={toast.message} visible={toast.visible} />
    <BottomSheet ref={sheetRef} defaultSnap={defaultSnap} onSnapChange={onSnapChange} showClose header={header} desktopSide>
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : stores.length === 0 ? (
        <div className="nepick-fade-in flex flex-col items-center justify-center py-16 text-text-secondary">
          <p className="text-[15px]">{isMyPickMode ? "아직 내가 픽한 맛집이 없어요" : "이 지역에 기록된 가게가 없어요"}</p>
          <p className="mt-1 text-[13px]">{isMyPickMode ? "내 픽을 추가하면 지도에 표시됩니다" : "지도를 이동하거나 첫 기록을 남겨보세요!"}</p>
        </div>
      ) : (
        <ul className="nepick-fade-in divide-y divide-border pb-4">
          {stores.map((store, idx) => (
            <li key={store.id}>
              <StoreCard
                store={store}
                rank={idx + 1}
                onClick={onStoreClick}
              />
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
    </>
  );
});

export default RankingSheet;
