import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

interface LoadStateProps {
  /** 없으면 불러오는 중으로 본다 */
  message?: string;
  onRetry?: () => void;
}

/** 첫 내용을 보여 주기 전의 로딩·실패 상태 */
export default function LoadState({ message, onRetry }: LoadStateProps) {
  return (
    <div
      className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 text-center"
      role={message ? "alert" : "status"}
      aria-label={message ? undefined : "불러오는 중"}
    >
      {message ? (
        <>
          <p className="text-[14px] leading-relaxed text-text-secondary">{message}</p>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          )}
        </>
      ) : (
        <Spinner size={28} />
      )}
    </div>
  );
}
