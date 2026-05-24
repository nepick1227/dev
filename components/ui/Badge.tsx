import type { RecommendationType, StoreCategory } from "@/styles/tokens";
import { recommendationLabels, recommendationEmojis, categoryLabels } from "@/styles/tokens";

// ── 평가 뱃지 ───────────────────────────────────────────
interface RecommendationBadgeProps {
  type: RecommendationType;
  showEmoji?: boolean;
}

const recommendationStyles: Record<RecommendationType, string> = {
  recommend:     "bg-primary-soft text-primary",
  neutral:       "bg-bg text-text-secondary",
  not_recommend: "bg-bg text-text-secondary",
};

export function RecommendationBadge({ type, showEmoji = true }: RecommendationBadgeProps) {
  return (
    <span className={[
      "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold tracking-tight",
      recommendationStyles[type],
    ].join(" ")}>
      {showEmoji && <span className="inline-flex h-3.5 w-3.5 items-center justify-center leading-none">{recommendationEmojis[type]}</span>}
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
    <span className="inline-flex items-center rounded-full bg-bg px-2.5 py-0.5 text-[12px] font-medium tracking-tight text-text-secondary">
      {categoryLabels[category]}
    </span>
  );
}
