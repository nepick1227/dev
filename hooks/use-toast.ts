"use client";

import { useState, useCallback } from "react";

interface ToastState {
  visible: boolean;
  message: string;
}

/**
 * 토스트 메시지 상태 관리 훅
 *
 * @example
 * const { toast, showToast } = useToast();
 * // <Toast message={toast.message} visible={toast.visible} />
 * showToast("저장되었습니다");
 */
export function useToast(duration = 2000) {
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "" });

  const showToast = useCallback(
    (message: string) => {
      setToast({ visible: true, message });
      setTimeout(() => {
        setToast({ visible: false, message: "" });
      }, duration);
    },
    [duration]
  );

  return { toast, showToast };
}
