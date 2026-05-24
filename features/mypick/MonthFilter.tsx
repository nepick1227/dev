"use client";

import { useState, useCallback } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

interface MonthFilterProps {
  value: Date;
  onChange: (date: Date) => void;
}

/**
 * 내 픽 월별 필터 컴포넌트
 * 이전/다음 달 이동 + 날짜 클릭 시 년/월 피커 모달
 */
export default function MonthFilter({ value, onChange }: MonthFilterProps) {
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
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors active:bg-bg"
          aria-label="이전 달"
        >
          <ChevronLeftIcon size={20} color="var(--color-text-secondary)" />
        </button>

        <button
          onClick={() => setShowPicker(true)}
          className="min-w-22.5 text-center text-[15px] font-bold tracking-tight text-text-primary"
        >
          {label}
        </button>

        <button
          onClick={handleNext}
          disabled={isCurrentMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors active:bg-bg disabled:opacity-30"
          aria-label="다음 달"
        >
          <ChevronRightIcon size={20} color="var(--color-text-secondary)" />
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-75 rounded-2xl bg-surface p-6"
      >
        {yearMode ? (
          <>
            <p className="mb-4 text-center text-[16px] font-bold tracking-tight text-text-primary">
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
                    className={`rounded-[10px] py-3 text-[14px] font-semibold tracking-tight transition-colors disabled:opacity-20 ${
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
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setSelYear((y) => y - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full active:bg-bg"
                aria-label="이전 년도"
              >
                <ChevronLeftIcon size={18} color="var(--color-text-primary)" />
              </button>
              <button
                onClick={() => setYearMode(true)}
                className="text-[18px] font-bold tracking-tight text-text-primary"
              >
                {selYear}년
              </button>
              <button
                onClick={() => { if (selYear < nowY) setSelYear((y) => y + 1); }}
                disabled={selYear >= nowY}
                className="flex h-8 w-8 items-center justify-center rounded-full active:bg-bg disabled:opacity-30"
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
                    className={`rounded-[10px] py-2.5 text-[14px] font-semibold tracking-tight transition-colors disabled:opacity-20 ${
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
    </div>
  );
}
