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
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-8">
        {/* 배경 딤 */}
        <div
          className="absolute inset-0 bg-[rgba(20,20,24,0.4)] md:bg-[rgba(20,20,24,0.45)]"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* 팝업 카드 */}
        <div
          className="nepick-fade-in relative w-full max-w-[380px] rounded-[20px] bg-surface p-[26px] text-center shadow-[0_16px_40px_rgba(23,25,28,0.16)] md:p-[30px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          {title && (
            <h2
              id="modal-title"
              className="mb-2 text-center text-[17px] font-[800] text-text-primary"
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:px-6">
      {/* 배경 딤 */}
      <div
        className="absolute inset-0 bg-[rgba(20,20,24,0.4)] transition-opacity duration-300 md:bg-[rgba(20,20,24,0.45)]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 시트 패널 */}
      <div
        className="app-fixed-bar nepick-fade-in relative rounded-t-[26px] bg-surface md:max-w-[400px] md:rounded-[20px] md:shadow-[0_16px_40px_rgba(23,25,28,0.16)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pb-1 pt-3 md:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {title && (
          <div className="px-5 pb-3 pt-2">
            <h2
              id="modal-title"
              className="text-[21px] font-[800] tracking-[-0.4px] text-text-primary"
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
