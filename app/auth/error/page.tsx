"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function NepickLogo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D32F2F" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#D32F2F" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d="M40 74C40 74 64 50 64 30C64 16.75 53.25 6 40 6C26.75 6 16 16.75 16 30C16 50 40 74 40 74Z"
        fill="#D32F2F"
      />
      <path
        d="M25 38h30v3c0 7-5.5 11-15 11S25 48 25 41v-3z"
        fill="url(#logo-grad)"
        stroke="#DF6767"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <text
        x="40"
        y="31"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="24"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="white"
      >
        N
      </text>
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      style={{ animation: "nepick-spin 0.8s linear infinite" }}
      aria-hidden="true"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="#D32F2F" strokeWidth="3" fill="none"
        strokeDasharray="30 70" strokeLinecap="round"
      />
    </svg>
  );
}

export default function AuthErrorPage() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 뒤로가기 → 로그인 페이지로 강제 이동
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => router.replace("/auth/login");
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace("/home");
      } else {
        // 세션 없음 → 에러 페이지 리셋
        window.location.replace("/auth/error");
      }
    } catch {
      window.location.replace("/auth/error");
    }
  };

  if (isRefreshing) {
    return (
      <div className="mx-auto flex h-screen max-w-107.5 flex-col items-center justify-center gap-5 bg-white font-sans">
        <NepickLogo size={80} />
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-screen max-w-107.5 flex-col bg-white font-sans">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8">
        <NepickLogo size={80} />

        <div className="mt-2 flex flex-col items-center gap-1.5">
          <p className="text-center text-[20px] font-bold tracking-tight text-text-primary">
            로그인에 문제가 있나요?
          </p>
          <p className="text-center text-[14px] leading-relaxed tracking-tight text-text-secondary">
            일시적인 오류가 발생했어요.<br />잠시 후 다시 시도하거나 문의해 주세요.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-6 pb-11">
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-xl border border-border py-4 text-[15px] font-semibold tracking-tight text-text-primary transition-opacity active:opacity-60"
        >
          문의하기
        </a>
        <button
          onClick={handleRefresh}
          className="flex w-full items-center justify-center rounded-xl bg-primary py-4 text-[15px] font-bold tracking-tight text-white transition-opacity active:opacity-80"
        >
          새로고침 하기
        </button>
      </div>
    </div>
  );
}
