import Button from "@/components/ui/Button";

export type MonthlyMenuStep = "select" | "edit" | "preview";

interface MonthlyMenuFooterProps {
  step: MonthlyMenuStep;
  selectedCount: number;
  /** 남은 횟수가 있거나, 이미 차감한 같은 기록 조합이라 다시 그리기만 하면 되는지 */
  canMake: boolean;
  canStartOver: boolean;
  isRedraw: boolean;
  isBuilding: boolean;
  onNext: () => void;
  onBack: () => void;
  onMake: () => void;
  onEditMenus: () => void;
  onStartOver: () => void;
  onShare: () => void;
}

export default function MonthlyMenuFooter({
  step,
  selectedCount,
  canMake,
  canStartOver,
  isRedraw,
  isBuilding,
  onNext,
  onBack,
  onMake,
  onEditMenus,
  onStartOver,
  onShare,
}: MonthlyMenuFooterProps) {
  return (
    <footer className="shrink-0 border-t border-divider bg-surface px-5 py-4">
      {step === "select" && (
        <Button
          size="md"
          fullWidth
          onClick={onNext}
          disabled={selectedCount < 2 || selectedCount > 3 || !canMake}
        >
          {selectedCount < 2 ? "기록을 2개 이상 선택해 주세요" : `${selectedCount}개 선택 완료`}
        </Button>
      )}

      {step === "edit" && (
        <div className="flex gap-2.5">
          <Button variant="secondary" size="md" fullWidth onClick={onBack} disabled={isBuilding}>
            다시 고르기
          </Button>
          <Button size="md" fullWidth onClick={onMake} isLoading={isBuilding} disabled={!canMake}>
            {isRedraw ? "다시 그리기" : "메뉴판 만들기"}
          </Button>
        </div>
      )}

      {step === "preview" && (
        <div className="flex flex-col gap-2.5">
          <Button size="md" fullWidth onClick={onShare}>
            공유하기
          </Button>
          <div className="flex gap-2.5">
            <Button variant="secondary" size="md" fullWidth onClick={onEditMenus}>
              추천 메뉴 고치기
            </Button>
            <Button variant="secondary" size="md" fullWidth onClick={onStartOver} disabled={!canStartOver}>
              사진 다시 고르기
            </Button>
          </div>
        </div>
      )}
    </footer>
  );
}
