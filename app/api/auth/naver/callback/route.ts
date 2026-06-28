import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/http";

interface ExistingAuthUser {
  email?: string;
  user_metadata?: {
    provider?: string;
    naver_id?: string;
  };
}

interface AdminListUsersClient {
  auth: {
    admin: {
      listUsers: (params: {
        page: number;
        perPage: number;
      }) => Promise<{
        data: { users: ExistingAuthUser[] };
        error: Error | null;
      }>;
    };
  };
}

function isDuplicateEmailError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error && typeof error.message === "string"
    ? error.message.toLowerCase()
    : "";
  const status = "status" in error && typeof error.status === "number"
    ? error.status
    : 0;

  return status === 422 || message.includes("already") || message.includes("registered");
}

async function findAuthUserByEmail(
  adminClient: AdminListUsersClient,
  email: string
): Promise<ExistingAuthUser | null> {
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) throw error;

    const user = data.users.find((candidate) =>
      candidate.email?.toLowerCase() === normalizedEmail
    );
    if (user) return user as ExistingAuthUser;
    if (data.users.length < 100) return null;
  }

  return null;
}

function isSameNaverUser(user: ExistingAuthUser | null, naverId: string) {
  return (
    user?.user_metadata?.provider === "naver" &&
    user.user_metadata.naver_id === naverId
  );
}

function redirectWithClearedState(url: string) {
  const response = NextResponse.redirect(url);
  response.cookies.delete("naver_oauth_state");
  return response;
}

/**
 * 네이버 OAuth 콜백 처리
 * 1. 네이버에서 받은 code로 액세스 토큰 발급
 * 2. 네이버 유저 정보 조회 (이메일, 닉네임, 프로필 사진)
 * 3. Supabase에 유저 생성 또는 확인
 * 4. 로그인 세션 생성 후 리다이렉트
 */
export async function GET(request: NextRequest) {
  const rateLimited = checkRateLimit(request, "naver-auth-callback", {
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimited) return rateLimited;

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // CSRF 검증
  const cookieStore = await cookies();
  const savedState = cookieStore.get("naver_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${origin}/auth/error`);
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
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 신규 유저 생성. 같은 이메일이 이미 있으면 네이버 재로그인인지 확인한다.
    const { error: createError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        provider: "naver",
        naver_id: naverUser.id,
        full_name: naverUser.nickname,
        avatar_url: naverUser.profile_image,
      },
    });

    if (createError) {
      if (!isDuplicateEmailError(createError)) throw createError;

      const existingUser = await findAuthUserByEmail(
        adminClient as unknown as AdminListUsersClient,
        email
      );
      if (!isSameNaverUser(existingUser, naverUser.id)) {
        return redirectWithClearedState(`${origin}/auth/login?error=provider_conflict`);
      }
    }

    // ── 4. 매직링크 토큰 발급 후 서버에서 바로 세션 처리 ──
    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData) throw linkError;

    const tokenHash = linkData.properties.hashed_token;
    const supabase = await createServerSupabaseClient();
    const { data: verified, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });

    if (verifyError || !verified.user) throw verifyError;

    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname, deleted_at")
      .eq("id", verified.user.id)
      .maybeSingle();

    if (profile?.deleted_at) {
      const daysSince =
        (Date.now() - new Date(profile.deleted_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        await supabase.auth.signOut();
        return redirectWithClearedState(`${origin}/auth/login?error=account_deleted`);
      }
    }

    const response = NextResponse.redirect(
      `${origin}${profile?.nickname ? "/home" : "/auth/terms"}`
    );

    response.cookies.delete("naver_oauth_state");
    return response;
  } catch (error) {
    console.error("[Naver Auth]", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.redirect(`${origin}/auth/error`);
  }
}
