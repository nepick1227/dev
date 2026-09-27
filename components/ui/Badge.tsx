import type { RecommendationType, StoreCategory } from "@/styles/tokens";
import { recommendationLabels, recommendationEmojis, categoryLabels } from "@/styles/tokens";

// ── 평가 뱃지 ───────────────────────────────────────────
interface RecommendationBadgeProps {
  type: RecommendationType;
  showEmoji?: boolean;
  compact?: boolean;
}

const recommendationStyles: Record<RecommendationType, string> = {
  recommend:     "bg-primary-soft text-primary",
  neutral:       "bg-rating-neutral-soft text-text-secondary",
  not_recommend: "bg-rating-negative-soft text-rating-negative",
};

export function RecommendationBadge({ type, showEmoji = true, compact = false }: RecommendationBadgeProps) {
  return (
    <span className={[
      compact
        ? "inline-flex shrink-0 items-center gap-[3px] rounded-[7px] px-[7px] py-[3px] text-[11px] font-bold"
        : "inline-flex shrink-0 items-center gap-1 rounded-[9px] px-[9px] py-[5px] text-[12px] font-bold",
      recommendationStyles[type],
    ].join(" ")}>
      {showEmoji && <span className={`inline-flex items-center justify-center leading-none ${compact ? "h-3 w-3" : "h-3.5 w-3.5"}`}>{recommendationEmojis[type]}</span>}
      {recommendationLabels[type]}
    </span>
  );
}

// ── 카테고리 뱃지 ───────────────────────────────────────
interface CategoryBadgeProps {
  category: StoreCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-bg px-2.5 py-0.5 text-[12px] font-medium text-text-secondary">
      {categoryLabels[category]}
    </span>
  );
}
