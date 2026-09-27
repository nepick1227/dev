"use client";

import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import WithdrawalView from "@/features/profile/WithdrawalView";

export default function WithdrawalPage() {
  const router = useRouter();

  return (
    <PageContainer className="settings-page">
      <div className="md:mx-auto md:w-full md:max-w-[480px]">
        <Header title="회원탈퇴" showBack onBack={() => router.back()} />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto bg-surface md:bg-transparent">
        <WithdrawalView />
      </div>
    </PageContainer>
  );
}
