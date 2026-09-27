"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pushGtmEvent } from "@/lib/analytics/gtm";
import Spinner from "@/components/ui/Spinner";
import { LOGIN_PROMPT_EVENT, type LoginPromptDetail } from "./login-prompt-events";

type OAuthProvider = "kakao" | "google";

export default function LoginPromptHost() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/home");
  const [isOpen, setIsOpen] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    if (loadingProvider) return;
    setIsOpen(false);
    setError(null);
  }, [loadingProvider]);

  const handleBrowse = useCallback(() => {
    if (loadingProvider) return;
    setIsOpen(false);
    setError(null);
    window.dispatchEvent(new CustomEvent("nepick:home-panel", { detail: "ranking" }));
    window.dispatchEvent(new Event("nepick:home-reset"));
    router.push("/home");
  }, [loadingProvider, router]);

  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<LoginPromptDetail>).detail;
      setNextPath(detail?.nextPath || "/home");
      setLoadingProvider(null);
      setError(null);
      setIsOpen(true);
    };
    window.addEventListener(LOGIN_PROMPT_EVENT, open);
    return () => window.removeEventListener(LOGIN_PROMPT_EVENT, open);
  }, []);

  useEffect(() => {
    const resetPendingLogin = () => {
      setLoadingProvider(null);
    };

    window.addEventListener("pageshow", resetPendingLogin);
    return () => window.removeEventListener("pageshow", resetPendingLogin);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  const handleOAuthLogin = useCallback(async (provider: OAuthProvider) => {
    setLoadingProvider(provider);
    setError(null);
    pushGtmEvent("login_click", { provider });

    try {
      localStorage.setItem("nepick_last_provider", provider);
    } catch {
      // localStorage를 사용할 수 없는 환경에서는 최근 로그인 기록을 생략합니다.
    }

    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", nextPath);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo.toString() },
    });

    if (oauthError) {
      setError("로그인을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      setLoadingProvider(null);
    }
  }, [nextPath]);

  const handleNaverLogin = useCallback(() => {
    setLoadingProvider("naver");
    setError(null);
    pushGtmEvent("login_click", { provider: "naver" });
    try {
      localStorage.setItem("nepick_last_provider", "naver");
    } catch {
      // localStorage를 사용할 수 없는 환경에서는 최근 로그인 기록을 생략합니다.
    }
    const url = new URL("/api/auth/naver", window.location.origin);
    url.searchParams.set("next", nextPath);
    window.location.href = url.toString();
  }, [nextPath]);

  if (!isOpen) return null;

  const isLoading = loadingProvider !== null;
  const title = nextPath.startsWith("/record")
    ? "기록하려면 로그인이 필요해요"
    : "내 맛집 기록을 시작해요";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[rgba(20,20,24,0.4)] md:items-center md:bg-[rgba(20,20,24,0.45)]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        className="w-full rounded-t-[26px] bg-surface px-6 pb-[calc(40px+env(safe-area-inset-bottom))] pt-3 md:w-[400px] md:rounded-[22px] md:p-9"
      >
        <div className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-border md:hidden" />
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/nepick-logo-transparent.png" alt="네픽" className="h-16 w-16 object-contain" />
        </div>
        <h2 id="login-prompt-title" className="mt-5 text-left text-[21px] font-[800] tracking-[-0.4px] text-text-primary">
          {title}
        </h2>
        <p className="mt-2 text-left text-[14px] leading-[1.55] text-text-description">
          3초 만에 로그인하고 나만의 맛집 지도를 만들어보세요.
        </p>
        {error && <p className="mt-3 text-left text-[13px] text-primary">{error}</p>}

        <div className="mt-[26px] flex flex-col gap-[11px]">
          <button type="button" disabled={isLoading} onClick={() => handleOAuthLogin("kakao")} className="flex h-[54px] items-center justify-center gap-[9px] rounded-[14px] bg-[#FEE500] text-[16px] font-bold text-[#191600] disabled:opacity-60 md:h-[52px] md:rounded-[13px] md:text-[15.5px]">
            {loadingProvider === "kakao" ? <Spinner color="#191919" size={20} /> : <><svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M11 3C6.03 3 2 6.13 2 9.96c0 2.39 1.56 4.5 3.93 5.74l-1 3.63c-.08.3.26.54.52.37l4.34-2.88c.39.04.79.06 1.21.06 4.97 0 9-3.13 9-6.96C20 6.13 15.97 3 11 3z" fill="#191919" /></svg>카카오로 시작하기</>}
          </button>
          <button type="button" disabled={isLoading} onClick={handleNaverLogin} className="flex h-[54px] items-center justify-center gap-[9px] rounded-[14px] bg-[#03C75A] text-[16px] font-bold text-white disabled:opacity-60 md:h-[52px] md:rounded-[13px] md:text-[15.5px]">
            {loadingProvider === "naver" ? <Spinner color="#fff" size={20} /> : <><span className="text-[18px] font-black">N</span>네이버로 시작하기</>}
          </button>
          <button type="button" disabled={isLoading} onClick={() => handleOAuthLogin("google")} className="flex h-[54px] items-center justify-center gap-[9px] rounded-[14px] border-[1.5px] border-border bg-surface text-[16px] font-bold text-text-body disabled:opacity-60 md:h-[52px] md:rounded-[13px] md:text-[15.5px]">
            {loadingProvider === "google" ? <Spinner size={20} /> : <><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>구글로 시작하기</>}
          </button>
        </div>

        <button type="button" disabled={isLoading} onClick={handleBrowse} className="mt-[18px] w-full text-center text-[14px] text-text-tertiary disabled:opacity-60 md:mt-4">
          먼저 둘러볼게요
        </button>
      </section>
    </div>
  );
}
