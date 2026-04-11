"use client";

import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import PermissionsView from "@/features/profile/PermissionsView";

export default function PermissionsPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <Header title="권한 및 알림 설정" showBack onBack={() => router.back()} />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <PermissionsView />
      </div>
    </PageContainer>
  );
}
