"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import RecordEditForm from "@/features/record/RecordEditForm";
import Spinner from "@/components/ui/Spinner";
import type { RecordWithStore } from "@/types/database";

export default function RecordEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [record, setRecord] = useState<RecordWithStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const hasChangesRef = useRef(false);

  const handleHasChanges = useCallback((hasChanges: boolean) => {
    hasChangesRef.current = hasChanges;
  }, []);

  const handleBack = useCallback(() => {
    if (hasChangesRef.current) {
      setShowLeaveModal(true);
    } else {
      router.back();
    }
  }, [router]);

  useEffect(() => {
    if (!id || isNaN(id)) {
      router.replace("/mypick");
      return;
    }

    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("records")
        .select("*, stores(*)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        router.replace("/mypick");
        return;
      }

      setRecord(data as RecordWithStore);
      setIsLoading(false);
    };

    load();
  }, [id, router]);

  return (
    <PageContainer>
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        variant="dialog"
        title="기록 수정을 그만두시겠어요?"
        footer={
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowLeaveModal(false)}
              className="flex-1 rounded-xl border border-border py-3.5 text-[15px] font-semibold text-text-secondary"
            >
              계속 수정
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
          수정 중인 내용은 저장되지 않습니다.
        </p>
      </Modal>

      <Header title="기록 수정" showBack onBack={handleBack} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size={28} />
          </div>
        ) : record ? (
          <RecordEditForm record={record} onHasChanges={handleHasChanges} />
        ) : null}
      </div>
    </PageContainer>
  );
}
