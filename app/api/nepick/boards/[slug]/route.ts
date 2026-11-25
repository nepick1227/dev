import { NextRequest, NextResponse } from "next/server";
import { NEPICK_PREVIEW_POST_COUNT } from "@/lib/nepick";
import { checkRateLimit } from "@/lib/security/http";
import { boardNotFound, createNepickClient, findActiveBoard, getViewerId, loadFailed } from "../../_lib/server";

/** 게시판 한 개: 가게 순위와 가게마다 앞의 글 2개. 비로그인도 볼 수 있다 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const rateLimited = checkRateLimit(req, "nepick-board", { limit: 120, windowMs: 60_000 });
  if (rateLimited) return rateLimited;

  try {
    const { slug } = await params;
    const client = createNepickClient();
    const board = await findActiveBoard(client, slug);
    if (!board) return boardNotFound();

    const viewerId = await getViewerId();
    const [storesRes, postsRes] = await Promise.all([
      client.rpc("nepick_list_board_stores", { p_board_id: board.id, p_viewer_id: viewerId }),
      client.rpc("nepick_list_posts", {
        p_board_id: board.id,
        p_viewer_id: viewerId,
        p_per_store: NEPICK_PREVIEW_POST_COUNT,
      }),
    ]);
    if (storesRes.error) throw storesRes.error;
    if (postsRes.error) throw postsRes.error;

    return NextResponse.json({
      board,
      isAuthenticated: viewerId !== null,
      stores: storesRes.data ?? [],
      posts: postsRes.data ?? [],
    });
  } catch (error) {
    return loadFailed("board", error);
  }
}
