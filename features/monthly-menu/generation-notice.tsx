import { MONTHLY_MENU_MAX_GENERATIONS } from "@/lib/monthly-menu";

interface GenerationNoticeProps {
  remaining: number;
  isUnlimited: boolean;
}

/** 횟수 차감 규칙 사전 안내 */
export default function GenerationNotice({ remaining, isUnlimited }: GenerationNoticeProps) {
  return (
    <p className="mb-4 rounded-xl bg-bg-soft px-4 py-3 text-[12.5px] leading-relaxed text-text-secondary">
      <span className="font-bold text-text-primary">&lsquo;메뉴판 만들기&rsquo;를 누를 때마다 1회 차감돼요.</span>
      <br />
      한 달에 {MONTHLY_MENU_MAX_GENERATIONS}회까지 만들 수 있고, 공유하기는 차감되지 않아요.
      {" "}
      {isUnlimited ? "(개발 환경 무제한)" : `이번 달 ${remaining}회 남았어요.`}
    </p>
  );
}
