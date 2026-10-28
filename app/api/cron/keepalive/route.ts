import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase 무료 플랜 비활성 일시정지 방지용 keepalive
 * Vercel Cron(vercel.json)이 하루 1회 호출 → stores에 가벼운 조회를 보내 활동으로 기록
 * Vercel이 보내는 Authorization: Bearer ${CRON_SECRET} 헤더로만 실행 허용
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await supabase.from("stores").select("id").limit(1);

  if (error) {
    console.error("[Cron] keepalive_failed", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
