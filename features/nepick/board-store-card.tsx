"use client";

import { useCallback, useState } from "react";
import { NEPICK_PREVIEW_POST_COUNT } from "@/lib/nepick";
import { formatStoreArea } from "@/utils/format";
import type { NepickBoardStoreItem, NepickPostItem } from "@/types/database";
import { fetchNepickStorePosts, NepickApiError } from "./api";
import PostItem from "./post-item";

interface BoardStoreCardProps {
  slug: string;
  rank: number;
  store: NepickBoardStoreItem;
  /** 접었을 때 보여 주는 앞의 글 */
  previewPosts: NepickPostItem[];
}

/** 게시판 안 가게 한 곳. 카드를 펼치면 그 자리에서 글 전체를 보여 준다 */
export default function BoardStoreCard({ slug, rank, store, previewPosts }: BoardStoreCardProps) {
  const [allPosts, setAllPosts] = useState<NepickPostItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const expand = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setAllPosts(await fetchNepickStorePosts(slug, store.board_store_id));
    } catch (loadError) {
      setError(loadError instanceof NepickApiError ? loadError.message : "글을 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }, [slug, store.board_store_id]);

  const isExpanded = allPosts !== null;
  const posts = allPosts ?? previewPosts;
  const area = formatStoreArea(store.address);

  return (
    <article className="flex flex-col gap-3 rounded-[18px] border border-border bg-surface p-4">
      <div className="flex items-start gap-2.5">
        <span className={`min-w-[22px] shrink-0 text-[18px] font-[800] leading-[1.3] ${rank <= 3 ? "text-primary" : "text-text-tertiary"}`}>
          <span className="sr-only">순위 </span>
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="break-words text-[16px] font-[800] text-text-primary">{store.name}</h2>
            {store.is_my_pick && (
              <span className="shrink-0 rounded-full bg-primary-soft px-2 py-[3px] text-[11px] font-bold text-primary">
                내 추천
              </span>
            )}
          </div>
          <p className="mt-[3px] text-[13px] text-text-secondary">
            {area ? `${area} · 추천 ${store.up_count}` : `추천 ${store.up_count}`}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold ${
            store.nepick_index > 0 ? "bg-primary-soft text-primary" : "bg-rating-neutral-soft text-text-secondary"
          }`}
        >
          네픽지수 {store.nepick_index}
        </span>
      </div>

      {posts.length > 0 && (
        <ul className="border-t border-divider">
          {posts.map((post) => <PostItem key={post.post_id} post={post} />)}
        </ul>
      )}

      {error && <p className="text-[13px] text-primary" role="alert">{error}</p>}

      {isExpanded ? (
        <button
          type="button"
          onClick={() => setAllPosts(null)}
          aria-expanded="true"
          className="-mb-3 -mt-3 min-h-11 text-left text-[13px] font-bold text-text-secondary"
        >
          접기
        </button>
      ) : store.post_count > NEPICK_PREVIEW_POST_COUNT && (
        <button
          type="button"
          onClick={() => void expand()}
          disabled={isLoading}
          aria-expanded="false"
          className="-mb-3 -mt-3 min-h-11 text-left text-[13px] font-bold text-text-body disabled:text-disabled-text"
        >
          {isLoading ? "불러오는 중…" : `댓글 ${store.post_count}개 모두 보기`}
        </button>
      )}
    </article>
  );
}
