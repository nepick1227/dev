"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import BottomSheet, { type BottomSheetHandle } from "@/components/map/BottomSheet";
import StoreCard from "./StoreCard";
import Spinner from "@/components/ui/Spinner";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import type { Store } from "@/types/database";

interface RankingSheetProps {
  stores: Store[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onStoreClick?: (storeId: number) => void;
  onSnapChange?: (snap: "collapsed" | "half" | "full") => void;
}

export interface RankingSheetHandle {
  collapse: () => void;
  open: () => void;
}

/**
 * 홈 화면 하단의 맛집 랭킹 바텀시트
 * 데이터 패칭 없이 props로 받은 데이터를 표시합니다.
 */
const RankingSheet = forwardRef<RankingSheetHandle, RankingSheetProps>(function RankingSheet(
  { stores, isLoading, page, totalPages, onPageChange, onStoreClick, onSnapChange },
  ref
) {
  const sheetRef = useRef<BottomSheetHandle>(null);

  useImperativeHandle(ref, () => ({
    collapse: () => sheetRef.current?.collapse(),
    open: () => sheetRef.current?.open(),
  }));

  return (
    <BottomSheet ref={sheetRef} defaultSnap="half" onSnapChange={onSnapChange} showClose>
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
          <p className="text-[15px]">이 지역에 기록된 가게가 없어요</p>
          <p className="mt-1 text-[13px]">지도를 이동하거나 첫 기록을 남겨보세요!</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {stores.map((store, idx) => (
              <li key={store.id}>
                <StoreCard
                  store={store}
                  rank={page * 20 + idx + 1}
                  onClick={onStoreClick}
                />
              </li>
            ))}
          </ul>

          {/* 더보기 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-5 border-t border-border py-4">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                className="disabled:opacity-30"
                aria-label="이전 페이지"
              >
                <ChevronLeftIcon size={20} color="#6B7280" />
              </button>
              <span className="text-[13px] font-semibold text-text-secondary">
                더보기 {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="disabled:opacity-30"
                aria-label="다음 페이지"
              >
                <ChevronRightIcon size={20} color="#6B7280" />
              </button>
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
});

export default RankingSheet;
