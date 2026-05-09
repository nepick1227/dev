"use client";

import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";

type SnapPoint = "collapsed" | "half" | "full";

interface BottomSheetProps {
  collapsedHeight?: number;
  halfHeight?: number;
  defaultSnap?: SnapPoint;
  children: React.ReactNode;
  header?: React.ReactNode;
  onSnapChange?: (snap: SnapPoint) => void;
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
      className="absolute bottom-0 left-0 right-0 z-30 flex flex-col rounded-t-2xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out"
      style={{ height: SNAP_HEIGHTS[snap] }}
    >
      {/* 드래그 핸들 */}
      <div
        className="flex shrink-0 cursor-grab touch-none items-center px-3 pb-2 pt-3 active:cursor-grabbing"
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
        <div className="w-7 shrink-0" />
        <div className="flex flex-1 justify-center">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        {showClose && snap !== "collapsed" ? (
          <button
            onClick={(e) => { e.stopPropagation(); updateSnap("collapsed"); }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg"
            aria-label="닫기"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        ) : (
          <div className="w-7 shrink-0" />
        )}
      </div>

      {/* 고정 헤더 */}
      {header && <div className="shrink-0 px-4 pb-2">{header}</div>}

      {/* 스크롤 영역 — flex-1 + min-h-0 으로 남은 공간만 차지 */}
      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
});

export default BottomSheet;
