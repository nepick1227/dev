"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setViewMode("day");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen]);

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
    setIsOpen(false);
    setViewMode("day");
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
    <div ref={ref} className="relative w-full">
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-xl border-[1.5px] bg-white px-4 py-3.5 text-left text-[15px] tracking-tight transition-colors ${
          isOpen ? "border-primary" : "border-border"
        }`}
      >
        <span className={display ? "text-text-primary" : "text-text-secondary"}>
          {display || placeholder}
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="3" stroke="#9CA3AF" strokeWidth="2" />
          <path d="M3 9H21" stroke="#9CA3AF" strokeWidth="2" />
          <path d="M8 2V6M16 2V6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-border bg-white p-4 shadow-lg">
          {/* 헤더 */}
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={handlePrev} className="rounded-lg p-1 active:bg-bg">
              <ChevronLeftIcon size={18} color="#6B7280" />
            </button>
            <button
              type="button"
              onClick={handleHeaderClick}
              className="text-[15px] font-semibold text-text-primary active:opacity-70"
            >
              {headerLabel}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!!isNextDisabled}
              className={`rounded-lg p-1 transition-opacity ${isNextDisabled ? "cursor-not-allowed opacity-25" : "active:bg-bg"}`}
            >
              <ChevronRightIcon size={18} color="#6B7280" />
            </button>
          </div>

          {/* ── Day view ── */}
          {viewMode === "day" && (
            <>
              <div className="mb-1 grid grid-cols-7">
                {DOW.map((d, i) => (
                  <div
                    key={d}
                    className={`py-1 text-center text-[12px] font-medium ${
                      i === 0 ? "text-primary" : "text-text-secondary"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const disabled = isDayDisabled(day);
                  const selected = isSelected(day);
                  const today = isToday(day);
                  const isSun = (firstDow + i) % 7 === 0;
                  return (
                    <div key={day} className="flex justify-center py-0.5">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleDay(day)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-[14px] transition-colors ${
                          selected
                            ? "bg-primary font-semibold text-white"
                            : disabled
                            ? "cursor-not-allowed text-[#D1D5DB]"
                            : today
                            ? "font-semibold text-primary"
                            : isSun
                            ? "text-primary/60 active:bg-bg"
                            : "text-text-primary active:bg-bg"
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
        </div>
      )}
    </div>
  );
}
