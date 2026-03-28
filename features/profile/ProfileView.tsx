"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";
import { EditIcon, UserIcon } from "@/components/ui/icons";
import type { Profile } from "@/types/database";

interface ProfileViewProps {
  profile: Profile;
  recordCount: number;
}

/**
 * 프로필 조회 컴포넌트
 */
export default function ProfileView({ profile, recordCount }: ProfileViewProps) {
  const router = useRouter();
  const { toast, showToast } = useToast();

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }, [router]);

  const genderLabel: Record<string, string> = {
    male: "남성",
    female: "여성",
    unknown: "미설정",
  };

  return (
    <>
      <Toast message={toast.message} visible={toast.visible} />

      <div className="flex flex-1 flex-col">
        {/* 프로필 헤더 */}
        <div className="relative px-5 pb-6 pt-8">
          {/* 프로필 이미지 */}
          <div className="mb-4 flex justify-center">
            {profile.profile_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profile_image}
                alt={profile.nickname ?? "프로필"}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg ring-2 ring-border">
                <UserIcon size={36} color="#9CA3AF" />
              </div>
            )}
          </div>

          {/* 닉네임 + 편집 버튼 */}
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-[20px] font-extrabold tracking-tight text-text-primary">
              {profile.nickname ?? "닉네임 없음"}
            </h2>
            <Link
              href="/profile/edit"
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors active:bg-bg"
              aria-label="프로필 편집"
            >
              <EditIcon size={18} color="#6B7280" />
            </Link>
          </div>

          {/* 한줄소개 */}
          {profile.intro && (
            <p className="mt-1 text-center text-[14px] tracking-tight text-text-secondary">
              {profile.intro}
            </p>
          )}

          {/* 통계 */}
          <div className="mt-5 flex justify-center">
            <div className="flex flex-col items-center px-8">
              <span className="text-[22px] font-extrabold text-primary">{recordCount}</span>
              <span className="text-[12px] tracking-tight text-text-secondary">나의 픽</span>
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-2 bg-bg" />

        {/* 메뉴 */}
        <div className="flex flex-col divide-y divide-border">
          <MenuRow
            label="프로필 편집"
            href="/profile/edit"
          />
          <MenuRow
            label="앱 버전"
            right={<span className="text-[13px] text-text-secondary">v0.1.0</span>}
          />
          <MenuRow
            label="로그아웃"
            isDestructive
            onClick={handleLogout}
          />
        </div>
      </div>
    </>
  );
}

// ── 메뉴 행 ──────────────────────────────────────────────
interface MenuRowProps {
  label: string;
  href?: string;
  right?: React.ReactNode;
  isDestructive?: boolean;
  onClick?: () => void;
}

function MenuRow({ label, href, right, isDestructive, onClick }: MenuRowProps) {
  const content = (
    <div className="flex items-center justify-between px-5 py-4">
      <span
        className="text-[15px] tracking-tight"
        style={{ color: isDestructive ? "#D32F2F" : "#111827" }}
      >
        {label}
      </span>
      {right ?? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M7 4L12 9L7 14" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="transition-colors active:bg-bg">{content}</Link>;
  }
  return (
    <button onClick={onClick} className="w-full text-left transition-colors active:bg-bg">
      {content}
    </button>
  );
}
