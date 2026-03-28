"use client";

import { C } from "@/styles/theme";
import { useApp } from "@/context/AppContext";

type TabId = "mypick" | "home" | "profile";

type Props = {
  active: TabId;
};

const tabs: { id: TabId; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: "mypick",
    label: "내 픽",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M6 3h10a2 2 0 012 2v14l-7-4-7 4V5a2 2 0 012-2z"
          stroke={a ? C.primary : C.textSecondary}
          strokeWidth="1.8"
          fill={a ? "rgba(211,47,47,0.1)" : "none"}
        />
      </svg>
    ),
  },
  {
    id: "home",
    label: "홈",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 9l8-6 8 6v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          stroke={a ? C.primary : C.textSecondary}
          strokeWidth="1.8"
          fill={a ? "rgba(211,47,47,0.1)" : "none"}
        />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "프로필",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle
          cx="11"
          cy="8"
          r="4"
          stroke={a ? C.primary : C.textSecondary}
          strokeWidth="1.8"
        />
        <path
          d="M3 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
          stroke={a ? C.primary : C.textSecondary}
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
];

export default function BottomNav({ active }: Props) {
  const { navigate } = useApp();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "10px 0 18px",
        background: C.white,
        borderTop: `1px solid ${C.border}`,
        flexShrink: 0,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => navigate(t.id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            padding: "4px 16px",
            minWidth: 64,
          }}
        >
          {t.icon(t.id === active)}
          <span
            style={{
              fontSize: 11,
              fontWeight: t.id === active ? 700 : 500,
              color: t.id === active ? C.primary : C.textSecondary,
              letterSpacing: -0.2,
            }}
          >
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}
