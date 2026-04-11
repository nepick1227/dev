"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatTime } from "@/utils/format";
import { CopyIcon, KakaoMapShareIcon, EditIcon, ChevronDownIcon } from "@/components/ui/icons";
import {
  recommendationColors,
  recommendationLabels,
  recommendationEmojis,
} from "@/styles/tokens";
import type { RecordWithStore } from "@/types/database";

interface RecordCardProps {
  record: RecordWithStore;
  isLast?: boolean;
  onShowToast?: (message: string) => void;
}

/**
 * 내 픽 타임라인용 기록 카드
 */
export default function RecordCard({
  record,
  isLast = false,
  onShowToast,
}: RecordCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const recColor = recommendationColors[record.recommendation];
  const recLabel = recommendationLabels[record.recommendation];
  const recEmoji = recommendationEmojis[record.recommendation];
  const address = record.stores.road_address || record.stores.address;
  const commentOverflow = record.comment.length > 60;

  const handleCopyAddress = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(address);
        onShowToast?.("주소가 복사되었어요");
      } catch {
        onShowToast?.("복사에 실패했습니다");
      }
    },
    [address, onShowToast]
  );

  const handleKakaoMap = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const query = encodeURIComponent(`${record.stores.name} ${address}`);
      window.open(`https://map.kakao.com/link/search/${query}`, "_blank");
    },
    [record.stores.name, address]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/record/${record.id}/edit`);
    },
    [record.id, router]
  );

  return (
    <div className="flex gap-0">
      {/* 타임라인 세로선 + 카테고리 아이콘 */}
      <div className="flex w-10 shrink-0 flex-col items-center">
        <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-white">
          <span className="text-[18px]">
            {record.stores.category === "cafe" ? "☕" : "🍽️"}
          </span>
        </div>
        {!isLast && <div className="-mt-px w-px flex-1 bg-border" />}
      </div>

      {/* 카드 내용 */}
      <div className={`flex-1 pl-3 ${isLast ? "pb-2" : "pb-6"}`}>
        {/* 가게명 + 추천 배지 + 수정 버튼 */}
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px] font-bold tracking-tight text-text-primary">
              {record.stores.name}
            </span>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-tight"
              style={{ color: recColor, background: `${recColor}1A` }}
            >
              {recEmoji} {recLabel}
            </span>
          </div>
          <button
            onClick={handleEdit}
            className="ml-2 shrink-0 p-1"
            aria-label="기록 수정"
          >
            <EditIcon size={15} color="#9CA3AF" />
          </button>
        </div>

        {/* 주소 + 복사 + 카카오맵 */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className="truncate text-[12px] tracking-tight text-text-secondary">
            {address.length > 24 ? address.slice(0, 24) + "…" : address}
          </span>
          <button
            onClick={handleCopyAddress}
            className="shrink-0 p-0.5"
            aria-label="주소 복사"
          >
            <CopyIcon />
          </button>
          <button
            onClick={handleKakaoMap}
            className="shrink-0 p-0.5"
            aria-label="카카오맵에서 보기"
          >
            <KakaoMapShareIcon />
          </button>
        </div>

        {/* 코멘트 + 이미지 */}
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <div
              className={`relative rounded-[10px] bg-bg px-3.5 py-2.5 text-[13px] leading-relaxed tracking-tight text-text-primary ${
                !expanded && commentOverflow ? "max-h-16 overflow-hidden" : ""
              } ${commentOverflow ? "pb-6" : ""}`}
            >
              {record.comment}
              {!expanded && commentOverflow && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-7 rounded-b-[10px] bg-linear-to-t from-bg to-transparent" />
              )}
              {commentOverflow && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                  className="absolute bottom-1.5 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-bg"
                  aria-label={expanded ? "접기" : "더보기"}
                >
                  <ChevronDownIcon
                    size={16}
                    color="#D32F2F"
                    className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>
          </div>
          {record.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={record.image_url}
              alt={record.stores.name}
              className="h-16 w-16 shrink-0 self-start rounded-[10px] object-cover"
              loading="lazy"
            />
          )}
        </div>

        {/* 방문일 */}
        <p className="mt-2 text-[11px] tracking-tight text-text-secondary opacity-60">
          {formatTime(record.visited_at)}
        </p>
      </div>
    </div>
  );
}
