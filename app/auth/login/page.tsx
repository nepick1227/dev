"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

// ── 네픽 로고 SVG ───────────────────────────────────
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

// ── 로딩 스피너 ─────────────────────────────────────
function Spinner({ color = "#fff", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ animation: "nepick-spin 0.8s linear infinite" }}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeDasharray="30 70"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── 카카오 로그인 버튼 ──────────────────────────────
function KakaoButton({
  isLoading,
  isRecent,
  onClick,
}: {
  isLoading: boolean;
  isRecent: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative">
      {isRecent && !isLoading && (
        <div className="absolute -top-2.5 left-4 z-10 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold tracking-tight text-white">
          최근 로그인
        </div>
      )}
      <button
        onClick={onClick}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FEE500] py-4 text-[15px] font-semibold tracking-tight text-[#191919] transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="카카오로 시작하기"
      >
        {isLoading ? (
          <Spinner color="#191919" size={20} />
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path
                d="M11 3C6.03 3 2 6.13 2 9.96c0 2.39 1.56 4.5 3.93 5.74l-1 3.63c-.08.3.26.54.52.37l4.34-2.88c.39.04.79.06 1.21.06 4.97 0 9-3.13 9-6.96C20 6.13 15.97 3 11 3z"
                fill="#191919"
              />
            </svg>
            카카오로 시작하기
          </>
        )}
      </button>
    </div>
  );
}

// ── 메인: 로그인 페이지 ─────────────────────────────
export default function LoginPage() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // URL 에러 파라미터를 직접 메시지로 변환 (effect 불필요)
  const errorMessage =
    errorParam === "auth_failed"
      ? "로그인에 실패했습니다. 다시 시도해 주세요."
      : errorParam === "missing_code"
        ? "인증 코드가 없습니다. 다시 시도해 주세요."
        : null;

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const [loginError, setLoginError] = useState<string | null>(null);

  const handleKakaoLogin = useCallback(async () => {
    setIsLoading(true);
    setLoginError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo },
    });

    if (error) {
      setLoginError("카카오 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      setIsLoading(false);
    }
    // 성공 시 카카오 OAuth 페이지로 리다이렉트되므로 setIsLoading(false) 불필요
  }, []);

  return (
    <div className="page-container">
      {/* 로고 & 타이틀 */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.6s ease-out",
        }}
      >
        <div className="relative mb-6">
          <NepickLogo size={80} />
          <div
            className="absolute -inset-3 -z-10 rounded-[34px]"
            style={{
              background: "radial-gradient(circle, rgba(211,47,47,0.12) 0%, transparent 70%)",
            }}
          />
        </div>
        <h1 className="mb-1.5 text-[32px] font-extrabold tracking-[-1px] text-text-primary">
          NePick
        </h1>
        <p className="text-[15px] tracking-tight text-text-secondary">나만의 맛집 기록</p>
      </div>

      {/* 로그인 버튼 영역 */}
      <div
        className="flex flex-col gap-2.5 px-6 pb-11"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.6s ease-out 0.15s",
        }}
      >
        {/* 에러 메시지 (URL 파라미터 또는 로그인 오류) */}
        {(errorMessage ?? loginError) && (
          <p className="mb-1 text-center text-[13px] text-primary">{errorMessage ?? loginError}</p>
        )}

        <KakaoButton isLoading={isLoading} isRecent={true} onClick={handleKakaoLogin} />

        <button
          onClick={() => { window.location.href = "/api/auth/naver"; }}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#03C75A] py-4 text-[15px] font-semibold tracking-tight text-white transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="네이버로 시작하기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M13.57 10.69L6.14 2H2v16h4.43V9.31L13.86 18H18V2h-4.43v8.69z"
              fill="white"
            />
          </svg>
          네이버로 시작하기
        </button>

        <p className="mt-1 text-center text-[12px] tracking-tight text-text-secondary">
          로그인 시{" "}
          <span className="underline underline-offset-2 cursor-pointer">이용약관</span>
          {" "}및{" "}
          <span className="underline underline-offset-2 cursor-pointer">개인정보 처리방침</span>에
          동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}
