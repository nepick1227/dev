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
  noBorder?: boolean;
  size?: "default" | "large";
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
  noBorder = false,
  size = "default",
}: HeaderProps) {
  return (
    <header
      className={[
        "sticky top-0 z-10 flex shrink-0 items-center justify-between md:relative md:mx-auto md:h-auto md:w-full md:max-w-[720px] md:px-6 md:pb-6 md:pt-9",
        size === "large" ? "h-[68px] px-5 pt-3" : "h-14 px-4",
        transparent ? "bg-transparent" : noBorder ? "bg-surface md:bg-transparent" : "border-b border-divider bg-surface md:border-0 md:bg-transparent",
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
            <ChevronLeftIcon size={24} color="var(--color-text-primary)" />
          </button>
        )}
        {title && (
          <h1 className={size === "large" ? "text-[26px] font-[800] tracking-[-0.5px] text-text-primary md:text-[22px]" : "text-[18px] font-[800] text-text-primary md:text-[22px]"}>{title}</h1>
        )}
      </div>

      {rightAction && (
        <div className="flex items-center">{rightAction}</div>
      )}
    </header>
  );
}
