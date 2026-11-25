"use client";

import Link from "next/link";
import { fetchNepickBoards } from "./api";
import LoadState from "./load-state";
import PickerBadge from "./picker-badge";
import type { NepickBoardListItem } from "./types";
import { useNepickResource } from "./use-nepick-resource";

export default function BoardList() {
  const { data: boards, error, reload } = useNepickResource(fetchNepickBoards);

  if (!boards) {
    return <LoadState message={error?.message} onRetry={() => void reload()} />;
  }

  if (boards.length === 0) {
    return (
      <p className="px-6 py-20 text-center text-[14px] text-text-secondary">
        아직 열린 게시판이 없어요.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {boards.map((board) => (
        <li key={board.board_id}>
          <BoardListCard board={board} />
        </li>
      ))}
    </ul>
  );
}

function BoardListCard({ board }: { board: NepickBoardListItem }) {
  return (
    <Link
      href={`/nepick/${board.slug}`}
      className="flex flex-col gap-2 rounded-[18px] border border-border bg-surface p-4 transition-colors hover:border-primary-border active:bg-bg-soft"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[18px] font-[800] text-text-primary">{board.food_name}</span>
        {board.is_picked && <PickerBadge />}
      </span>
      <span className="text-[14px] leading-snug text-text-body">
        당신의 최고의 {board.food_name} 맛집은 어디인가요?
      </span>
      {board.top_store_name ? (
        <span className="flex min-w-0 text-[13px] text-text-secondary">
          <span className="truncate">
            1위 <strong className="font-bold text-text-primary">{board.top_store_name}</strong>
          </span>
          <span className="shrink-0 whitespace-pre"> · 네픽지수 {board.top_nepick_index} · 참여 {board.pick_count}명</span>
        </span>
      ) : (
        <span className="text-[13px] text-text-secondary">아직 추천이 없어요</span>
      )}
    </Link>
  );
}
