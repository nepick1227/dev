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

function ProfileGuard() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/auth/login"); return; }
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
