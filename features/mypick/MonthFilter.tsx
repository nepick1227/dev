"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

interface MonthFilterProps {
  value: Date;
  onChange: (date: Date) => void;
  compact?: boolean;
}

/**
 * 내 픽 월별 필터 컴포넌트
 * 이전/다음 달 이동 + 날짜 클릭 시 년/월 피커 모달
 */
export default function MonthFilter({ value, onChange, compact = false }: MonthFilterProps) {
  const [showPicker, setShowPicker] = useState(false);

  const nowY = new Date().getFullYear();
  const nowM = new Date().getMonth() + 1;

  const isCurrentMonth =
    value.getFullYear() === nowY && value.getMonth() + 1 === nowM;

  const handlePrev = useCallback(() => {
    onChange(new Date(value.getFullYear(), value.getMonth() - 1, 1));
  }, [value, onChange]);

  const handleNext = useCallback(() => {
    if (isCurrentMonth) return;
    onChange(new Date(value.getFullYear(), value.getMonth() + 1, 1));
  }, [value, onChange, isCurrentMonth]);

  const label = `${value.getFullYear()}년 ${value.getMonth() + 1}월`;

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={handlePrev}
          className={`flex items-center justify-center rounded-lg bg-bg-soft transition-opacity active:opacity-70 ${compact ? "h-[26px] w-[26px]" : "h-7 w-7"}`}
          aria-label="이전 달"
        >
          <ChevronLeftIcon size={compact ? 18 : 20} color="var(--color-text-secondary)" />
        </button>

        <button
          onClick={() => setShowPicker(true)}
          className={`${compact ? "min-w-20 text-[13.5px]" : "min-w-22.5 text-[14px]"} text-center font-[800] text-text-primary`}
        >
          {label}
        </button>

        <button
          onClick={handleNext}
          disabled={isCurrentMonth}
          className={`flex items-center justify-center rounded-lg bg-bg-soft transition-opacity active:opacity-70 disabled:opacity-30 ${compact ? "h-[26px] w-[26px]" : "h-7 w-7"}`}
          aria-label="다음 달"
        >
          <ChevronRightIcon size={compact ? 18 : 20} color="var(--color-text-secondary)" />
        </button>
      </div>

      {showPicker && (
        <MonthPickerModal
          year={value.getFullYear()}
          month={value.getMonth() + 1}
          onSelect={(y, m) => {
            onChange(new Date(y, m - 1, 1));
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

// ── 년/월 피커 모달 ────────────────────────────────────────

interface MonthPickerModalProps {
  year: number;
  month: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}

function MonthPickerModal({ year, month, onSelect, onClose }: MonthPickerModalProps) {
  const nowY = new Date().getFullYear();
  const nowM = new Date().getMonth() + 1;
  const [selYear, setSelYear] = useState(year);
  const [yearMode, setYearMode] = useState(false);

  const startYear = nowY - 11;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[rgba(20,20,24,0.4)] md:items-center md:bg-[rgba(20,20,24,0.45)] md:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[26px] bg-surface px-[22px] pb-[34px] pt-3 md:w-[340px] md:rounded-[20px] md:p-[22px]"
      >
        <div className="flex justify-center pb-[14px] md:hidden">
          <div className="h-[5px] w-10 rounded-full bg-[#E2E4E8]" />
        </div>
        {yearMode ? (
          <>
            <p className="mb-[14px] text-center text-[15.5px] font-[800] text-text-primary">
              년도 선택
            </p>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => startYear + i).map((y) => {
                const isFuture = y > nowY;
                const isSelected = y === selYear;
                return (
                  <button
                    key={y}
                    disabled={isFuture}
                    onClick={() => {
                      if (!isFuture) {
                        setSelYear(y);
                        setYearMode(false);
                      }
                    }}
                    className={`h-[38px] rounded-[10px] text-[13.5px] font-semibold transition-colors disabled:opacity-20 ${
                      isSelected
                        ? "bg-primary text-white"
                        : "text-text-primary"
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* 년도 네비게이션 */}
            <div className="mb-[14px] flex items-center justify-between">
              <button
                onClick={() => setSelYear((y) => y - 1)}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-bg-soft active:opacity-70"
                aria-label="이전 년도"
              >
                <ChevronLeftIcon size={18} color="var(--color-text-primary)" />
              </button>
              <button
                onClick={() => setYearMode(true)}
                className="text-[15.5px] font-[800] text-text-primary"
              >
                {selYear}년
              </button>
              <button
                onClick={() => { if (selYear < nowY) setSelYear((y) => y + 1); }}
                disabled={selYear >= nowY}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-bg-soft active:opacity-70 disabled:opacity-30"
                aria-label="다음 년도"
              >
                <ChevronRightIcon size={18} color="var(--color-text-primary)" />
              </button>
            </div>

            {/* 월 그리드 */}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const isFuture =
                  selYear > nowY || (selYear === nowY && m > nowM);
                const isSelected = selYear === year && m === month;
                return (
                  <button
                    key={m}
                    disabled={isFuture}
                    onClick={() => {
                      if (!isFuture) onSelect(selYear, m);
                    }}
                    className={`h-[38px] rounded-[10px] text-[13.5px] font-semibold transition-colors disabled:opacity-20 ${
                      isSelected
                        ? "bg-primary text-white"
                        : "text-text-primary"
                    }`}
                  >
                    {m}월
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
