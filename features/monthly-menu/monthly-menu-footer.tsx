import Button from "@/components/ui/Button";

export type MonthlyMenuStep = "select" | "edit" | "preview";

interface MonthlyMenuFooterProps {
  step: MonthlyMenuStep;
  selectedCount: number;
  /** 이번 달 남은 횟수가 있는지 */
  canMake: boolean;
  canStartOver: boolean;
  /** 이미 만든 메뉴판이 있어 횟수 차감 없이 미리보기로 돌아갈 수 있는지 */
  hasCollage: boolean;
  isBuilding: boolean;
  isSharing: boolean;
  onNext: () => void;
  onBack: () => void;
  onBackToPreview: () => void;
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
  hasCollage,
  isBuilding,
  isSharing,
  onNext,
  onBack,
  onBackToPreview,
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
        <div className="flex flex-col gap-2.5">
          <Button size="md" fullWidth onClick={onMake} isLoading={isBuilding} disabled={!canMake}>
            메뉴판 만들기 (1회 차감)
          </Button>
          <div className="flex gap-2.5">
            {hasCollage && (
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={onBackToPreview}
                disabled={isBuilding}
                className="h-11 whitespace-nowrap"
              >
                미리보기로 돌아가기
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={onBack}
              disabled={isBuilding}
              className="h-11 whitespace-nowrap"
            >
              내픽 다시 고르기
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="flex flex-col gap-2.5">
          <Button size="md" fullWidth onClick={onShare} disabled={isSharing}>
            공유하기
          </Button>
          <div className="flex gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={onEditMenus}
              className="h-11 whitespace-nowrap"
            >
              추천 메뉴 고치기
            </Button>
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={onStartOver}
              disabled={!canStartOver}
              className="h-11 whitespace-nowrap"
            >
              내픽 다시 고르기
            </Button>
          </div>
        </div>
      )}
    </footer>
  );
}
