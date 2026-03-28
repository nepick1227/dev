"use client";

import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import RecordForm from "@/features/record/RecordForm";

export default function RecordPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <Header
        title="기록 추가"
        showBack
        onBack={() => router.back()}
      />
      <div className="flex flex-1 flex-col">
        <RecordForm />
      </div>
      <BottomNav />
    </PageContainer>
  );
}
