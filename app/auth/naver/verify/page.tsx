"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function NaverVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");

    if (!tokenHash) {
      router.replace("/auth/login?error=auth_failed");
      return;
    }

    const supabase = createClient();

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: "magiclink" })
      .then(async ({ data, error }) => {
        if (error || !data.user) {
          router.replace("/auth/login?error=auth_failed");
          return;
        }

        // 프로필 여부 확인 → 신규 유저면 약관으로, 기존 유저면 홈으로
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname, deleted_at")
          .eq("id", data.user.id)
          .maybeSingle();

        // 탈퇴한 계정 확인 — 30일 이내면 재가입 차단
        if (profile?.deleted_at) {
          const daysSince = (Date.now() - new Date(profile.deleted_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < 30) {
            await supabase.auth.signOut();
            router.replace("/auth/login?error=account_deleted");
            return;
          }
        }

        if (!profile?.nickname) {
          router.replace("/auth/terms");
        } else {
          router.replace("/home");
        }
      });
  }, [searchParams, router]);

  return (
    <div className="page-container items-center justify-center">
      <p className="text-sm text-text-secondary">로그인 처리 중...</p>
    </div>
  );
}

export default function NaverVerifyPage() {
  return (
    <Suspense>
      <NaverVerifyContent />
    </Suspense>
  );
}
