import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/http";
import type { NepickBoardSummary } from "@/types/database";
import { createNepickClient, getViewerId, loadFailed } from "../_lib/server";

/** 게시판 목록. 비로그인도 볼 수 있다 */
export async function GET(req: NextRequest) {
  const rateLimited = checkRateLimit(req, "nepick-boards", { limit: 120, windowMs: 60_000 });
  if (rateLimited) return rateLimited;

  try {
    const client = createNepickClient();
    const viewerId = await getViewerId();
    const [boardsRes, picksRes] = await Promise.all([
      client.rpc("nepick_list_boards"),
      viewerId
        // 운영자 숨김으로 무효가 된 추천은 [추천완료]로 보지 않는다
        ? client.from("nepick_active_picks").select("board_id").eq("user_id", viewerId)
        : Promise.resolve({ data: [] as { board_id: number }[], error: null }),
    ]);
    if (boardsRes.error) throw boardsRes.error;
    if (picksRes.error) throw picksRes.error;

    const pickedBoardIds = new Set((picksRes.data ?? []).map((pick) => pick.board_id));
    const boards = ((boardsRes.data ?? []) as NepickBoardSummary[]).map((board) => ({
      ...board,
      is_picked: pickedBoardIds.has(board.board_id),
    }));

    return NextResponse.json({ boards });
  } catch (error) {
    return loadFailed("boards", error);
  }
}
