"use client";

interface FloatingRecordButtonProps {
  onClick: () => void;
}

export default function FloatingRecordButton({ onClick }: FloatingRecordButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-primary bg-primary px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg transition-all duration-200 hover:bg-primary-dark active:scale-[0.97]"
    >
      + 기록
    </button>
  );
}
