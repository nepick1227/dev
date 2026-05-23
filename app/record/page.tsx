"use client";

import { useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import RecordForm from "@/features/record/RecordForm";
import Spinner from "@/components/ui/Spinner";
import type { KakaoPlace } from "@/features/record/StoreSearch";

function RecordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasContentRef = useRef(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // 지도 가게카드 기록+ 버튼으로 진입 시 가게 자동 선택
  const kakaoId = searchParams.get("kakao_id");
  const rawX = searchParams.get("x") ?? "";
  const rawY = searchParams.get("y") ?? "";
  const validCoords = !isNaN(parseFloat(rawX)) && !isNaN(parseFloat(rawY)) && rawX !== "" && rawY !== "";
  const initialPlace: KakaoPlace | null = kakaoId && validCoords
    ? {
        id: kakaoId,
        place_name: searchParams.get("place_name") ?? "",
        category_name: "",
        category_group_code: searchParams.get("category_group_code") ?? "",
        address_name: searchParams.get("address_name") ?? "",
        road_address_name: searchParams.get("road_address_name") ?? "",
        phone: searchParams.get("phone") ?? "",
        x: rawX,
        y: rawY,
      }
    : null;

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
            <Button variant="secondary" fullWidth onClick={() => setShowLeaveModal(false)}>
              계속 작성
            </Button>
            <Button fullWidth onClick={() => router.back()}>
              나가기
            </Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed text-text-secondary">
          작성 중인 내용은 저장되지 않습니다.
        </p>
      </Modal>

      <Header title="기록 추가" showBack onBack={handleBack} noBorder />
      <div className="flex flex-1 flex-col overflow-hidden">
        <RecordForm onContentChange={handleContentChange} initialPlace={initialPlace} />
      </div>
    </PageContainer>
  );
}

export default function RecordPage() {
  return (
    <Suspense fallback={<div className="flex h-dvh items-center justify-center"><Spinner size={28} /></div>}>
      <RecordPageContent />
    </Suspense>
  );
}
