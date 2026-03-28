import { useCallback } from "react";
import { formatDateDot } from "@/utils/format";
import {
  recommendationColors,
  recommendationLabels,
  recommendationEmojis,
} from "@/styles/tokens";
import type { RecordWithStore } from "@/types/database";

interface RecordCardProps {
  record: RecordWithStore;
  onClick?: (recordId: number) => void;
}

/**
 * 마이픽 타임라인용 기록 카드
 */
export default function RecordCard({ record, onClick }: RecordCardProps) {
  const handleClick = useCallback(() => {
    onClick?.(record.id);
  }, [record.id, onClick]);

  const recColor = recommendationColors[record.recommendation];
  const recLabel = recommendationLabels[record.recommendation];
  const recEmoji = recommendationEmojis[record.recommendation];

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors active:bg-bg"
    >
      {/* 이미지 or 플레이스홀더 */}
      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-border">
        {record.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={record.image_url}
            alt={record.stores.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-[24px]">
              {record.stores.category === "cafe" ? "☕" : "🍽️"}
            </span>
          </div>
        )}
      </div>

      {/* 내용 */}
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold tracking-tight text-text-primary">
            {record.stores.name}
          </span>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-tight text-white"
            style={{ background: recColor }}
          >
            {recEmoji} {recLabel}
          </span>
        </div>
        <p className="line-clamp-2 text-[13px] leading-snug tracking-tight text-text-secondary">
          {record.comment}
        </p>
        <p className="text-[12px] tracking-tight text-text-secondary opacity-70">
          {formatDateDot(record.visited_at)}
        </p>
      </div>
    </button>
  );
}
