"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserIcon } from "@/components/ui/icons";
import { openLoginPrompt } from "@/features/auth/login-prompt-events";

export default function DesktopTopBar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setIsAuthenticated(!!session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleHomeNavigation = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (!pathname.startsWith("/home")) return;
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("nepick:home-reset"));
  }, [pathname]);

  const handleRecord = useCallback(async (event: MouseEvent<HTMLAnchorElement>) => {
    if (isAuthenticated) return;
    event.preventDefault();
    openLoginPrompt("/record");
  }, [isAuthenticated]);

  const handleLogin = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    openLoginPrompt("/home");
  }, []);

  const homeActive = pathname.startsWith("/home");
  const myPickActive = pathname.startsWith("/mypick");

  return (
    <header className="desktop-top-bar hidden h-16 shrink-0 items-center gap-[22px] border-b border-divider bg-surface px-6 md:flex">
      <Link href="/home" className="flex h-11 shrink-0 items-center" aria-label="네픽 홈">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/nepick-logo-badge.svg" alt="" className="h-9 w-9" aria-hidden="true" />
      </Link>

      <nav className="ml-1 flex h-full items-center gap-0.5" aria-label="주요 메뉴">
        <Link
          href="/home"
          onClick={handleHomeNavigation}
          className={`flex h-full shrink-0 items-center whitespace-nowrap px-4 text-[15px] transition-colors ${homeActive ? "font-[800] text-primary" : "font-semibold text-text-secondary hover:text-text-primary"}`}
        >
          홈
        </Link>
        <Link
          href="/mypick"
          className={`flex h-full shrink-0 items-center whitespace-nowrap px-4 text-[15px] transition-colors ${myPickActive ? "font-[800] text-primary" : "font-semibold text-text-secondary hover:text-text-primary"}`}
        >
          내 픽
        </Link>
      </nav>

      <div className="pointer-events-none mx-auto h-11 w-full max-w-[440px]" aria-hidden="true" />

      <div className="flex shrink-0 items-center gap-3">
        <Link
          href="/record"
          onClick={(event) => void handleRecord(event)}
          className="flex h-11 items-center gap-[7px] rounded-xl bg-primary pl-[15px] pr-[18px] text-[14.5px] font-bold text-white shadow-[0_4px_12px_rgba(211,47,47,0.28)] transition-colors hover:bg-primary-dark"
        >
          <span className="text-[19px] font-medium leading-none">＋</span>
          기록하기
        </Link>

        {isAuthenticated ? (
          <Link
            href="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft"
            aria-label="프로필"
          >
            <UserIcon size={20} color="var(--color-primary)" />
          </Link>
        ) : (
          <Link
            href="/auth/login"
            onClick={handleLogin}
            className="flex h-11 items-center rounded-xl border-[1.5px] border-border px-[18px] text-[14.5px] font-bold text-text-body"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
