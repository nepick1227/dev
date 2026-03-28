"use client";

import { C } from "@/styles/theme";
import { useApp } from "@/context/AppContext";

type Props = {
  address: string;
  size?: number;
};

export default function CopyBtn({ address, size = 12 }: Props) {
  const { showToast } = useApp();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(address).catch(() => {});
        showToast("주소가 복사되었어요");
      }}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <rect x="5" y="5" width="9" height="9" rx="2" stroke={C.textSecondary} strokeWidth="1.3" />
        <path d="M11 5V3a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2h2" stroke={C.textSecondary} strokeWidth="1.3" />
      </svg>
    </button>
  );
}
