import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/http";
import { createNepickClient, loadFailed } from "../../../_lib/server";

/** 홈 가게 카드의 음식 뱃지. 네픽지수가 1 이상인 게시판만 내려 준다. 비로그인도 볼 수 있다 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const rateLimited = checkRateLimit(req, "nepick-badges", { limit: 120, windowMs: 60_000 });
  if (rateLimited) return rateLimited;

  const storeId = Number((await params).storeId);
  if (!Number.isSafeInteger(storeId) || storeId <= 0) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  try {
    const { data, error } = await createNepickClient().rpc("nepick_list_store_badges", { p_store_id: storeId });
    if (error) throw error;
    return NextResponse.json({ badges: data ?? [] });
  } catch (error) {
    return loadFailed("badges", error);
  }
}
