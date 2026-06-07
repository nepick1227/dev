"use client";

import { useState, useRef, useEffect } from "react";

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
  const ref = useRef<HTMLDivElement>(null);
  const { period, hour12, minute } = parseTime(value);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen]);

  const display = `${period} ${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-xl border-[1.5px] bg-white px-4 py-3.5 text-left text-[15px] tracking-tight transition-colors ${
          isOpen ? "border-primary" : "border-border"
        }`}
      >
        <span className="text-text-primary">{display}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="#9CA3AF" strokeWidth="2" />
          <path d="M12 7V12L15 15" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="flex max-h-52 divide-x divide-border">
            {/* 오전/오후 */}
            <div className="flex-1 overflow-y-auto">
              {["오전", "오후"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChange(toHHMM(p, hour12, minute))}
                  className={`w-full py-3.5 text-center text-[14px] transition-colors ${
                    period === p
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-text-primary active:bg-bg"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* 시 */}
            <div className="flex-1 overflow-y-auto">
              {HOURS_12.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onChange(toHHMM(period, h, minute))}
                  className={`w-full py-3.5 text-center text-[14px] transition-colors ${
                    hour12 === h
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-text-primary active:bg-bg"
                  }`}
                >
                  {String(h).padStart(2, "0")}
                </button>
              ))}
            </div>

            {/* 분 */}
            <div className="flex-1 overflow-y-auto">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange(toHHMM(period, hour12, m))}
                  className={`w-full py-3.5 text-center text-[14px] transition-colors ${
                    minute === m
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-text-primary active:bg-bg"
                  }`}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
