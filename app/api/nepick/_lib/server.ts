import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NEPICK_SLUG_PATTERN } from "@/lib/nepick";

/**
 * 네 픽 테이블과 함수는 service_role만 쓸 수 있다. app/api/nepick 라우트 안에서만 사용한다.
 * 사용자 id는 반드시 getViewerId()로 확인한 값만 함수에 넘긴다 (요청 본문의 값을 넘기지 않는다).
 */
export function createNepickClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("nepick_config_missing");

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type NepickClient = ReturnType<typeof createNepickClient>;

/** Supabase 인증 서버로 확인한 로그인 사용자 id. 비로그인이면 null */
export async function getViewerId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** 주소의 slug로 열려 있는 게시판을 찾는다. 없으면 null */
export async function findActiveBoard(client: NepickClient, slug: string) {
  if (!NEPICK_SLUG_PATTERN.test(slug)) return null;

  const { data, error } = await client
    .from("nepick_boards")
    .select("id, slug, food_name")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data as { id: number; slug: string; food_name: string } | null;
}

export function boardNotFound() {
  return NextResponse.json({ error: "게시판을 찾을 수 없어요." }, { status: 404 });
}

/** DB 오류 원문은 서버 로그에만 남기고 화면에는 안내 문구만 보낸다 */
export function loadFailed(scope: string, error: unknown) {
  const message = error instanceof Error
    ? error.message
    : error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "unknown_error";
  console.error(`[Nepick:${scope}]`, message);
  return NextResponse.json(
    { error: "네 픽을 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
    { status: 500 }
  );
}
