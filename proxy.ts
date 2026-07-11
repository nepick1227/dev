import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ASSET_PATHS = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/site.webmanifest",
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
  "/og-image.png",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ASSET_PATHS.has(pathname) || pathname.startsWith("/brand/")) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 쿠키 JWT를 로컬에서 읽음 — 네트워크 요청 없음
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // /auth/*, /api/auth/*, /api/kakao-search 경로는 항상 허용
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/kakao-search")
  ) {
    // 이미 로그인된 유저가 /auth/login 접근 시 홈으로
    if (pathname === "/auth/login" && user && !request.nextUrl.searchParams.has("error")) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return supabaseResponse;
  }

  // 비로그인 유저 → 로그인 페이지로
  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
