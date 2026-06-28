"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ProfileView from "@/features/profile/ProfileView";
import Spinner from "@/components/ui/Spinner";
import type { Profile } from "@/types/database";

interface RecordStats {
  total: number;
  recommend: number;
  neutral: number;
  notRecommend: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<RecordStats>({ total: 0, recommend: 0, neutral: 0, notRecommend: 0 });
  const [providers, setProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const [profileRes, recordsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("records").select("recommendation").eq("user_id", user.id),
      ]);

      // 네이버는 커스텀 이메일 플로우라 identities.provider가 "email"로 잡힘 → user_metadata.provider로 보완
      const identityProviders = (user.identities ?? []).map((id) => id.provider);
      const metaProvider = user.user_metadata?.provider as string | undefined;
      const providers = metaProvider && !identityProviders.includes(metaProvider)
        ? [...identityProviders, metaProvider]
        : identityProviders;

      const records = (recordsRes.data ?? []) as { recommendation: string }[];
      const computedStats: RecordStats = {
        total: records.length,
        recommend: records.filter((r) => r.recommendation === "recommend").length,
        neutral: records.filter((r) => r.recommendation === "neutral").length,
        notRecommend: records.filter((r) => r.recommendation === "not_recommend").length,
      };

      setProfile(profileRes.data as Profile | null);
      setStats(computedStats);
      setProviders(providers);
      setIsLoading(false);
    };

    load();
  }, [router]);

  return (
    <PageContainer>
      <Header title="프로필" />
      <div className="flex flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size={28} />
          </div>
        ) : profile ? (
          <div className="hide-scrollbar flex-1 overflow-y-auto">
            <ProfileView profile={profile} stats={stats} providers={providers} />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-text-secondary">
            <p className="text-[14px] font-semibold text-text-primary">프로필을 불러오지 못했어요.</p>
            <p className="mt-1 text-[13px]">잠시 후 화면을 새로고침해 주세요.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </PageContainer>
  );
}
