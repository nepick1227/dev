"use client";

import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import PermissionsView from "@/features/profile/PermissionsView";

export default function PermissionsPage() {
  const router = useRouter();

  return (
    <PageContainer className="settings-page">
      <div className="md:mx-auto md:w-full md:max-w-[560px]">
        <Header title="권한 및 알림 설정" showBack onBack={() => router.back()} />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto bg-surface md:bg-transparent">
        <PermissionsView />
      </div>
    </PageContainer>
  );
}
