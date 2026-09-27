"use client";

import { useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PageContainer from "@/components/layout/PageContainer";

export default function WithdrawalDonePage() {
  useEffect(() => {
    // 탈퇴 완료 페이지 진입 시 로그아웃 처리
    createClient().auth.signOut();
  }, []);

  return (
    <PageContainer className="settings-page">
      <div className="flex flex-1 overflow-y-auto bg-surface md:bg-bg">
        <div className="mx-auto flex w-full max-w-[480px] flex-col items-center justify-center px-6 py-14 text-center">
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-bg-soft text-[26px] text-success md:h-16 md:w-16 md:text-[28px]">
            ✓
          </div>
          <h1 className="mt-5 text-[18px] font-[800] text-text-primary md:text-[19px]">
            탈퇴가 완료되었어요
          </h1>
          <p className="mt-2 text-[13.5px] text-text-description md:text-[14px]">
            그동안 네픽을 이용해 주셔서 감사합니다.
          </p>
          <Link
            href="/auth/login"
            className="mt-[26px] flex h-[50px] items-center rounded-[13px] bg-primary px-8 text-[15px] font-bold text-white"
          >
            로그인 화면으로
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
