import { ChevronLeftIcon } from "@/components/ui/icons";

interface HeaderProps {
  title?: string;
  /** 뒤로가기 버튼 표시 여부 */
  showBack?: boolean;
  onBack?: () => void;
  /** 우측 액션 버튼 */
  rightAction?: React.ReactNode;
  /** 투명 배경 (지도 페이지용) */
  transparent?: boolean;
}

/**
 * 공통 헤더 컴포넌트
 * 타이틀, 뒤로가기, 우측 액션을 지원합니다.
 */
export default function Header({
  title,
  showBack = false,
  onBack,
  rightAction,
  transparent = false,
}: HeaderProps) {
  return (
    <header
      className={[
        "sticky top-0 z-10 flex h-14 items-center justify-between px-4",
        transparent ? "bg-transparent" : "border-b border-border bg-white",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center gap-1">
        {showBack && (
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors active:bg-bg"
            aria-label="뒤로가기"
          >
            <ChevronLeftIcon size={24} color="#111827" />
          </button>
        )}
        {title && (
          <h1 className="text-[18px] font-bold tracking-tight text-text-primary">{title}</h1>
        )}
      </div>

      {rightAction && (
        <div className="flex items-center">{rightAction}</div>
      )}
    </header>
  );
}
