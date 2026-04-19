"use client";

import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";

type SnapPoint = "collapsed" | "half" | "full";

interface BottomSheetProps {
  /** 접힌 상태 높이 (px) */
  collapsedHeight?: number;
  /** 절반 상태 높이 (vh %) */
  halfHeight?: number;
  /** 초기 스냅 포인트 */
  defaultSnap?: SnapPoint;
  children: React.ReactNode;
  /** 핸들 바 아래 고정 헤더 영역 */
  header?: React.ReactNode;
  /** 스냅 포인트 변경 시 콜백 */
  onSnapChange?: (snap: SnapPoint) => void;
  /** 닫기 버튼 표시 여부 */
  showClose?: boolean;
}

const SNAP_HEIGHTS: Record<SnapPoint, string> = {
  collapsed: "88px",
  half: "50vh",
  full: "calc(100dvh - 88px)",
};

export interface BottomSheetHandle {
  collapse: () => void;
  open: () => void;
}

/**
 * 드래그 가능한 바텀 시트 컴포넌트
 * 3단계 스냅 포인트(접힘 / 절반 / 전체)를 지원합니다.
 */
const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(function BottomSheet({
  defaultSnap = "half",
  children,
  header,
  onSnapChange,
  showClose = false,
}, ref) {
  const [snap, setSnap] = useState<SnapPoint>(defaultSnap);

  const updateSnap = useCallback((next: SnapPoint) => {
    setSnap(next);
  }, []);

  useEffect(() => {
    onSnapChange?.(snap);
  }, [snap]); // eslint-disable-line react-hooks/exhaustive-deps
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartSnap = useRef<SnapPoint>(defaultSnap);

  useImperativeHandle(ref, () => ({
    collapse: () => updateSnap("collapsed"),
    open: () => updateSnap("half"),
  }));

  const cycleSnap = useCallback((direction: "up" | "down") => {
    const order: SnapPoint[] = ["collapsed", "half", "full"];
    setSnap((prev) => {
      const idx = order.indexOf(prev);
      const next = direction === "up"
        ? order[Math.min(idx + 1, order.length - 1)]
        : order[Math.max(idx - 1, 0)];
      return next;
    });
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      dragStartY.current = e.touches[0].clientY;
      dragStartSnap.current = snap;
    },
    [snap]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = e.changedTouches[0].clientY - dragStartY.current;
      const threshold = 40;
      if (deltaY < -threshold) cycleSnap("up");
      else if (deltaY > threshold) cycleSnap("down");
    },
    [cycleSnap]
  );

  // 마우스 드래그 (PC 미리보기용)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragStartY.current = e.clientY;
      dragStartSnap.current = snap;

      const onMouseUp = (ev: MouseEvent) => {
        const deltaY = ev.clientY - dragStartY.current;
        if (deltaY < -40) cycleSnap("up");
        else if (deltaY > 40) cycleSnap("down");
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mouseup", onMouseUp);
    },
    [snap, cycleSnap]
  );

  return (
    <div
      ref={sheetRef}
      className="absolute bottom-0 left-0 right-0 z-30 rounded-t-2xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out"
      style={{ height: SNAP_HEIGHTS[snap] }}
    >
      {/* 드래그 핸들 */}
      <div className="relative">
        <div
          className="flex cursor-grab touch-none justify-center pb-2 pt-3 active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          role="button"
          aria-label="시트 크기 조절"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") cycleSnap("up");
            if (e.key === "ArrowDown") cycleSnap("down");
          }}
        >
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        {showClose && snap !== "collapsed" && (
          <button
            onClick={() => updateSnap("collapsed")}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-bg"
            aria-label="닫기"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {header && <div className="px-4 pb-2">{header}</div>}

      <div className="hide-scrollbar h-[calc(100%-40px)] overflow-y-auto">
        {children}
      </div>
    </div>
  );
});

export default BottomSheet;
