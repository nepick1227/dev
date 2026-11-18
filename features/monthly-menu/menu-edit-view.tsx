import Input from "@/components/ui/Input";
import { MAX_RECOMMENDED_MENU_LENGTH, type MonthlyMenuRecord } from "@/lib/monthly-menu";

interface MenuEditViewProps {
  records: MonthlyMenuRecord[];
  menus: Record<number, string>;
  onMenuChange: (recordId: number, menu: string) => void;
}

/** 고른 기록마다 가게명·위치(자동, 수정 불가)와 추천 메뉴(선택 입력)를 보여 준다 */
export default function MenuEditView({
  records,
  menus,
  onMenuChange,
}: MenuEditViewProps) {
  return (
    <>
      <div className="mb-4">
        <p className="text-[15px] font-bold text-text-primary">추천 메뉴를 적어 주세요</p>
        <p className="mt-1 text-[12px] text-text-secondary">
          비워 두면 메뉴판에 가게 이름과 위치만 나와요
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {records.map((record, index) => (
          <li key={record.id} className="flex gap-3 rounded-xl border border-border bg-surface p-3">
            <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-lg bg-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={record.imageUrl} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                {index + 1}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-text-primary">{record.storeName}</p>
                <p className="truncate text-[12px] text-text-secondary">
                  {record.storeArea || "위치 정보 없음"}
                </p>
              </div>
              <Input
                id={`monthly-menu-${record.id}`}
                aria-label={`${record.storeName} 추천 메뉴`}
                value={menus[record.id] ?? ""}
                maxLength={MAX_RECOMMENDED_MENU_LENGTH}
                placeholder={`추천 메뉴 (선택, ${MAX_RECOMMENDED_MENU_LENGTH}자 이내)`}
                onChange={(event) => onMenuChange(record.id, event.target.value)}
                className="h-10 text-[14px]"
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
