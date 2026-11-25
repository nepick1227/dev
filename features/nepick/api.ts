import type { NepickPostItem } from "@/types/database";
import type { NepickBoardDetail, NepickBoardListItem } from "./types";

const DEFAULT_ERROR = "네 픽을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";

export class NepickApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function requestJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { cache: "no-store" });
  } catch {
    throw new NepickApiError("네트워크 연결을 확인하고 다시 시도해 주세요.", 0);
  }

  const data = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok || !data) {
    throw new NepickApiError(data?.error ?? DEFAULT_ERROR, response.status);
  }
  return data;
}

export async function fetchNepickBoards() {
  const { boards } = await requestJson<{ boards: NepickBoardListItem[] }>("/api/nepick/boards");
  return boards;
}

export function fetchNepickBoard(slug: string) {
  return requestJson<NepickBoardDetail>(`/api/nepick/boards/${encodeURIComponent(slug)}`);
}

export async function fetchNepickStorePosts(slug: string, boardStoreId: number) {
  const { posts } = await requestJson<{ posts: NepickPostItem[] }>(
    `/api/nepick/boards/${encodeURIComponent(slug)}/posts?boardStoreId=${boardStoreId}`
  );
  return posts;
}
