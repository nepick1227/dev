import {
  recommendationEmojis,
  recommendationLabels,
  type RecommendationType,
} from "@/styles/tokens";

const RECOMMENDATION_OPTIONS: RecommendationType[] = [
  "recommend",
  "neutral",
  "not_recommend",
];

interface RatingSelectorProps {
  value: RecommendationType | null;
  onChange: (value: RecommendationType) => void;
}

export default function RatingSelector({ value, onChange }: RatingSelectorProps) {
  return (
    <div className="flex gap-2.5">
      {RECOMMENDATION_OPTIONS.map((option) => {
        const isSelected = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex h-[88px] flex-1 flex-col items-center justify-center gap-1.5 rounded-[15px] border-2 transition-colors duration-150 ${
              isSelected
                ? "border-primary bg-primary-soft"
                : "border-divider bg-[#F7F8FA]"
            }`}
            aria-pressed={isSelected}
          >
            <span className="text-[26px] leading-none">{recommendationEmojis[option]}</span>
            <span className={`text-[14px] ${isSelected ? "font-[800] text-primary" : "font-bold text-text-secondary"}`}>
              {recommendationLabels[option]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
