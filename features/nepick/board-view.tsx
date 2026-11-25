"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import type { NepickPostItem } from "@/types/database";
import { fetchNepickBoard } from "./api";
import BoardStoreCard from "./board-store-card";
import LoadState from "./load-state";
import { useNepickResource } from "./use-nepick-resource";

interface BoardViewProps {
  slug: string;
}

/** 게시판 페이지. 글 읽기부터 추천까지 모두 이 한 페이지에서 한다 */
export default function BoardView({ slug }: BoardViewProps) {
  const router = useRouter();
  const load = useCallback(() => fetchNepickBoard(slug), [slug]);
  const { data, error, reload } = useNepickResource(load);

  const postsByStore = useMemo(() => {
    const grouped = new Map<number, NepickPostItem[]>();
    for (const post of data?.posts ?? []) {
      const list = grouped.get(post.board_store_id);
      if (list) list.push(post);
      else grouped.set(post.board_store_id, [post]);
    }
    return grouped;
  }, [data]);

  const foodName = data?.board.food_name;
  const myPick = data?.stores.find((store) => store.is_my_pick);

  return (
    <>
      <Header title={foodName ?? "네 픽"} showBack onBack={() => router.push("/nepick")} />
      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto bg-bg">
        {!data ? (
          <LoadState
            message={error?.message}
            onRetry={error && error.status !== 404 ? () => void reload() : undefined}
          />
        ) : (
          <div className="app-content-readable flex flex-col gap-3 px-4 pb-6 pt-4 md:px-6">
            <div className="px-1 pb-1">
              <p className="text-[20px] font-[800] leading-snug tracking-[-0.5px] text-text-primary">
                당신의 최고의 {foodName} 맛집은 어디인가요?
              </p>
              {myPick && (
                <p className="mt-1.5 text-[13px] text-text-body">
                  내 추천 <strong className="font-bold">{myPick.name}</strong>
                </p>
              )}
            </div>

            {data.stores.length === 0 ? (
              <p className="rounded-[18px] border border-border bg-surface px-6 py-14 text-center text-[14px] text-text-secondary">
                아직 추천된 가게가 없어요
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {data.stores.map((store, index) => (
                  <li key={store.board_store_id}>
                    <BoardStoreCard
                      slug={slug}
                      rank={index + 1}
                      store={store}
                      previewPosts={postsByStore.get(store.board_store_id) ?? []}
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </>
  );
}
