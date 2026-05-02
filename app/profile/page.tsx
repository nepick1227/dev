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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recordCount, setRecordCount] = useState(0);
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

      const [profileRes, countRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("records")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      // 네이버는 커스텀 이메일 플로우라 identities.provider가 "email"로 잡힘 → user_metadata.provider로 보완
      const identityProviders = (user.identities ?? []).map((id) => id.provider);
      const metaProvider = user.user_metadata?.provider as string | undefined;
      const providers = metaProvider && !identityProviders.includes(metaProvider)
        ? [...identityProviders, metaProvider]
        : identityProviders;

      setProfile(profileRes.data as Profile | null);
      setRecordCount(countRes.count ?? 0);
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
            <ProfileView profile={profile} recordCount={recordCount} providers={providers} />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-text-secondary">
            <p className="text-[14px]">프로필을 불러올 수 없습니다.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </PageContainer>
  );
}
