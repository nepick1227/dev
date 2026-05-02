"use client";

"use client";

import { useState, useCallback, useRef } from "react";

interface ToastState {
  visible: boolean;
  message: string;
}

export function useToast(duration = 2000) {
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ visible: true, message });
      timerRef.current = setTimeout(() => {
        setToast({ visible: false, message: "" });
      }, duration);
    },
    [duration]
  );

  return { toast, showToast };
}
