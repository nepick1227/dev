import { recommendationEmojis } from "@/styles/tokens";
import type { RecordWithStore } from "@/types/database";

interface MonthlyStatsProps {
  records: RecordWithStore[];
}

export default function MonthlyStats({ records }: MonthlyStatsProps) {
  const total = records.length;
  const recommend = records.filter((r) => r.recommendation === "recommend").length;
  const neutral = records.filter((r) => r.recommendation === "neutral").length;
  const not_recommend = records.filter((r) => r.recommendation === "not_recommend").length;

  const stats = [
    { label: "내픽", count: total, unit: "개", emoji: null, highlight: false },
    { label: "추천", count: recommend, unit: "", emoji: recommendationEmojis.recommend, highlight: true },
    { label: "보통", count: neutral, unit: "", emoji: recommendationEmojis.neutral, highlight: false },
    { label: "비추천", count: not_recommend, unit: "", emoji: recommendationEmojis.not_recommend, highlight: false },
  ];

  return (
    <div className="px-5 pt-4 pb-1">
      <div className="flex h-9 items-center justify-center rounded-full bg-gray-50 px-4">
        {stats.map(({ label, count, unit, emoji, highlight }, idx) => (
          <div key={label} className="flex items-center">
            {idx > 0 && (
              <span className="mx-3 text-[13px] text-gray-300 select-none">·</span>
            )}
            <span className="flex items-center gap-1 text-[13px] tracking-tight">
              {emoji && <span className="text-[13px] leading-none">{emoji}</span>}
              <span className="text-text-secondary">{label}</span>
              <span className={`font-bold ${highlight ? "text-primary" : "text-text-primary"}`}>{count}{unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
