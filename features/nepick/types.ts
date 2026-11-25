import type { NepickBoardStoreItem, NepickBoardSummary, NepickPostItem } from "@/types/database";

export interface NepickBoardListItem extends NepickBoardSummary {
  /** 로그인한 사용자가 이 게시판에서 한 곳을 골랐는지 */
  is_picked: boolean;
}

/** GET /api/nepick/boards/[slug] 응답 */
export interface NepickBoardDetail {
  board: { id: number; slug: string; food_name: string };
  isAuthenticated: boolean;
  stores: NepickBoardStoreItem[];
  /** 가게마다 앞의 글 2개 */
  posts: NepickPostItem[];
}
