"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import BottomNav from "@/components/layout/BottomNav";
import MapView from "@/features/home/MapView";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import MonthlyMenuEvent from "@/features/monthly-menu/MonthlyMenuEvent";

function WelcomeToast() {
  const searchParams = useSearchParams();
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      showToast("환영합니다 🎉");
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      window.history.replaceState({}, "", url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Toast message={toast.message} visible={toast.visible} />;
}

// 비로그인 사용자는 지도/랭킹을 둘러볼 수 있어야 하므로 로그인 강제 없이
// 통과시키고, 로그인된 유저의 프로필 완성 여부만 확인한다.
function ProfileGuard() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.nickname) router.replace("/auth/signout?error=auth_failed");
    });
  }, [router]);

  return null;
}

export default function HomePage() {
  return (
    <PageContainer className="home-page-container">
      <Suspense>
        <WelcomeToast />
      </Suspense>
      <ProfileGuard />
      <MonthlyMenuEvent autoOpen />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MapView />
      </div>
      <BottomNav />
    </PageContainer>
  );
}
