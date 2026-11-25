import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/http";
import { boardNotFound, createNepickClient, findActiveBoard, getViewerId, loadFailed } from "../../../_lib/server";

/** 가게 카드를 펼쳤을 때 그 가게의 글 전체. 비로그인도 볼 수 있다 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const rateLimited = checkRateLimit(req, "nepick-posts", { limit: 120, windowMs: 60_000 });
  if (rateLimited) return rateLimited;

  const boardStoreId = Number(req.nextUrl.searchParams.get("boardStoreId"));
  if (!Number.isSafeInteger(boardStoreId) || boardStoreId <= 0) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  try {
    const { slug } = await params;
    const client = createNepickClient();
    const board = await findActiveBoard(client, slug);
    if (!board) return boardNotFound();

    const { data, error } = await client.rpc("nepick_list_posts", {
      p_board_id: board.id,
      p_viewer_id: await getViewerId(),
      p_board_store_id: boardStoreId,
    });
    if (error) throw error;

    return NextResponse.json({ posts: data ?? [] });
  } catch (error) {
    return loadFailed("posts", error);
  }
}
