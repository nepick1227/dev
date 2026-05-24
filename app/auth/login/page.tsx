"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/ui/Spinner";
import { NepickLogo } from "@/components/ui/icons";
import { getCurrentPosition } from "@/lib/kakao/map";

const LAST_PROVIDER_KEY = "nepick_last_provider";

function getLastProvider(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_PROVIDER_KEY);
  } catch {
    return null;
  }
}

function setLastProvider(provider: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_PROVIDER_KEY, provider);
  } catch {
    // 프라이빗 브라우징 등 localStorage 비활성화 환경에서 무시
  }
}

// ── 배경 SVG (v4 — 코랄 블롭+지도선 스타일, 활성) ──────
function LoginBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bg" x1="195" y1="0" x2="195" y2="844" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FCFCFC"/>
          <stop offset="1" stopColor="#F8F8F9"/>
        </linearGradient>
        <radialGradient id="coralBlobTop" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(72 112) rotate(45) scale(230 190)">
          <stop offset="0" stopColor="#F26B6B" stopOpacity="0.22"/>
          <stop offset="0.45" stopColor="#F7A2A2" stopOpacity="0.12"/>
          <stop offset="1" stopColor="#FFE6E6" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="coralBlobBottom" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(322 700) rotate(45) scale(250 210)">
          <stop offset="0" stopColor="#D32F2F" stopOpacity="0.16"/>
          <stop offset="0.5" stopColor="#FF9F9F" stopOpacity="0.10"/>
          <stop offset="1" stopColor="#FFE8E8" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="centerClear" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(195 350) rotate(90) scale(180 145)">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.98"/>
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="buttonClear" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(195 650) rotate(90) scale(220 150)">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.92"/>
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0"/>
        </radialGradient>
        <g id="pinSmall">
          <path d="M12 0C18.6274 0 24 5.29915 24 11.8333C24 18.6162 19.7245 24.2995 14.9579 30.1006C13.8956 31.394 12.8495 32.6164 12 33.6667C11.1505 32.6164 10.1044 31.394 9.04214 30.1006C4.27547 24.2995 0 18.6162 0 11.8333C0 5.29915 5.37258 0 12 0Z" fill="#F9DADA"/>
          <circle cx="12" cy="11.8" r="5.2" fill="#FCFCFC"/>
        </g>
      </defs>

      <rect width="390" height="844" fill="url(#bg)"/>
      <rect width="390" height="844" fill="url(#coralBlobTop)"/>
      <rect width="390" height="844" fill="url(#coralBlobBottom)"/>

      <g opacity="0.34" stroke="#EEF0F2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-12 88L92 44L216 76L404 22" strokeWidth="1.2"/>
        <path d="M-8 160L88 120L210 150L402 98" strokeWidth="1.2"/>
        <path d="M-14 242L102 192L224 232L404 178" strokeWidth="1.2"/>
        <path d="M-10 336L104 282L236 326L404 266" strokeWidth="1.2"/>
        <path d="M-10 448L116 394L244 434L404 372" strokeWidth="1.2"/>
        <path d="M-8 562L106 516L238 554L404 496" strokeWidth="1.2"/>
        <path d="M-8 672L118 620L246 658L402 600" strokeWidth="1.2"/>
        <path d="M40 -12L74 138L58 282L92 462L78 856" strokeWidth="1.2"/>
        <path d="M106 -12L134 126L124 272L152 454L140 856" strokeWidth="1.2"/>
        <path d="M178 -12L204 118L196 264L226 448L214 856" strokeWidth="1.2"/>
        <path d="M252 -12L278 130L270 274L300 456L286 856" strokeWidth="1.2"/>
        <path d="M328 -12L354 120L346 270L374 452L362 856" strokeWidth="1.2"/>
      </g>

      <g opacity="0.23" stroke="#F1F2F4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 132C58 112 110 126 150 104C194 80 228 50 278 54C324 58 356 82 402 104" strokeWidth="1"/>
        <path d="M-8 378C44 356 98 372 142 344C186 316 218 282 270 286C320 290 360 320 402 340" strokeWidth="1"/>
        <path d="M8 730C64 704 120 700 166 672C210 644 246 606 294 612C334 616 368 634 402 654" strokeWidth="1"/>
        <path d="M292 -8C270 74 242 140 234 220C226 304 236 382 262 468C282 536 292 612 286 856" strokeWidth="1.1"/>
        <path d="M80 40C60 118 34 198 28 278C24 350 36 438 60 526C76 590 88 674 82 856" strokeWidth="1"/>
      </g>

      <g opacity="0.18" stroke="#F3F4F6" strokeWidth="1">
        <rect x="62" y="110" width="42" height="28" rx="4" transform="rotate(-18 62 110)"/>
        <rect x="118" y="92" width="48" height="32" rx="4" transform="rotate(-18 118 92)"/>
        <rect x="188" y="86" width="44" height="30" rx="4" transform="rotate(-18 188 86)"/>
        <rect x="270" y="108" width="46" height="32" rx="4" transform="rotate(-18 270 108)"/>
        <rect x="52" y="228" width="40" height="28" rx="4" transform="rotate(-18 52 228)"/>
        <rect x="122" y="204" width="50" height="32" rx="4" transform="rotate(-18 122 204)"/>
        <rect x="212" y="212" width="44" height="30" rx="4" transform="rotate(-18 212 212)"/>
        <rect x="292" y="230" width="44" height="32" rx="4" transform="rotate(-18 292 230)"/>
        <rect x="48" y="498" width="42" height="30" rx="4" transform="rotate(-18 48 498)"/>
        <rect x="110" y="520" width="52" height="34" rx="4" transform="rotate(-18 110 520)"/>
        <rect x="254" y="500" width="46" height="32" rx="4" transform="rotate(-18 254 500)"/>
        <rect x="308" y="548" width="42" height="28" rx="4" transform="rotate(-18 308 548)"/>
      </g>

      <g opacity="0.34" fill="#ECEEF1">
        <circle cx="74" cy="138" r="2.6"/>
        <circle cx="134" cy="126" r="2.6"/>
        <circle cx="204" cy="118" r="2.6"/>
        <circle cx="278" cy="130" r="2.6"/>
        <circle cx="354" cy="120" r="2.6"/>
        <circle cx="92" cy="282" r="2.6"/>
        <circle cx="152" cy="272" r="2.6"/>
        <circle cx="226" cy="264" r="2.6"/>
        <circle cx="300" cy="274" r="2.6"/>
        <circle cx="374" cy="270" r="2.6"/>
        <circle cx="60" cy="526" r="2.6"/>
        <circle cx="126" cy="540" r="2.6"/>
        <circle cx="262" cy="524" r="2.6"/>
        <circle cx="326" cy="562" r="2.6"/>
      </g>

      <ellipse cx="195" cy="350" rx="165" ry="140" fill="url(#centerClear)"/>
      <ellipse cx="195" cy="650" rx="178" ry="128" fill="url(#buttonClear)"/>

      <g opacity="0.38">
        <use href="#pinSmall" x="72" y="148"/>
        <use href="#pinSmall" x="290" y="188"/>
        <use href="#pinSmall" x="44" y="418"/>
        <use href="#pinSmall" x="320" y="498"/>
      </g>
    </svg>
  );
}

// ── 최근 로그인 뱃지 ─────────────────────────────────
function RecentBadge({ borderColor, textColor }: { borderColor: string; textColor: string }) {
  return (
    <div
      className="absolute -top-3 right-4 z-10 flex items-center gap-1 rounded-full border bg-white px-2.5 py-0.5 text-[11px] font-bold tracking-tight"
      style={{ borderColor, color: textColor }}
    >
      ✦ 최근 로그인
    </div>
  );
}

// ── 메인: 로그인 페이지 ─────────────────────────────
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [lastProvider, setLastProviderState] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const isLoading = loadingProvider !== null;

  useEffect(() => {
    setLastProviderState(getLastProvider());
    // 로그인 중 백그라운드에서 GPS 워밍업 → 홈 진입 시 캐시 활용
    getCurrentPosition();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/home");
    });
  }, [router]);

  // URL 에러 파라미터를 직접 메시지로 변환 (effect 불필요)
  const errorMessage =
    errorParam === "account_deleted"
      ? "탈퇴 후 30일 이내에는 동일 계정으로 재가입이 불가합니다."
      : errorParam === "login_failed"
      ? "로그인에 실패했습니다. 다시 시도해 주세요."
      : null;

  const handleOAuthLogin = useCallback(async (provider: "kakao" | "google") => {
    setLoadingProvider(provider);
    setLoginError(null);
    setLastProvider(provider);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      setLoginError("로그인을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      setLoadingProvider(null);
    }
  }, []);

  return (
    <div className="page-container">
      <LoginBackground />

      {/* 로고 & 타이틀 */}
      <div className="nepick-fade-in relative flex flex-1 flex-col items-center justify-center px-6">
        <div className="mb-5">
          <NepickLogo size={60} />
        </div>
        <h1 className="mb-2.5 text-[32px] font-extrabold tracking-[-1px]">
          <span className="text-primary">Ne</span>
          <span className="text-text-primary">Pick</span>
        </h1>
        <p className="mb-4 text-center text-[15px] tracking-tight text-text-primary">
          내가 직접 남기는 믿을 만한{" "}
          <span className="font-bold text-primary">맛집 기록</span>
        </p>
        <div className="h-0.5 w-8 rounded-full bg-primary" />
      </div>

      {/* 로그인 버튼 영역 */}
      <div className="nepick-fade-in safe-area-pb-lg relative flex flex-col gap-3 px-6 [animation-delay:150ms]">
        {/* 에러 메시지 */}
        {(errorMessage ?? loginError) && (
          <p className="mb-1 text-center text-[13px] text-primary">{errorMessage ?? loginError}</p>
        )}

        {/* 카카오 */}
        <div className={`relative ${lastProvider === "kakao" && !isLoading ? "mt-1" : ""}`}>
          {lastProvider === "kakao" && !isLoading && (
            <RecentBadge borderColor="#B8860B" textColor="#B8860B" />
          )}
          <button
            onClick={() => handleOAuthLogin("kakao")}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FEE500] py-4 text-[15px] font-semibold tracking-tight text-[#191919] transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="카카오로 시작하기"
          >
            {loadingProvider === "kakao" ? (
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

        {/* 네이버 */}
        <div className={`relative ${lastProvider === "naver" && !isLoading ? "mt-1" : ""}`}>
          {lastProvider === "naver" && !isLoading && (
            <RecentBadge borderColor="#03C75A" textColor="#03C75A" />
          )}
          <button
            onClick={() => {
              setLoadingProvider("naver");
              setLastProvider("naver");
              window.location.href = "/api/auth/naver";
            }}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#03C75A] py-4 text-[15px] font-semibold tracking-tight text-white transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="네이버로 시작하기"
          >
            {loadingProvider === "naver" ? (
              <Spinner color="#fff" size={20} />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M13.57 10.69L6.14 2H2v16h4.43V9.31L13.86 18H18V2h-4.43v8.69z" fill="white" />
                </svg>
                네이버로 시작하기
              </>
            )}
          </button>
        </div>

        {/* 구글 */}
        <div className={`relative ${lastProvider === "google" && !isLoading ? "mt-1" : ""}`}>
          {lastProvider === "google" && !isLoading && (
            <RecentBadge borderColor="#4285F4" textColor="#4285F4" />
          )}
          <button
            onClick={() => handleOAuthLogin("google")}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-border bg-white py-4 text-[15px] font-semibold tracking-tight text-text-primary transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="구글로 시작하기"
          >
            {loadingProvider === "google" ? (
              <Spinner size={20} />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                구글로 시작하기
              </>
            )}
          </button>
        </div>

        {/* 버전 */}
        <p className="pt-14 text-center text-[12px] text-text-tertiary">v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
