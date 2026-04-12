"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 전역 에러 바운더리 페이지
 * 런타임 에러(네트워크 오류 등) 발생 시 표시
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex h-screen max-w-107.5 flex-col bg-white font-sans">
      {/* 아이콘 + 메시지 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8">
        <div className="flex h-18 w-18 items-center justify-center rounded-[20px] bg-bg">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M1 1l22 22" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" />
            <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 12.55a10.94 10.94 0 015.17-2.39" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.71 5.05A16 16 0 0122.56 9" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1.42 9a15.91 15.91 0 014.7-2.88" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.53 16.11a6 6 0 016.95 0" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="20" r="1" fill="#6B7280" />
          </svg>
        </div>

        <p className="text-center text-[18px] font-bold tracking-tight text-text-primary">
          화면을 불러올 수 없어요
        </p>
        <p className="text-center text-[14px] leading-relaxed tracking-tight text-text-secondary">
          인터넷 연결을 확인 후<br />다시 시도해 주세요.
        </p>
      </div>

      {/* 새로고침 버튼 */}
      <div className="px-6 pb-11">
        <button
          onClick={reset}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-[15px] font-bold tracking-tight text-white transition-opacity active:opacity-80"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M23 4v6h-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          새로고침 하기
        </button>
      </div>
    </div>
  );
}
