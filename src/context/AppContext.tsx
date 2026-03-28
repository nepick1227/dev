"use client";

import { createContext, useContext, useState, useCallback } from "react";

type Page =
  | "terms"
  | "login"
  | "signup"
  | "home"
  | "record"
  | "mypick"
  | "profile"
  | "withdrawal"
  | "withdrawalDone"
  | "networkError"
  | "back";

type HistoryEntry = {
  page: Exclude<Page, "back">;
  data: Record<string, unknown> | null;
};

type AppContextType = {
  navigate: (page: Page, data?: Record<string, unknown> | null) => void;
  showToast: (message: string) => void;
  pageData: Record<string, unknown> | null;
};

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { page: "terms", data: null },
  ]);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const navigate = useCallback(
    (page: Page, data: Record<string, unknown> | null = null) => {
      if (page === "back") {
        setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
      } else if (["home", "mypick", "profile"].includes(page)) {
        setHistory([{ page: page as Exclude<Page, "back">, data }]);
      } else {
        setHistory((h) => [...h, { page: page as Exclude<Page, "back">, data }]);
      }
    },
    []
  );

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2500);
  }, []);

  const current = history[history.length - 1];

  return (
    <AppContext.Provider value={{ navigate, showToast, pageData: current.data }}>
      {/* Toast */}
      <div
        style={{
          position: "fixed",
          bottom: 100,
          left: "50%",
          transform: `translateX(-50%) translateY(${toast.visible ? 0 : 20}px)`,
          background: "#111827",
          color: "#fff",
          padding: "12px 28px",
          borderRadius: 100,
          fontSize: 14,
          fontWeight: 600,
          zIndex: 300,
          opacity: toast.visible ? 1 : 0,
          transition: "all 0.3s ease",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {toast.message}
      </div>
      {children}
    </AppContext.Provider>
  );
}
