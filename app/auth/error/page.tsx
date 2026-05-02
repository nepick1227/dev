"use client";

import { useRouter } from "next/navigation";

function NepickLogo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D32F2F" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#D32F2F" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d="M40 74C40 74 64 50 64 30C64 16.75 53.25 6 40 6C26.75 6 16 16.75 16 30C16 50 40 74 40 74Z"
        fill="#D32F2F"
      />
      <path
        d="M25 38h30v3c0 7-5.5 11-15 11S25 48 25 41v-3z"
        fill="url(#logo-grad)"
        stroke="#DF6767"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <text
        x="40"
        y="31"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="24"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="white"
      >
        N
      </text>
    </svg>
  );
}

export default function AuthErrorPage() {
  const router = useRouter();

  return (
    <div className="mx-auto flex h-screen max-w-107.5 flex-col bg-white font-sans">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8">
        <NepickLogo size={80} />

        <div className="mt-2 flex flex-col items-center gap-1.5">
          <p className="text-center text-[20px] font-bold tracking-tight text-text-primary">
            로그인에 문제가 있나요?
          </p>
          <p className="text-center text-[14px] leading-relaxed tracking-tight text-text-secondary">
            일시적인 오류가 발생했어요.<br />잠시 후 다시 시도하거나 문의해 주세요.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-6 pb-11">
        <a
          href="#"
          className="flex w-full items-center justify-center rounded-xl border border-border py-4 text-[15px] font-semibold tracking-tight text-text-primary transition-opacity active:opacity-60"
        >
          문의하기
        </a>
        <button
          onClick={() => router.push("/auth/login")}
          className="flex w-full items-center justify-center rounded-xl bg-primary py-4 text-[15px] font-bold tracking-tight text-white transition-opacity active:opacity-80"
        >
          다시 시도하기
        </button>
      </div>
    </div>
  );
}
