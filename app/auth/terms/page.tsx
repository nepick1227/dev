"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { NepickLogo } from "@/components/ui/icons";
import { TERMS_CONTENT, type TermsKey } from "@/lib/terms-content";

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
    <div className="flex items-start justify-between px-4 py-3.5">
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

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const abortTermsFlow = () => {
      window.location.replace("/auth/signout?error=auth_failed");
    };

    const handlePopState = () => {
      abortTermsFlow();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      if (event.persisted || navigation?.type === "back_forward") {
        abortTermsFlow();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const handleAllToggle = useCallback(() => {
    const next = !allChecked;
    setAgreements({ service: next, privacy: next, location: next, marketing: next });
  }, [allChecked]);

  const handleToggle = useCallback((key: keyof typeof agreements) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleStart = useCallback(async () => {
    if (!allRequired) return;

    // 1. 위치 권한 요청 (필수 약관 동의 완료 후)
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(() => resolve(), () => resolve());
      });
    }

    // 2. 알림 권한 요청 (마케팅 동의한 경우만, 순차적으로)
    if (agreements.marketing && typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }

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
          <div className="mb-4">
            <NepickLogo size={88} />
          </div>
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
          <CheckboxItem checked={agreements.marketing} required={false} onChange={() => handleToggle("marketing")} label="마케팅 정보 수신 동의" desc="새로운 기능과 이벤트 소식을 가장 먼저 받아요." onDetailClick={() => setDetailKey("marketing")} />
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
