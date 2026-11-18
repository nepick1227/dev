import { formatMonthlyMenuDate, type MonthlyMenuStatus } from "@/lib/monthly-menu";

interface RecordSelectionViewProps {
  status: MonthlyMenuStatus;
  selectedIds: number[];
  onToggle: (recordId: number) => void;
}

export default function RecordSelectionView({
  status,
  selectedIds,
  onToggle,
}: RecordSelectionViewProps) {
  if (status.records.length < 3) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center text-center">
        <p className="text-[16px] font-bold text-text-primary">사진 기록이 더 필요해요</p>
        <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
          전월에 이미지가 포함된 기록이 3개 이상일 때<br />
          월간 메뉴판을 만들 수 있습니다.
        </p>
      </div>
    );
  }

  if (!status.isUnlimited && status.remainingGenerations <= 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center text-center">
        <p className="text-[16px] font-bold text-text-primary">이번 달 메뉴판을 모두 만들었어요</p>
        <p className="mt-2 text-[13px] text-text-secondary">
          월간 메뉴판은 한 달에 2번까지 생성할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[15px] font-bold text-text-primary">
            사진 기록을 2~3개 골라주세요
          </p>
          <p className="mt-1 text-[12px] text-text-secondary">
            전월 이미지 기록 {status.records.length}개 · {status.isUnlimited
              ? "개발 환경 무제한"
              : `이번 달 ${status.remainingGenerations}회 남음`}
          </p>
        </div>
        <span className="shrink-0 text-[13px] font-bold text-primary">
          {selectedIds.length}/3
        </span>
      </div>

      <div className="grid auto-rows-fr grid-cols-2 items-stretch gap-3 sm:grid-cols-3">
        {status.records.map((record) => {
          const selected = selectedIds.includes(record.id);
          return (
            <button
              key={record.id}
              onClick={() => onToggle(record.id)}
              className={[
                "flex h-full min-w-0 flex-col overflow-hidden rounded-xl border-2 bg-surface text-left transition-all",
                selected ? "border-primary shadow-md" : "border-transparent ring-1 ring-border",
              ].join(" ")}
            >
              <div className="relative aspect-square overflow-hidden bg-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={record.imageUrl} alt="" className="h-full w-full object-cover" />
                <span
                  className={[
                    "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-[12px] font-bold",
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-white/80 bg-black/35 text-white",
                  ].join(" ")}
                >
                  {selected ? selectedIds.indexOf(record.id) + 1 : ""}
                </span>
              </div>
              <div className="flex min-h-[112px] flex-1 flex-col p-3">
                <p className="h-5 truncate text-[13px] font-bold leading-5 text-text-primary">
                  {record.storeName}
                </p>
                <p className="mt-0.5 h-4 truncate text-[11px] leading-4 text-text-secondary">
                  {formatMonthlyMenuDate(record.visitedAt)}
                  {record.storeArea && ` · ${record.storeArea}`}
                </p>
                <p className="mt-1 line-clamp-2 min-h-9 text-[11px] leading-[18px] text-text-secondary">
                  {record.comment}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
