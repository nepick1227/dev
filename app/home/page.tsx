"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import BottomNav from "@/components/layout/BottomNav";
import MapView from "@/features/home/MapView";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";

function WelcomeToast() {
  const searchParams = useSearchParams();
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      showToast("환영합니다 🎉");
      // URL에서 파라미터 제거
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      window.history.replaceState({}, "", url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Toast message={toast.message} visible={toast.visible} />;
}

export default function HomePage() {
  return (
    <PageContainer>
      <Suspense>
        <WelcomeToast />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <MapView />
      </div>
      <BottomNav />
    </PageContainer>
  );
}
