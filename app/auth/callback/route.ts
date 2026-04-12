import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  // 프로필 존재 여부 확인 → 신규 유저면 약관 동의로
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nickname, deleted_at")
    .eq("id", data.user.id)
    .maybeSingle();

  // 탈퇴한 계정 확인 — 30일 이내면 재가입 차단
  if (profile?.deleted_at) {
    const deletedAt = new Date(profile.deleted_at);
    const daysSince = (Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/auth/login?error=account_deleted`);
    }
  }

  if (!profile || !profile.nickname) {
    // 신규 유저 또는 프로필 미완성 → 약관 동의 페이지로
    return NextResponse.redirect(`${origin}/auth/terms`);
  }

  // 기존 유저 → 홈으로
  return NextResponse.redirect(`${origin}${next}`);
}
