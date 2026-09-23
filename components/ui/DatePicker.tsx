"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "@/components/ui/icons";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  max?: string;
  min?: string;
  placeholder?: string;
}

type ViewMode = "day" | "month" | "year";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const YEAR_PAGE_SIZE = 12;

function getYearRangeStart(year: number) {
  return Math.floor(year / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE;
}

export default function DatePicker({
  value,
  onChange,
  max,
  min,
  placeholder = "날짜 선택",
}: DatePickerProps) {
  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [view, setView] = useState(() => {
    const base = parsed ?? new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const [yearRangeStart, setYearRangeStart] = useState(() =>
    getYearRangeStart(parsed?.getFullYear() ?? new Date().getFullYear())
  );
  const maxDate = max ? new Date(max + "T00:00:00") : null;
  const minDate = min ? new Date(min + "T00:00:00") : null;

  // ── Day view helpers ──────────────────────────────────
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDow = new Date(view.year, view.month, 1).getDay();

  const isDayDisabled = (day: number) => {
    const d = new Date(view.year, view.month, day);
    if (maxDate && d > maxDate) return true;
    if (minDate && d < minDate) return true;
    return false;
  };
  const isSelected = (day: number) =>
    !!parsed &&
    parsed.getFullYear() === view.year &&
    parsed.getMonth() === view.month &&
    parsed.getDate() === day;
  const isToday = (day: number) => {
    const t = new Date();
    return t.getFullYear() === view.year && t.getMonth() === view.month && t.getDate() === day;
  };

  const handleDay = (day: number) => {
    const m = String(view.month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${view.year}-${m}-${d}`);
  };

  // ── Month view helpers ────────────────────────────────
  const handleMonth = (monthIndex: number) => {
    setView((v) => ({ ...v, month: monthIndex }));
    setViewMode("day");
  };

  // ── Year view helpers ─────────────────────────────────
  const handleYear = (year: number) => {
    setView((v) => ({ ...v, year }));
    setYearRangeStart(getYearRangeStart(year));
    setViewMode("month");
  };

  // ── Header click cycles day → month → year ────────────
  const handleHeaderClick = () => {
    if (viewMode === "day") setViewMode("month");
    else if (viewMode === "month") {
      setYearRangeStart(getYearRangeStart(view.year));
      setViewMode("year");
    }
  };

  // ── next 버튼 비활성 조건 ─────────────────────────────
  const isNextDisabled =
    maxDate &&
    (viewMode === "day"
      ? view.year > maxDate.getFullYear() ||
        (view.year === maxDate.getFullYear() && view.month >= maxDate.getMonth())
      : viewMode === "month"
      ? view.year >= maxDate.getFullYear()
      : yearRangeStart + YEAR_PAGE_SIZE > maxDate.getFullYear());

  // ── Navigation arrows ─────────────────────────────────
  const handlePrev = () => {
    if (viewMode === "day")
      setView((v) => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
    else if (viewMode === "month")
      setView((v) => ({ ...v, year: v.year - 1 }));
    else
      setYearRangeStart((s) => s - YEAR_PAGE_SIZE);
  };
  const handleNext = () => {
    if (isNextDisabled) return;
    if (viewMode === "day")
      setView((v) => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });
    else if (viewMode === "month")
      setView((v) => ({ ...v, year: v.year + 1 }));
    else
      setYearRangeStart((s) => s + YEAR_PAGE_SIZE);
  };

  // ── Header label ──────────────────────────────────────
  const headerLabel =
    viewMode === "day"
      ? `${view.year}년 ${view.month + 1}월`
      : viewMode === "month"
      ? `${view.year}년`
      : `${yearRangeStart} – ${yearRangeStart + YEAR_PAGE_SIZE - 1}`;

  // ── Display value ─────────────────────────────────────
  const display = parsed
    ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`
    : "";

  return (
    <div className="relative w-full">
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex h-[52px] w-full items-center justify-between rounded-[12px] border-[1.5px] bg-white px-[15px] text-left text-[15px] transition-colors ${
          isOpen ? "border-primary" : "border-border"
        }`}
      >
        <span className={display ? "text-text-primary" : "text-text-muted"}>
          {display || placeholder}
        </span>
        <CalendarIcon size={18} color="var(--color-text-tertiary)" />
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-[rgba(20,20,24,0.4)] md:bg-[rgba(20,20,24,0.45)]"
            onClick={() => { setIsOpen(false); setViewMode("day"); }}
            aria-label="날짜 선택 닫기"
          />
          <div className="nepick-fade-in relative w-full rounded-t-[26px] bg-surface px-[22px] pb-[34px] pt-3 md:w-[340px] md:rounded-[20px] md:p-[22px]">
          <div className="flex justify-center pb-[14px] md:hidden">
            <div className="h-[5px] w-10 rounded-full bg-[#E2E4E8]" />
          </div>
          {/* 헤더 */}
          <div className="flex items-center justify-between">
              <button type="button" onClick={handlePrev} className="-m-[5px] flex h-10 w-10 items-center justify-center active:opacity-70">
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-bg-soft">
                <ChevronLeftIcon size={18} color="var(--color-text-secondary)" />
              </span>
            </button>
            <button
              type="button"
              onClick={handleHeaderClick}
              className="text-[15.5px] font-[800] text-text-primary active:opacity-70"
            >
              {headerLabel}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!!isNextDisabled}
                className={`-m-[5px] flex h-10 w-10 items-center justify-center transition-opacity ${isNextDisabled ? "cursor-not-allowed opacity-25" : "active:opacity-70"}`}
              >
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-bg-soft">
                <ChevronRightIcon size={18} color="var(--color-text-secondary)" />
              </span>
            </button>
          </div>

          {/* ── Day view ── */}
          {viewMode === "day" && (
            <>
              <div className="mt-[14px] grid grid-cols-7 gap-0.5">
                {DOW.map((d) => (
                  <div
                    key={d}
                    className="flex h-6 items-center justify-center text-center text-[12px] font-bold text-text-muted"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const disabled = isDayDisabled(day);
                  const selected = isSelected(day);
                  const today = isToday(day);
                  const isSun = (firstDow + i) % 7 === 0;
                  return (
                    <div key={day} className="flex justify-center">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleDay(day)}
                        className={`flex h-[34px] w-full items-center justify-center rounded-[10px] text-[13.5px] transition-colors ${
                          selected
                            ? "bg-primary font-[800] text-white"
                            : disabled
                            ? "cursor-not-allowed text-[#D1D5DB]"
                            : today
                            ? "font-bold text-primary"
                            : isSun
                            ? "text-primary/60 active:bg-bg"
                            : "font-semibold text-text-body active:bg-bg"
                        }`}
                      >
                        {day}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Month view ── */}
          {viewMode === "month" && (
            <div className="grid grid-cols-3 gap-2">
              {MONTH_NAMES.map((name, i) => {
                const isMonthDisabled =
                  !!maxDate &&
                  (view.year > maxDate.getFullYear() ||
                    (view.year === maxDate.getFullYear() && i > maxDate.getMonth()));
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isMonthDisabled}
                    onClick={() => handleMonth(i)}
                    className={`rounded-xl py-3 text-[14px] font-medium transition-colors ${
                      isMonthDisabled
                        ? "cursor-not-allowed text-[#D1D5DB]"
                        : parsed && parsed.getFullYear() === view.year && parsed.getMonth() === i
                        ? "bg-primary text-white"
                        : view.month === i
                        ? "bg-primary/10 text-primary"
                        : "text-text-primary active:bg-bg"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Year view ── */}
          {viewMode === "year" && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: YEAR_PAGE_SIZE }).map((_, i) => {
                const year = yearRangeStart + i;
                const isYearDisabled = !!maxDate && year > maxDate.getFullYear();
                return (
                  <button
                    key={year}
                    type="button"
                    disabled={isYearDisabled}
                    onClick={() => handleYear(year)}
                    className={`rounded-xl py-3 text-[14px] font-medium transition-colors ${
                      isYearDisabled
                        ? "cursor-not-allowed text-[#D1D5DB]"
                        : parsed && parsed.getFullYear() === year
                        ? "bg-primary text-white"
                        : view.year === year
                        ? "bg-primary/10 text-primary"
                        : "text-text-primary active:bg-bg"
                    }`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => { setIsOpen(false); setViewMode("day"); }}
            className="mt-4 h-[50px] w-full rounded-[14px] bg-primary text-[15px] font-bold text-white md:mt-[18px] md:h-12 md:rounded-[13px]"
          >
            확인
          </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
