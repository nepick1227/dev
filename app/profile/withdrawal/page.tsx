"use client";

import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import WithdrawalView from "@/features/profile/WithdrawalView";

export default function WithdrawalPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <Header title="탈퇴하기" showBack onBack={() => router.back()} />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <WithdrawalView />
      </div>
    </PageContainer>
  );
}
