"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import BottomSheet, { type BottomSheetHandle } from "@/components/map/BottomSheet";
import StoreCard from "./StoreCard";
import Spinner from "@/components/ui/Spinner";
import type { Store } from "@/types/database";

interface RankingSheetProps {
  stores: Store[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onStoreClick?: (storeId: number) => void;
  onSnapChange?: (snap: "collapsed" | "half" | "full") => void;
  defaultSnap?: "collapsed" | "half" | "full";
  regionName?: string;
}

export interface RankingSheetHandle {
  collapse: () => void;
  open: () => void;
}

const RankingSheet = forwardRef<RankingSheetHandle, RankingSheetProps>(function RankingSheet(
  { stores, isLoading, page, totalPages, hasMore, onLoadMore, onStoreClick, onSnapChange, defaultSnap = "half", regionName },
  ref
) {
  const sheetRef = useRef<BottomSheetHandle>(null);

  useImperativeHandle(ref, () => ({
    collapse: () => sheetRef.current?.collapse(),
    open: () => sheetRef.current?.open(),
  }));

  const header = (
    <div className="flex items-start justify-between px-1 pb-1 pt-0.5">
      <div>
        <p className="text-[11px] font-medium tracking-tight text-text-secondary">맛집 랭킹</p>
        <p className="mt-0.5 text-[17px] font-extrabold tracking-tight text-text-primary leading-snug">
          {regionName ?? "불러오는 중..."}
        </p>
      </div>
      {totalPages > 1 && (
        <button
          onClick={hasMore ? onLoadMore : undefined}
          disabled={!hasMore}
          className={`mt-1 flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
            hasMore
              ? "border-border bg-bg text-text-secondary active:bg-border"
              : "cursor-default border-border bg-bg opacity-60"
          }`}
        >
          <span>📍</span>
          <span>
            <span className="text-text-secondary">더보기 </span>
            {hasMore ? (
              <span className="text-text-secondary">{page + 1}/{totalPages}</span>
            ) : (
              <>
                <span className="text-primary">{page + 1}</span>
                <span className="text-text-secondary">/{totalPages}</span>
              </>
            )}
          </span>
        </button>
      )}
    </div>
  );

  return (
    <BottomSheet ref={sheetRef} defaultSnap={defaultSnap} onSnapChange={onSnapChange} showClose header={header} desktopSide>
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : stores.length === 0 ? (
        <div className="nepick-fade-in flex flex-col items-center justify-center py-16 text-text-secondary">
          <p className="text-[15px]">이 지역에 기록된 가게가 없어요</p>
          <p className="mt-1 text-[13px]">지도를 이동하거나 첫 기록을 남겨보세요!</p>
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
  );
});

export default RankingSheet;
