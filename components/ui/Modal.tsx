"use client";

import { useEffect, useCallback } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 하단 고정 버튼 영역 */
  footer?: React.ReactNode;
  /**
   * "sheet"  — 하단에서 올라오는 시트 (기본값)
   * "dialog" — 화면 중앙 팝업
   */
  variant?: "sheet" | "dialog";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  variant = "sheet",
}: ModalProps) {
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

  // ── 중앙 팝업 ──────────────────────────────────────
  if (variant === "dialog") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
        {/* 배경 딤 */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* 팝업 카드 */}
        <div
          className="nepick-fade-in relative w-full max-w-[320px] rounded-3xl bg-surface px-6 py-7"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          {title && (
            <h2
              id="modal-title"
              className="mb-2 text-center text-[17px] font-bold tracking-tight text-text-primary"
            >
              {title}
            </h2>
          )}

          <div className="text-center">{children}</div>

          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    );
  }

  // ── 하단 시트 (기본) ───────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 배경 딤 */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 시트 패널 */}
      <div
        className="nepick-fade-in relative w-full max-w-107.5 rounded-t-3xl bg-surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pb-1 pt-3">
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
