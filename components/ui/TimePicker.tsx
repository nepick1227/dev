"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

interface TimePickerProps {
  value: string; // HH:MM (24h)
  onChange: (value: string) => void;
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 10, 20, 30, 40, 50];

function parseTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  const period = h < 12 ? "오전" : "오후";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { period, hour12, minute: m };
}

function toHHMM(period: string, hour12: number, minute: number) {
  let h = hour12;
  if (period === "오전") h = hour12 === 12 ? 0 : hour12;
  else h = hour12 === 12 ? 12 : hour12 + 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { period, hour12, minute } = parseTime(value);

  const display = `${period} ${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex h-[52px] w-full items-center justify-between rounded-[12px] border-[1.5px] bg-white px-[15px] text-left text-[15px] transition-colors ${
          isOpen ? "border-primary" : "border-border"
        }`}
      >
        <span className="text-text-primary">{display}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="var(--color-text-tertiary)" strokeWidth="2" />
          <path d="M12 7V12L15 15" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-[rgba(20,20,24,0.4)] md:bg-[rgba(20,20,24,0.45)]"
            onClick={() => setIsOpen(false)}
            aria-label="시간 선택 닫기"
          />
          <div className="nepick-fade-in relative w-full rounded-t-[26px] bg-surface px-[22px] pb-[34px] pt-3 md:w-[340px] md:rounded-[20px] md:p-[22px]">
            <div className="flex justify-center pb-[14px] md:hidden">
              <div className="h-[5px] w-10 rounded-full bg-[#E2E4E8]" />
            </div>
            <h2 className="text-[15.5px] font-[800] text-text-primary">방문 시각</h2>

            <div className="mt-[14px] grid grid-cols-2 gap-2">
              {["오전", "오후"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChange(toHHMM(p, hour12, minute))}
                  className={`h-[38px] rounded-[10px] text-[13.5px] transition-colors ${period === p ? "bg-primary font-[800] text-white" : "bg-bg-soft font-semibold text-text-body"}`}
                >
                  {p}
                </button>
              ))}
            </div>

            <p className="mt-[14px] text-[12px] font-bold text-text-tertiary">시</p>
            <div className="mt-1.5 grid grid-cols-6 gap-1.5">
              {HOURS_12.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onChange(toHHMM(period, h, minute))}
                  className={`h-[38px] rounded-[10px] text-[13.5px] transition-colors ${hour12 === h ? "bg-primary font-[800] text-white" : "bg-bg-soft font-semibold text-text-body"}`}
                >
                  {h}
                </button>
              ))}
            </div>

            <p className="mt-[14px] text-[12px] font-bold text-text-tertiary">분 (10분 단위)</p>
            <div className="mt-1.5 grid grid-cols-6 gap-1.5">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange(toHHMM(period, hour12, m))}
                  className={`h-[38px] rounded-[10px] text-[13.5px] transition-colors ${minute === m ? "bg-primary font-[800] text-white" : "bg-bg-soft font-semibold text-text-body"}`}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
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
