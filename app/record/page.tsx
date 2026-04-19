"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import RecordForm from "@/features/record/RecordForm";

export default function RecordPage() {
  const router = useRouter();
  const hasContentRef = useRef(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleContentChange = useCallback((hasContent: boolean) => {
    hasContentRef.current = hasContent;
  }, []);

  const handleBack = useCallback(() => {
    if (hasContentRef.current) {
      setShowLeaveModal(true);
    } else {
      router.back();
    }
  }, [router]);

  return (
    <PageContainer>
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        variant="dialog"
        title="기록을 그만두시겠어요?"
        footer={
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowLeaveModal(false)}
              className="flex-1 rounded-xl border border-border py-3.5 text-[15px] font-semibold text-text-secondary"
            >
              계속 작성
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 rounded-xl bg-primary py-3.5 text-[15px] font-semibold text-white"
            >
              나가기
            </button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed text-text-secondary">
          작성 중인 내용은 저장되지 않습니다.
        </p>
      </Modal>

      <Header
        title="기록 추가"
        showBack
        onBack={handleBack}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <RecordForm onContentChange={handleContentChange} />
      </div>
    </PageContainer>
  );
}
