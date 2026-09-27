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
      className={`pointer-events-none fixed left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 break-keep rounded-[14px] bg-text-primary px-[22px] py-[14px] text-center text-[14.5px] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)] transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
      style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
    >
      {message}
    </div>
  );
}
