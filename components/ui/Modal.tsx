"use client";

import { useEffect, useCallback } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 하단 고정 버튼 영역 */
  footer?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 모달 패널 */}
      <div
        className="relative w-full max-w-[430px] rounded-t-2xl bg-white"
        style={{ animation: "nepick-fade-up 0.25s ease-out" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {title && (
          <div className="px-5 pb-3 pt-2">
            <h2
              id="modal-title"
              className="text-[18px] font-bold tracking-tight text-text-primary"
            >
              {title}
            </h2>
          </div>
        )}

        <div className="px-5 pb-4">{children}</div>

        {footer && (
          <div className="border-t border-border px-5 pb-8 pt-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
