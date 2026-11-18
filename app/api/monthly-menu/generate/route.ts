import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPreviousMonthWindow,
  MONTHLY_MENU_MAX_GENERATIONS,
  type MonthlyMenuClaimResult,
} from "@/lib/monthly-menu";
import { checkRateLimit, readJsonBody } from "@/lib/security/http";

const IS_UNLIMITED_DEV = process.env.NODE_ENV === "development";

interface GenerateBody {
  recordIds?: unknown;
}

/**
 * 월간 메뉴판 생성 1회 차감.
 * 이미지는 브라우저 canvas에서 그리고, 이 route는 고른 기록이 본인의 전월 사진 기록인지
 * 확인한 뒤 횟수만 차감한다. 브라우저는 콜라주를 다 그린 뒤에 호출하므로
 * 사진 불러오기나 그리기에 실패하면 차감 자체가 일어나지 않는다.
 */
export async function POST(req: NextRequest) {
  const rateLimited = checkRateLimit(req, "monthly-menu-generate", {
    limit: 6,
    windowMs: 60_000,
  });
  if (rateLimited) return rateLimited;

  const { data: body, error: bodyError } = await readJsonBody<GenerateBody>(req, 2 * 1024);
  if (bodyError) return bodyError;

  const rawRecordIds = Array.isArray(body?.recordIds) ? body.recordIds : [];
  const recordIds = Array.from(new Set(
    rawRecordIds.filter((id): id is number => Number.isSafeInteger(id) && id > 0)
  ));

  if (
    rawRecordIds.length !== recordIds.length ||
    recordIds.length < 2 ||
    recordIds.length > 3
  ) {
    return NextResponse.json({ error: "기록을 2~3개 선택해 주세요." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const month = getPreviousMonthWindow();
  if (month.currentDay < 5) {
    return NextResponse.json({ error: "월간 메뉴판은 매월 5일부터 만들 수 있습니다." }, { status: 400 });
  }

  const { data: recordRows, error: recordsError } = await supabase
    .from("records")
    .select("id")
    .eq("user_id", user.id)
    .in("id", recordIds)
    .not("image_url", "is", null)
    .neq("image_url", "")
    .gte("visited_at", month.startIso)
    .lt("visited_at", month.endIso);

  if (recordsError) {
    return NextResponse.json({ error: "선택한 기록을 확인하지 못했습니다." }, { status: 500 });
  }

  if ((recordRows ?? []).length !== recordIds.length) {
    return NextResponse.json({ error: "전월의 이미지 포함 기록만 선택할 수 있습니다." }, { status: 400 });
  }

  if (IS_UNLIMITED_DEV) {
    const result: MonthlyMenuClaimResult = {
      remainingGenerations: MONTHLY_MENU_MAX_GENERATIONS,
      isUnlimited: true,
    };
    return NextResponse.json(result);
  }

  const { data: generationCount, error: claimError } = await supabase.rpc(
    "claim_monthly_menu_generation",
    { p_source_month: month.sourceMonth }
  );

  if (claimError) {
    const isLimit = claimError.message.includes("monthly_menu_limit_reached");
    return NextResponse.json(
      {
        error: isLimit
          ? `이번 달 생성 횟수 ${MONTHLY_MENU_MAX_GENERATIONS}회를 모두 사용했습니다.`
          : "생성 횟수를 확인하지 못했습니다.",
      },
      { status: isLimit ? 429 : 500 }
    );
  }

  const result: MonthlyMenuClaimResult = {
    remainingGenerations: Math.max(MONTHLY_MENU_MAX_GENERATIONS - Number(generationCount), 0),
    isUnlimited: false,
  };
  return NextResponse.json(result);
}
