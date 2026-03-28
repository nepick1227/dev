"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import ProfileEditForm from "@/features/profile/ProfileEditForm";
import Spinner from "@/components/ui/Spinner";
import type { Profile } from "@/types/database";

export default function ProfileEditPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data as Profile | null);
      setIsLoading(false);
    });
  }, [router]);

  return (
    <PageContainer>
      <Header
        title="프로필 편집"
        showBack
        onBack={() => router.back()}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size={28} />
          </div>
        ) : profile ? (
          <ProfileEditForm profile={profile} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-text-secondary">
            <p className="text-[14px]">프로필을 불러올 수 없습니다.</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
