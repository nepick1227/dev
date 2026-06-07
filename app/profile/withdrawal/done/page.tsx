"use client";

import { useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function WithdrawalDonePage() {
  useEffect(() => {
    // 탈퇴 완료 페이지 진입 시 로그아웃 처리
    createClient().auth.signOut();
  }, []);

  return (
    <div className="page-container items-center justify-center gap-4 px-6 text-center">
      {/* 완료 아이콘 */}
      <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12L10 17L19 8"
            stroke="var(--color-success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="text-[20px] font-bold tracking-tight text-text-primary">
        탈퇴가 완료되었어요
      </h1>
      <p className="text-[14px] leading-relaxed tracking-tight text-text-secondary">
        그동안 네픽을 이용해 주셔서 감사합니다.
      </p>

      <Link
        href="/auth/login"
        className="mt-2 rounded-xl bg-primary px-10 py-3.5 text-[15px] font-bold text-white"
      >
        메인화면으로
      </Link>
    </div>
  );
}
