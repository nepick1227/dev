import { NextResponse } from "next/server";

/**
 * 네이버 OAuth 로그인 시작
 * 로그인 버튼 클릭 → 이 Route로 이동 → 네이버 로그인 페이지로 리다이렉트
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const state = crypto.randomUUID(); // CSRF 방지

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.NAVER_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/naver/callback`,
    state,
  });

  const response = NextResponse.redirect(
    `https://nid.naver.com/oauth2.0/authorize?${params}`
  );

  // state를 쿠키에 저장해서 콜백에서 검증
  response.cookies.set("naver_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10분
    path: "/",
  });

  return response;
}
