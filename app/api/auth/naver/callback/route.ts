import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * 네이버 OAuth 콜백 처리
 * 1. 네이버에서 받은 code로 액세스 토큰 발급
 * 2. 네이버 유저 정보 조회 (이메일, 닉네임, 프로필 사진)
 * 3. Supabase에 유저 생성 또는 확인
 * 4. 로그인 세션 생성 후 리다이렉트
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // CSRF 검증
  const cookieStore = await cookies();
  const savedState = cookieStore.get("naver_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  try {
    // ── 1. 액세스 토큰 발급 ──────────────────────────
    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        code,
        redirect_uri: `${origin}/api/auth/naver/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("액세스 토큰 발급 실패");

    // ── 2. 네이버 유저 정보 조회 ─────────────────────
    const userRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    console.log("[Naver Auth] 유저 데이터:", JSON.stringify(userData, null, 2));

    const naverUser = userData.response as {
      id: string;
      email?: string;
      nickname?: string;
      profile_image?: string;
    };

    if (!naverUser?.id) throw new Error("유저 정보 없음");

    // 이메일이 없을 경우 네이버 ID 기반으로 생성 (Supabase 계정 식별용)
    const email = naverUser.email ?? `naver.${naverUser.id}@auth.nepick.kr`;

    // ── 3. Supabase admin으로 유저 생성/확인 ─────────
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 신규 유저 생성 시도 (이미 있으면 오류 무시)
    await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        provider: "naver",
        naver_id: naverUser.id,
        full_name: naverUser.nickname,
        avatar_url: naverUser.profile_image,
      },
    });

    // ── 4. 매직링크로 세션 생성 ──────────────────────
    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${origin}/auth/callback` },
      });

    if (linkError || !linkData) throw linkError;

    // 매직링크로 리다이렉트 → Supabase가 세션 처리 → /auth/callback으로 이동
    const response = NextResponse.redirect(linkData.properties.action_link);

    // state 쿠키 삭제
    response.cookies.delete("naver_oauth_state");

    return response;
  } catch (error) {
    console.error("[Naver Auth]", error);
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }
}
