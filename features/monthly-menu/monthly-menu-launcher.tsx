import { MONTHLY_MENU_MAX_GENERATIONS, type MonthlyMenuStatus } from "@/lib/monthly-menu";

interface MonthlyMenuLauncherProps {
  status: MonthlyMenuStatus | null;
  disabled: boolean;
  onOpen: () => void;
}

/** 내 픽 화면 상단의 월간 메뉴판 진입 버튼 */
export default function MonthlyMenuLauncher({ status, disabled, onOpen }: MonthlyMenuLauncherProps) {
  return (
    <div className="app-content-readable shrink-0 px-5 pt-3">
      <button
        onClick={onOpen}
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-xl border border-primary/25 bg-primary-soft px-4 py-3 text-left disabled:opacity-60"
      >
        <div>
          <p className="text-[14px] font-bold text-primary">
            {status?.title ?? "지난달 메뉴판"}
          </p>
          <p className="mt-0.5 text-[12px] text-text-secondary">
            사진 기록 2~3개를 골라 공유 카드를 만들어보세요
          </p>
        </div>
        <span className="text-[12px] font-semibold text-primary">
          {status ? (status.isUnlimited ? "DEV 무제한" : `${status.remainingGenerations}/${MONTHLY_MENU_MAX_GENERATIONS}회 남음`) : "확인"}
        </span>
      </button>
    </div>
  );
}
