"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSignedImageUrl } from "@/hooks/use-signed-image-url";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { UserIcon, ChevronRightIcon, KakaoIcon, NaverIcon, GoogleIcon, EditIcon } from "@/components/ui/icons";
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

export default function ProfileView({ profile, stats, providers, onNavigate }: ProfileViewProps) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const profileImageUrl = useSignedImageUrl("profile-images", profile.profile_image);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
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
        { label: "사용설명서", externalUrl: "#" },
        { label: "의견 보내기", externalUrl: "#" },
        { label: "별점 남기기", externalUrl: "#" },
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
        { label: "로그아웃", onPress: () => setShowLogoutModal(true) },
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

      <div className="app-content-readable flex flex-1 flex-col">
        {/* 프로필 헤더 */}
        <div className="px-6 pb-6 pt-8 text-center">
          {/* 아바타 + 수정 버튼 */}
          <div className="mb-4 flex justify-center">
            <div className="relative inline-block">
              {profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImageUrl}
                  alt={profile.nickname ?? "프로필"}
                  className="h-19 w-19 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="flex h-19 w-19 items-center justify-center rounded-full bg-bg ring-2 ring-border">
                  <UserIcon size={34} color="var(--color-text-tertiary)" />
                </div>
              )}
              <Link
                href="/profile/edit"
                onClick={(event) => {
                  if (!onNavigate) return;
                  event.preventDefault();
                  onNavigate("/profile/edit");
                }}
                className="absolute bottom-0 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-[0_2px_8px_rgba(17,24,39,0.10)] transition-opacity active:opacity-70"
                aria-label="프로필 수정"
              >
                <EditIcon size={14} color="#374151" />
              </Link>
            </div>
          </div>

          {/* 닉네임 + 소셜 아이콘 */}
          <div className="mb-1.5 flex items-center justify-center gap-2">
            <h2 className="text-[20px] font-extrabold tracking-tight text-text-primary">
              {profile.nickname ?? "닉네임 없음"}
            </h2>
            <SocialIcons providers={providers} />
          </div>

          {/* 한줄소개 */}
          <p className="mb-4 line-clamp-2 text-[14px] leading-relaxed tracking-tight text-text-secondary">
            {profile.intro ?? "소개를 작성해보세요!"}
          </p>

          {/* 기록 통계 */}
          <div className="mb-4 flex justify-center">
            <div className="flex h-9 items-center justify-center rounded-full bg-bg px-4">
              {[
                { label: "내픽", count: stats.total, unit: "개", emoji: null, highlight: false },
                { label: "추천", count: stats.recommend, unit: "", emoji: recommendationEmojis.recommend, highlight: true },
                { label: "보통", count: stats.neutral, unit: "", emoji: recommendationEmojis.neutral, highlight: false },
                { label: "비추천", count: stats.notRecommend, unit: "", emoji: recommendationEmojis.not_recommend, highlight: false },
              ].map(({ label, count, unit, emoji, highlight }, idx) => (
                <div key={label} className="flex items-center">
                  {idx > 0 && <span className="mx-3 select-none text-[13px] text-gray-300">·</span>}
                  <span className="flex items-center gap-1 text-[13px] tracking-tight">
                    {emoji && <span className="text-[13px] leading-none">{emoji}</span>}
                    <span className="text-text-secondary">{label}</span>
                    <span className={`font-bold ${highlight ? "text-primary" : "text-text-primary"}`}>{count}{unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-2 bg-bg" />

        {/* 메뉴 섹션 */}
        <div className="px-5 pb-4">
          {menuSections.map((section) => (
            <div key={section.title}>
              <p className="pb-1 pt-5 text-[12px] font-semibold tracking-tight text-text-secondary">
                {section.title}
              </p>
              {section.items.map((item) => (
                <MenuRow key={item.label} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          ))}
        </div>

        {/* 앱 버전 */}
        <div className="px-5 pb-8 pt-2 text-center">
          <span className="text-[12px] tracking-tight text-text-secondary">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
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
  onPress?: () => void;
}

function MenuRow({ item, onNavigate }: { item: MenuItem; onNavigate?: (href: string) => void }) {
  const content = (
    <div className="flex items-center justify-between py-4">
      <span className={`text-[15px] tracking-tight ${item.isDestructive ? "text-primary" : "text-text-primary"}`}>
        {item.label}
      </span>
      {item.right ?? <ChevronRightIcon size={16} color="var(--color-text-tertiary)" />}
    </div>
  );

  // 외부 링크
  if (item.externalUrl) {
    return (
      <a
        href={item.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-b border-border transition-colors active:bg-bg"
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
        className="block border-b border-border transition-colors active:bg-bg"
      >
        {content}
      </Link>
    );
  }

  // 버튼 (onPress) 또는 텍스트만 (앱 버전 등)
  return (
    <button
      onClick={item.onPress}
      className="w-full border-b border-border text-left transition-colors active:bg-bg disabled:cursor-default"
      disabled={!item.onPress}
    >
      {content}
    </button>
  );
}
