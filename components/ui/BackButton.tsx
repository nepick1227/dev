"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  className?: string;
  /** router.back() 대신 특정 경로로 이동하고 싶을 때 */
  fallbackHref?: string;
}

/**
 * 브라우저 히스토리 기준 뒤로가기 버튼 (서버 컴포넌트 페이지에서 사용).
 * 진입 경로가 다양한 화면(약관 등)에서 고정 링크 대신 사용한다.
 */
export default function BackButton({ className, fallbackHref }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (fallbackHref && window.history.length <= 1) {
      router.push(fallbackHref);
      return;
    }
    router.back();
  };

  return (
    <button onClick={handleClick} className={className} aria-label="뒤로가기">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 18L9 12L15 6" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
