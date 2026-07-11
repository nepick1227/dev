"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import { NepickLogo } from "@/components/ui/icons";

export default function AuthErrorPage() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 뒤로가기 → 로그인 페이지로 강제 이동
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.location.replace("/auth/signout?error=auth_failed");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
      <div className="page-container items-center justify-center gap-5 font-sans">
        <NepickLogo size={80} />
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page-container font-sans">
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

      <div className="safe-area-pb-lg flex flex-col gap-3 px-6">
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-xl border border-border py-4 text-[15px] font-semibold tracking-tight text-text-primary transition-opacity active:opacity-60"
        >
          문의하기
        </a>
        <Button fullWidth onClick={handleRefresh}>
          새로고침 하기
        </Button>
      </div>
    </div>
  );
}
