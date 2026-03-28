"use client";

import { useCallback } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

interface MonthFilterProps {
  value: Date;
  onChange: (date: Date) => void;
}

/**
 * 월별 필터 컴포넌트 (이전/다음 달 이동)
 */
export default function MonthFilter({ value, onChange }: MonthFilterProps) {
  const handlePrev = useCallback(() => {
    onChange(new Date(value.getFullYear(), value.getMonth() - 1, 1));
  }, [value, onChange]);

  const handleNext = useCallback(() => {
    const next = new Date(value.getFullYear(), value.getMonth() + 1, 1);
    if (next > new Date()) return; // 미래 달 이동 방지
    onChange(next);
  }, [value, onChange]);

  const isCurrentMonth =
    value.getFullYear() === new Date().getFullYear() &&
    value.getMonth() === new Date().getMonth();

  const label = `${value.getFullYear()}년 ${value.getMonth() + 1}월`;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrev}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors active:bg-bg"
        aria-label="이전 달"
      >
        <ChevronLeftIcon size={20} color="#6B7280" />
      </button>

      <span className="min-w-[100px] text-center text-[15px] font-bold tracking-tight text-text-primary">
        {label}
      </span>

      <button
        onClick={handleNext}
        disabled={isCurrentMonth}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors active:bg-bg disabled:opacity-30"
        aria-label="다음 달"
      >
        <ChevronRightIcon size={20} color="#6B7280" />
      </button>
    </div>
  );
}
