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
      className="pointer-events-none fixed bottom-24 left-1/2 z-50 rounded-full px-7 py-3 text-[14px] font-semibold tracking-tight text-white transition-all duration-300"
      style={{
        background: "#111827",
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`,
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}
