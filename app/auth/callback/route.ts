import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=login_failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/login?error=login_failed`);
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

  // 기존 유저 → 홈으로 (welcome 파라미터로 토스트 트리거)
  // next 파라미터 화이트리스트 검증 (오픈 리다이렉트 방지)
  const ALLOWED_PATHS = ["/home", "/mypick", "/profile", "/record"];
  const safePath = ALLOWED_PATHS.includes(next) ? next : "/home";
  const homeUrl = safePath === "/home" ? `${origin}/home?welcome=1` : `${origin}${safePath}`;
  return NextResponse.redirect(homeUrl);
}
