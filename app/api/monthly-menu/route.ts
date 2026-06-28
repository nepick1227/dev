import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPreviousMonthWindow,
  type MonthlyMenuRecord,
} from "@/lib/monthly-menu";
import { checkRateLimit, readJsonBody } from "@/lib/security/http";
import { createSignedImageUrl } from "@/lib/supabase/storage";

const MAX_GENERATIONS = 2;
const IS_UNLIMITED_DEV = process.env.NODE_ENV === "development";

interface RecordRow {
  id: number;
  visited_at: string;
  comment: string;
  image_url: string | null;
  stores: { name: string } | { name: string }[] | null;
}

async function toMonthlyMenuRecords(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: RecordRow[]
): Promise<MonthlyMenuRecord[]> {
  const records = await Promise.all(rows.flatMap(async (row) => {
    const store = Array.isArray(row.stores) ? row.stores[0] : row.stores;
    if (!store || !row.image_url) return [];
    const imageUrl = await createSignedImageUrl(supabase, "record-images", row.image_url);
    if (!imageUrl) return [];
    return [{
      id: row.id,
      visitedAt: row.visited_at,
      comment: row.comment,
      imageUrl,
      storeName: store.name,
    }];
  }));

  return records.flat();
}

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(req: NextRequest) {
  const rateLimited = checkRateLimit(req, "monthly-menu-status", {
    limit: 120,
    windowMs: 60_000,
  });
  if (rateLimited) return rateLimited;

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const month = getPreviousMonthWindow();
  const [{ data: recordRows, error: recordsError }, { data: usage }] = await Promise.all([
    supabase
      .from("records")
      .select("id, visited_at, comment, image_url, stores(name)")
      .eq("user_id", user.id)
      .not("image_url", "is", null)
      .neq("image_url", "")
      .gte("visited_at", month.startIso)
      .lt("visited_at", month.endIso)
      .order("visited_at", { ascending: false }),
    supabase
      .from("monthly_menu_usage")
      .select("prompt_seen_at, generation_count")
      .eq("user_id", user.id)
      .eq("source_month", month.sourceMonth)
      .maybeSingle(),
  ]);

  if (recordsError) {
    return NextResponse.json({ error: "전월 기록을 불러오지 못했습니다." }, { status: 500 });
  }

  const records = await toMonthlyMenuRecords(supabase, (recordRows ?? []) as unknown as RecordRow[]);
  const generationCount = usage?.generation_count ?? 0;
  const afterFifth = month.currentDay >= 5;
  const hasEnoughRecords = records.length >= 3;
  const remainingGenerations = Math.max(MAX_GENERATIONS - generationCount, 0);
  const hasGenerationAccess = IS_UNLIMITED_DEV || remainingGenerations > 0;

  return NextResponse.json({
    sourceMonth: month.sourceMonth,
    monthLabel: month.monthLabel,
    title: `${month.monthLabel}의 메뉴판`,
    records,
    generationCount,
    remainingGenerations,
    isUnlimited: IS_UNLIMITED_DEV,
    canGenerate: afterFifth && hasEnoughRecords && hasGenerationAccess,
    shouldAutoOpen:
      afterFifth &&
      hasEnoughRecords &&
      hasGenerationAccess &&
      !usage?.prompt_seen_at,
  });
}

export async function PATCH(req: NextRequest) {
  const rateLimited = checkRateLimit(req, "monthly-menu-seen", {
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimited) return rateLimited;

  const { supabase, user } = await getAuthenticatedContext();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: body, error: bodyError } = await readJsonBody<{ action?: string }>(req, 1024);
  if (bodyError) return bodyError;

  if (body?.action !== "seen") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const month = getPreviousMonthWindow();
  const { error } = await supabase.rpc("mark_monthly_menu_prompt_seen", {
    p_source_month: month.sourceMonth,
  });

  if (error) {
    return NextResponse.json({ error: "노출 상태를 저장하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
