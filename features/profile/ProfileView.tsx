"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pushGtmEvent } from "@/lib/analytics/gtm";
import { useSignedImageUrl } from "@/hooks/use-signed-image-url";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { ChevronRightIcon, KakaoIcon, NaverIcon, GoogleIcon } from "@/components/ui/icons";
import { recommendationEmojis } from "@/styles/tokens";
import type { Profile } from "@/types/database";

interface RecordStats {
  total: number;
  recommend: number;
  neutral: number;
  notRecommend: number;
}

interface ProfileViewProps {
  profile: Profile;
  stats: RecordStats;
  providers: string[];
  onNavigate?: (href: string) => void;
  compact?: boolean;
}

// 소셜 아이콘 매핑
function SocialIcons({ providers }: { providers: string[] }) {
  if (!providers.length) return null;
  return (
    <div className="flex items-center gap-1">
      {providers.includes("kakao") && <KakaoIcon size={18} />}
      {providers.includes("naver") && <NaverIcon size={18} />}
      {providers.includes("google") && <GoogleIcon size={18} />}
    </div>
  );
}

export default function ProfileView({ profile, stats, providers, onNavigate, compact = false }: ProfileViewProps) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const profileImageUrl = useSignedImageUrl("profile-images", profile.profile_image);

  const handleLogout = useCallback(async () => {
    pushGtmEvent("logout");
    router.replace("/auth/signout");
  }, [router]);

  // 메뉴 섹션 구조
  const menuSections = [
    {
      title: "설정",
      items: [
        { label: "권한 및 알림 설정", href: "/profile/permissions" },
      ],
    },
    {
      title: "고객센터",
      items: [
        { label: "사용설명서", externalUrl: "https://furtive-yogurt-135.notion.site/3a9c394bf09480f89933eb3c2eff8bd6" },
        { label: "의견 보내기", externalUrl: "https://furtive-yogurt-135.notion.site/ef6c394bf09483b483c681e5589986a8?pvs=143" },
      ],
    },
    {
      title: "약관",
      items: [
        { label: "이용약관", href: "/profile/terms/service" },
        { label: "개인정보 수집·이용 동의", href: "/profile/terms/privacy" },
        { label: "위치기반 서비스 이용약관", href: "/profile/terms/location" },
        { label: "마케팅 정보 수신 동의", href: "/profile/terms/marketing" },
      ],
    },
    {
      title: "계정",
      items: [
        { label: "로그아웃", onPress: () => setShowLogoutModal(true), hideChevron: true, isMuted: true },
        { label: "회원탈퇴", href: "/profile/withdrawal", isDestructive: true },
      ],
    },
  ];

  return (
    <>
      {/* 로그아웃 확인 모달 */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        variant="dialog"
        title="로그아웃"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" fullWidth onClick={() => setShowLogoutModal(false)}>
              취소
            </Button>
            <Button fullWidth onClick={handleLogout}>
              확인
            </Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed text-text-secondary">
          정말 로그아웃 하시겠어요?
        </p>
      </Modal>

      <div className={`app-content-readable flex flex-1 flex-col ${compact ? "" : "md:block md:!max-w-[620px] md:px-6 md:pb-11 md:pt-11"}`}>
        {/* 프로필 헤더 */}
        <div className={`px-6 pb-6 pt-4 text-center ${compact ? "" : "md:flex md:items-center md:gap-6 md:rounded-[20px] md:border md:border-divider md:bg-surface md:p-[34px] md:text-left"}`}>
          <div className="mb-[14px] flex justify-center md:mb-0 md:shrink-0">
            <div className="inline-block">
              {profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImageUrl}
                  alt={profile.nickname ?? "프로필"}
                  className="h-[88px] w-[88px] rounded-full object-cover md:h-[92px] md:w-[92px]"
                />
              ) : (
                <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-linear-to-br from-[#FBE3E0] to-bg md:h-[92px] md:w-[92px]">
                  <span className="text-[30px] font-[800] text-primary md:text-[32px]">
                    {profile.nickname?.trim().charAt(0) || "N"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {/* 닉네임 + 소셜 아이콘 */}
            <div className="mb-1.5 flex items-center justify-center gap-2 md:justify-start">
              <h2 className="text-[19px] font-[800] text-text-primary md:text-[21px]">
                {profile.nickname ?? "닉네임 없음"}
              </h2>
              <SocialIcons providers={providers} />
            </div>

            {/* 한줄소개 */}
            <p className="mb-4 line-clamp-2 text-[13.5px] leading-[1.5] text-text-description md:mb-[14px] md:text-[14px]">
              {profile.intro ?? "소개를 작성해보세요!"}
            </p>

            {/* 기록 통계 */}
            <div className="flex justify-center gap-2.5 md:justify-start md:gap-3">
              {[
                { label: "기록", count: stats.total, unit: "", emoji: null, highlight: false },
                { label: "추천", count: stats.recommend, unit: "", emoji: recommendationEmojis.recommend, highlight: true },
                { label: "보통", count: stats.neutral, unit: "", emoji: recommendationEmojis.neutral, highlight: false },
                { label: "비추천", count: stats.notRecommend, unit: "", emoji: recommendationEmojis.not_recommend, highlight: false },
              ].map(({ label, count, unit, emoji, highlight }) => (
                <div key={label} className="flex min-w-[62px] flex-col items-center rounded-[14px] bg-bg-soft px-2.5 py-2 md:min-w-0 md:flex-row md:gap-1 md:whitespace-nowrap md:bg-transparent md:p-0">
                  <span className={`text-[19px] font-[800] md:order-2 md:text-[15px] ${highlight ? "text-primary" : "text-text-primary"}`}>
                    {emoji && <span className="mr-1 leading-none">{emoji}</span>}{count}{unit}
                  </span>
                  <span className="mt-0.5 text-[11.5px] text-text-tertiary md:order-1 md:mt-0 md:text-[13px] md:text-text-secondary">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/profile/edit"
            onClick={(event) => {
              if (!onNavigate) return;
              event.preventDefault();
              onNavigate("/profile/edit");
            }}
            className="mt-4 flex h-[46px] w-full shrink-0 items-center justify-center rounded-[13px] border-[1.5px] border-border bg-surface text-[15px] font-bold text-text-body md:mt-0 md:h-11 md:w-auto md:px-5 md:text-[14.5px]"
          >
            프로필 수정
          </Link>
        </div>

        {/* 구분선 */}
        <div className={`h-2 bg-bg ${compact ? "" : "md:hidden"}`} />

        {/* 메뉴 섹션 */}
        <div className={`px-5 pb-4 ${compact ? "" : "md:mt-[22px] md:px-0 md:pb-0"}`}>
          {menuSections.map((section) => (
            <section key={section.title} className={compact ? "" : "md:mb-[14px] md:overflow-hidden md:rounded-[20px] md:border md:border-divider md:bg-surface"}>
              <p className={`pb-1 pt-5 text-[12.5px] font-bold text-text-tertiary ${compact ? "" : "md:px-[22px] md:pb-1 md:pt-4 md:text-[12.5px]"}`}>
                {section.title}
              </p>
              <div>
                {section.items.map((item) => (
                  <MenuRow key={item.label} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* 앱 버전 */}
        <div className={`px-5 pb-8 pt-2 text-center ${compact ? "" : "md:pb-0 md:pt-4"}`}>
          <span className="text-[12px] text-text-tertiary">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
        </div>
      </div>
    </>
  );
}

// ── 메뉴 행 ──────────────────────────────────────────────

interface MenuItem {
  label: string;
  href?: string;
  externalUrl?: string;
  right?: React.ReactNode;
  isDestructive?: boolean;
  isMuted?: boolean;
  hideChevron?: boolean;
  onPress?: () => void;
}

function MenuRow({ item, onNavigate }: { item: MenuItem; onNavigate?: (href: string) => void }) {
  const content = (
    <div className="flex items-center justify-between py-[15px] md:px-[22px] md:py-4">
      <span className={`text-[15px] ${item.isDestructive ? "text-primary" : item.isMuted ? "text-text-tertiary" : "text-text-primary"}`}>
        {item.label}
      </span>
      {!item.hideChevron && (item.right ?? <ChevronRightIcon size={16} color="var(--color-text-tertiary)" />)}
    </div>
  );

  // 외부 링크
  if (item.externalUrl) {
    return (
      <a
        href={item.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-b border-divider transition-colors last:border-b-0 active:bg-bg-soft"
      >
        {content}
      </a>
    );
  }

  // 내부 링크
  if (item.href) {
    return (
      <Link
        href={item.href}
        onClick={(event) => {
          if (!onNavigate || !item.href) return;
          event.preventDefault();
          onNavigate(item.href);
        }}
        className="block border-b border-divider transition-colors last:border-b-0 active:bg-bg-soft"
      >
        {content}
      </Link>
    );
  }

  // 버튼 (onPress) 또는 텍스트만 (앱 버전 등)
  return (
    <button
      onClick={item.onPress}
      className="w-full border-b border-divider text-left transition-colors last:border-b-0 active:bg-bg-soft disabled:cursor-default"
      disabled={!item.onPress}
    >
      {content}
    </button>
  );
}
