"use client";

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div
      aria-live="polite"
      role="status"
      className={`pointer-events-none fixed left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-text-primary px-7 py-3 text-[15px] font-semibold tracking-tight text-white transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
      style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
    >
      {message}
    </div>
  );
}
