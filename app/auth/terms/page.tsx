"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

// ── 약관 데이터 ──────────────────────────────────────
const TERMS_CONTENT = {
  service: {
    title: "이용약관",
    content: `제1조 (목적)\n본 약관은 네픽(NePick) 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.\n\n제2조 (정의)\n1. "서비스"란 회사가 제공하는 맛집 기록 및 추천 서비스를 의미합니다.\n2. "이용자"란 본 약관에 따라 서비스를 이용하는 자를 말합니다.\n\n제3조 (서비스의 제공)\n1. 회사는 다음과 같은 서비스를 제공합니다.\n  - 맛집 기록 및 관리 서비스\n  - 위치 기반 맛집 추천 서비스\n  - 맛집 랭킹 서비스\n2. 서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다.`,
  },
  privacy: {
    title: "개인정보 수집·이용 동의",
    content: `제1조 (수집하는 개인정보 항목)\n회사는 서비스 제공을 위해 아래 항목을 수집합니다.\n\n· 필수: 이메일 주소, 소셜 로그인 식별 정보\n· 선택: 닉네임, 생년월일, 성별, 프로필 사진, 한줄소개\n\n제2조 (수집·이용 목적)\n· 회원 식별 및 서비스 제공\n· 맛집 기록, 추천, 위치 기반 서비스 운영\n\n제3조 (보유 및 이용 기간)\n· 회원 탈퇴 시까지 보유하며, 탈퇴 후 30일 이내 완전 삭제합니다.\n· 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간까지 보관합니다.\n\n※ 개인정보 처리방침 전문은 설정 > 개인정보 처리방침에서 확인할 수 있습니다.`,
  },
  location: {
    title: "위치기반 서비스 이용약관",
    content: `제1조 (목적)\n본 약관은 네픽(NePick)이 제공하는 위치기반서비스에 대해 회사와 이용자 간의 권리·의무를 규정합니다.\n\n제2조 (서비스의 내용)\n- 위치 정보를 활용한 주변 맛집 검색\n- 위치 기반 맛집 랭킹 제공\n- 지도 기반 맛집 탐색 서비스\n\n제3조 (개인위치정보의 이용)\n회사는 개인위치정보를 이용하여 서비스를 제공하고자 하는 경우 이용약관에 명시한 후 개인위치정보주체의 동의를 얻어야 합니다.`,
  },
} as const;

type TermsKey = keyof typeof TERMS_CONTENT;

// ── 체크박스 컴포넌트 ────────────────────────────────
interface CheckboxItemProps {
  checked: boolean;
  required: boolean;
  label: string;
  desc: string;
  onChange: () => void;
  onDetailClick?: () => void;
}

function CheckboxItem({ checked, required, label, desc, onChange, onDetailClick }: CheckboxItemProps) {
  return (
    <div className="flex items-start justify-between py-3.5">
      <div className="flex flex-1 cursor-pointer items-start gap-3" onClick={onChange}>
        <div className={[
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-200",
          checked ? "bg-primary" : "border-2 border-border bg-surface",
        ].join(" ")}
        >
          {checked && (
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
              <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-[15px] leading-snug tracking-tight text-text-primary">
            {required ? (
              <span className="mr-1 font-semibold text-primary">[필수]</span>
            ) : (
              <span className="mr-1 font-medium text-text-secondary">[선택]</span>
            )}
            {label}
          </p>
          <p className="mt-0.5 text-[12px] leading-snug tracking-tight text-text-secondary">{desc}</p>
        </div>
      </div>
      {onDetailClick && (
        <button
          onClick={(e) => { e.stopPropagation(); onDetailClick(); }}
          className="shrink-0 pl-2 pt-0.5 text-xl leading-none text-text-secondary"
          aria-label="약관 전문 보기"
        >
          ›
        </button>
      )}
    </div>
  );
}

// ── 약관 전문 페이지 ─────────────────────────────────
function TermsDetailView({ termsKey, onBack }: { termsKey: TermsKey; onBack: () => void }) {
  const terms = TERMS_CONTENT[termsKey];
  return (
    <div className="page-container">
      <div className="sticky top-0 z-10 flex items-center border-b border-border bg-surface px-5 py-4">
        <button onClick={onBack} className="flex items-center p-1 pr-2" aria-label="뒤로가기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18L9 12L15 6" stroke="var(--color-text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-[18px] font-bold tracking-tight text-text-primary">{terms.title}</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <pre className="whitespace-pre-wrap break-keep font-sans text-[14px] leading-7 text-text-secondary">
          {terms.content}
        </pre>
      </div>
    </div>
  );
}

// ── 메인: 약관 동의 페이지 ───────────────────────────
export default function TermsPage() {
  const router = useRouter();
  const [detailKey, setDetailKey] = useState<TermsKey | null>(null);
  const [agreements, setAgreements] = useState({
    service: false,
    privacy: false,
    location: false,
    marketing: false,
  });

  const requiredKeys = ["service", "privacy", "location"] as const;
  const allRequired = requiredKeys.every((k) => agreements[k]);
  const allChecked = Object.values(agreements).every(Boolean);

  const handleAllToggle = useCallback(() => {
    const next = !allChecked;
    setAgreements({ service: next, privacy: next, location: next, marketing: next });
    if (next && !agreements.marketing && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [allChecked, agreements.marketing]);

  const handleToggle = useCallback((key: keyof typeof agreements) => {
    setAgreements((prev) => {
      const next = !prev[key];
      if (key === "marketing" && next && typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission();
      }
      return { ...prev, [key]: next };
    });
  }, []);

  const handleStart = useCallback(() => {
    if (!allRequired) return;
    router.replace(`/auth/signup${agreements.marketing ? "?marketing=1" : ""}`);
  }, [allRequired, agreements.marketing, router]);

  if (detailKey) {
    return <TermsDetailView termsKey={detailKey} onBack={() => setDetailKey(null)} />;
  }

  return (
    <div className="page-container">
      <div className="flex flex-1 flex-col">
        {/* 로고 & 타이틀 */}
        <div className="nepick-fade-in px-6 pb-8 pt-16">
          <svg width="48" height="48" viewBox="0 0 80 80" fill="none" className="mb-4" aria-hidden="true">
            <defs>
              <linearGradient id="terms-logo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D32F2F" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#D32F2F" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path d="M40 74C40 74 64 50 64 30C64 16.75 53.25 6 40 6C26.75 6 16 16.75 16 30C16 50 40 74 40 74Z" fill="#D32F2F" />
            <path d="M25 38h30v3c0 7-5.5 11-15 11S25 48 25 41v-3z" fill="url(#terms-logo)" stroke="#DF6767" strokeWidth="1.8" strokeLinejoin="round" />
            <text x="40" y="31" textAnchor="middle" dominantBaseline="central" fontSize="24" fontWeight="900" fontFamily="sans-serif" fill="white">N</text>
          </svg>
          <h1 className="mb-2 text-[26px] font-extrabold leading-tight tracking-tight text-text-primary">
            서비스 이용 동의
          </h1>
          <p className="text-[15px] leading-relaxed tracking-tight text-text-secondary">
            네픽을 이용하기 위해 아래 약관에 동의해 주세요.
          </p>
        </div>

        {/* 약관 목록 */}
        <div className="nepick-fade-in px-6 [animation-delay:100ms]">
          {/* 전체 동의 */}
          <div
            onClick={handleAllToggle}
            className={[
              "mb-2 flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] p-4 transition-all duration-200",
              allChecked ? "border-primary-border bg-primary-soft" : "border-border bg-bg",
            ].join(" ")}
          >
            <div className={[
              "flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
              allChecked ? "bg-primary" : "border-2 border-border bg-surface",
            ].join(" ")}
            >
              {allChecked && (
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                  <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-[16px] font-bold tracking-tight text-text-primary">전체 동의하기</span>
          </div>

          <div className="my-2 h-px bg-border" />

          <CheckboxItem checked={agreements.service} required onChange={() => handleToggle("service")} label="이용약관 동의" desc="네픽 서비스를 이용하기 위한 기본 약관이에요." onDetailClick={() => setDetailKey("service")} />
          <CheckboxItem checked={agreements.privacy} required onChange={() => handleToggle("privacy")} label="개인정보 수집·이용 동의" desc="서비스 제공을 위해 꼭 필요한 정보만 수집해요." onDetailClick={() => setDetailKey("privacy")} />
          <CheckboxItem checked={agreements.location} required onChange={() => handleToggle("location")} label="위치기반 서비스 이용약관 동의" desc="내 주변 맛집 탐색과 랭킹 확인에 필요해요." onDetailClick={() => setDetailKey("location")} />
          <CheckboxItem checked={agreements.marketing} required={false} onChange={() => handleToggle("marketing")} label="마케팅 정보 수신 동의" desc="새로운 기능과 이벤트 소식을 가장 먼저 받아요." />
        </div>
      </div>

      {/* CTA */}
      <div className="nepick-fade-in safe-area-pb-lg px-6 pt-4 [animation-delay:250ms]">
        <Button fullWidth onClick={handleStart} disabled={!allRequired}>
          시작하기
        </Button>
      </div>
    </div>
  );
}
