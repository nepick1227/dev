"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { NepickLogo } from "@/components/ui/icons";
import TermsContent from "@/components/ui/TermsContent";
import { TERMS_CONTENT, type TermsKey } from "@/lib/terms-content";
import { pushGtmEvent } from "@/lib/analytics/gtm";
import { getSafeAuthNextPath } from "@/lib/auth-redirect";

interface CheckboxItemProps {
  checked: boolean;
  required: boolean;
  label: string;
  desc: string;
  onChange: () => void;
  onDetailClick: () => void;
}

function CheckDot({ checked }: { checked: boolean }) {
  return (
    <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[12px] text-white transition-colors ${checked ? "bg-primary" : "bg-[#F0F1F3]"}`}>
      {checked && "✓"}
    </span>
  );
}

function CheckboxItem({ checked, required, label, desc, onChange, onDetailClick }: CheckboxItemProps) {
  return (
    <div className="flex items-center gap-3 border-b border-[#F4F5F7] px-1 py-4">
      <button type="button" onClick={onChange} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <CheckDot checked={checked} />
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-bold text-text-body">
            <span className={required ? "text-primary" : "text-text-tertiary"}>
              {required ? "[필수]" : "[선택]"}
            </span>{" "}{label}
          </span>
          <span className="mt-[3px] block text-[12.5px] leading-snug text-text-tertiary">{desc}</span>
        </span>
      </button>
      <button type="button" onClick={onDetailClick} className="flex h-9 w-8 shrink-0 items-center justify-end text-[22px] text-[#C9CCD0]" aria-label={`${label} 전문 보기`}>
        ›
      </button>
    </div>
  );
}

function TermsDetailView({ termsKey, onBack }: { termsKey: TermsKey; onBack: () => void }) {
  const terms = TERMS_CONTENT[termsKey];
  return (
    <div className="page-container bg-surface md:bg-bg">
      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full md:max-w-[640px] md:px-6 md:pb-[60px] md:pt-9">
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-divider bg-surface px-4 pb-[14px] pt-14 md:static md:mb-6 md:border-0 md:bg-transparent md:p-0">
            <button type="button" onClick={onBack} className="flex shrink-0 items-center p-1.5 md:p-1" aria-label="뒤로가기">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 5L8 12L15 19" stroke="var(--color-text-primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h1 className="text-[18px] font-[800] text-text-primary md:text-[22px]">{terms.title}</h1>
          </div>
          <TermsContent
            content={terms.content}
            className="px-5 pb-[30px] pt-[22px] text-[13.5px] leading-[1.75] md:rounded-[20px] md:border md:border-border md:bg-surface md:p-8 md:text-[14px] md:leading-[1.8]"
          />
        </div>
      </div>
    </div>
  );
}

export default function TermsPage() {
  const router = useRouter();
  const [detailKey, setDetailKey] = useState<TermsKey | null>(null);
  const [agreements, setAgreements] = useState({ service: false, privacy: false, location: false, marketing: false });
  const allRequired = agreements.service && agreements.privacy && agreements.location;
  const allChecked = Object.values(agreements).every(Boolean);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const abortTermsFlow = () => window.location.replace("/auth/signout?error=auth_failed");
    const handlePageShow = (event: PageTransitionEvent) => {
      const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      if (event.persisted || navigation?.type === "back_forward") abortTermsFlow();
    };
    window.addEventListener("popstate", abortTermsFlow);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("popstate", abortTermsFlow);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const handleAllToggle = useCallback(() => {
    const next = !allChecked;
    setAgreements({ service: next, privacy: next, location: next, marketing: next });
  }, [allChecked]);

  const handleToggle = useCallback((key: keyof typeof agreements) => {
    setAgreements((previous) => ({ ...previous, [key]: !previous[key] }));
  }, []);

  const handleStart = useCallback(async () => {
    if (!allRequired) return;
    pushGtmEvent("terms_agree", { marketing: agreements.marketing });

    if (navigator.geolocation) {
      await new Promise<void>((resolve) => navigator.geolocation.getCurrentPosition(() => resolve(), () => resolve()));
    }
    if (agreements.marketing && typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    const params = new URLSearchParams();
    if (agreements.marketing) params.set("marketing", "1");
    params.set("next", getSafeAuthNextPath(new URLSearchParams(window.location.search).get("next")));
    router.replace(`/auth/signup?${params.toString()}`);
  }, [agreements.marketing, allRequired, router]);

  if (detailKey) return <TermsDetailView termsKey={detailKey} onBack={() => setDetailKey(null)} />;

  return (
    <div className="page-container auth-form-page">
      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
        <main className="mx-auto w-full max-w-[520px] px-6 pb-8 pt-14 md:pb-[60px]">
          <NepickLogo size={112} />
          <h1 className="mt-[22px] text-[24px] font-[800] tracking-[-0.5px] text-text-primary">서비스 이용 동의</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-text-description">네픽을 이용하기 위해 아래 약관에 동의해 주세요.</p>

          <button type="button" onClick={handleAllToggle} className="mt-[26px] flex w-full items-center gap-3 rounded-[14px] bg-[#F6F7F9] p-4 text-left">
            <CheckDot checked={allChecked} />
            <span className="text-[15px] font-[800] text-text-primary">전체 동의하기</span>
          </button>

          <div className="mt-2.5">
            <CheckboxItem checked={agreements.service} required label="이용약관 동의" desc="네픽 서비스를 이용하기 위한 기본 약관이에요." onChange={() => handleToggle("service")} onDetailClick={() => setDetailKey("service")} />
            <CheckboxItem checked={agreements.privacy} required label="개인정보 수집·이용 동의" desc="서비스 제공을 위해 꼭 필요한 정보만 수집해요." onChange={() => handleToggle("privacy")} onDetailClick={() => setDetailKey("privacy")} />
            <CheckboxItem checked={agreements.location} required label="위치기반 서비스 이용약관 동의" desc="내 주변 맛집 탐색과 랭킹 확인에 필요해요." onChange={() => handleToggle("location")} onDetailClick={() => setDetailKey("location")} />
            <CheckboxItem checked={agreements.marketing} required={false} label="마케팅 정보 수신 동의" desc="새로운 기능과 이벤트 소식을 가장 먼저 받아요." onChange={() => handleToggle("marketing")} onDetailClick={() => setDetailKey("marketing")} />
          </div>

          <Button fullWidth onClick={handleStart} disabled={!allRequired} className="mt-7 hidden h-[54px] rounded-[15px] text-[16px] md:flex">시작하기</Button>
        </main>
      </div>

      <div className="safe-area-pb-lg shrink-0 border-t border-border bg-surface px-6 pt-3 md:hidden">
        <Button fullWidth onClick={handleStart} disabled={!allRequired} className="h-[54px] rounded-[15px] text-[16px]">시작하기</Button>
      </div>
    </div>
  );
}
