"use client";

import { openLoginPrompt } from "./login-prompt-events";

interface AuthGateProps {
  nextPath: "/mypick" | "/profile";
}

export default function AuthGate({ nextPath }: AuthGateProps) {
  const description = nextPath === "/profile"
    ? "내 프로필과 기록은 로그인 후 확인할 수 있어요."
    : "방문한 맛집을 기록하면 여기에 나만의 타임라인이 쌓여요.";

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-surface px-10 text-center md:bg-bg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/nepick-fork.svg" alt="네픽" className="h-9 w-auto md:h-[38px]" />
      <h1 className="mt-[26px] text-[20px] font-[800] text-text-primary md:text-[22px]">
        로그인하고 내 지도를 만들어요
      </h1>
      <p className="mt-2.5 max-w-[340px] text-[14px] leading-[1.6] text-text-description md:text-[14.5px]">
        {description}
      </p>
      <button
        type="button"
        onClick={() => openLoginPrompt(nextPath)}
        className="mt-[26px] h-[50px] rounded-[14px] bg-primary px-10 text-[16px] font-bold text-white transition-colors hover:bg-primary-dark md:rounded-[13px]"
      >
        3초 만에 시작하기
      </button>
    </div>
  );
}
