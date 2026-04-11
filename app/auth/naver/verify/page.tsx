"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * 네이버 로그인 세션 처리 페이지
 * token_hash를 받아 세션을 확립한 뒤 적절한 페이지로 이동
 */
export default function NaverVerifyPage() {
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
          .select("nickname")
          .eq("id", data.user.id)
          .maybeSingle();

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
