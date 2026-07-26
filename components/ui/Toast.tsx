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
      className={`pointer-events-none fixed left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 break-keep rounded-3xl bg-text-primary px-7 py-3 text-center text-[15px] font-semibold tracking-tight text-white transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
      style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
    >
      {message}
    </div>
  );
}
