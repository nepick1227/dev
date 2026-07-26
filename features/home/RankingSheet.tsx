"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import BottomSheet, { type BottomSheetHandle } from "@/components/map/BottomSheet";
import StoreCard from "./StoreCard";
import Spinner from "@/components/ui/Spinner";
import MyPickMapToggle from "./MyPickMapToggle";
import type { Store } from "@/types/database";

interface RankingSheetProps {
  stores: Store[];
  isLoading: boolean;
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
  { stores, isLoading, onStoreClick, onSnapChange, defaultSnap = "half", regionName, isMyPickMode, onMyPickToggle },
  ref
) {
  const sheetRef = useRef<BottomSheetHandle>(null);

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
      <MyPickMapToggle
        checked={!!isMyPickMode}
        onChange={() => onMyPickToggle?.()}
      />
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
  );
});

export default RankingSheet;
