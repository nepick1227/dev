"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";

const REASONS = [
  "자주 사용하지 않아요",
  "원하는 기능이 없어요",
  "개인정보가 걱정돼요",
  "다른 서비스를 이용할 거예요",
  "기타",
];

export default function WithdrawalView() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [reason, setReason] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canProceed =
    reason !== null && (reason !== "기타" || customText.trim().length > 0);

  const handleOpenConfirm = useCallback(() => {
    setAgreed(false);
    setShowConfirm(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!agreed || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("인증 정보를 찾을 수 없습니다.");

      const withdrawalReason = reason === "기타" ? customText.trim() : reason;

      const { error } = await supabase
        .from("profiles")
        .update({
          deleted_at: new Date().toISOString(),
          withdrawal_reason: withdrawalReason,
        })
        .eq("id", user.id);

      if (error) throw error;

      // signOut은 done 페이지에서 처리 — 여기서 하면 auth 상태 변경 이벤트가 가로챔
      window.location.replace("/profile/withdrawal/done");
    } catch {
      showToast("탈퇴 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setIsSubmitting(false);
    }
  }, [agreed, isSubmitting, reason, customText, showToast]);

  return (
    <>
      <Toast message={toast.message} visible={toast.visible} />

      {/* 최종 확인 팝업 */}
      <Modal
        isOpen={showConfirm}
        onClose={() => { if (!isSubmitting) { setShowConfirm(false); router.push("/home"); } }}
        variant="dialog"
        title="정말 탈퇴하시겠어요?"
        footer={
          <div className="flex gap-2.5">
            <button
              onClick={() => { setShowConfirm(false); router.push("/home"); }}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-border py-3.5 text-[15px] font-semibold text-text-secondary disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={!agreed || isSubmitting}
              className={`flex-1 rounded-xl py-3.5 text-[15px] font-semibold text-white transition-colors ${
                agreed && !isSubmitting ? "bg-primary" : "bg-border"
              }`}
            >
              {isSubmitting ? "처리 중..." : "확인"}
            </button>
          </div>
        }
      >
        {/* 주의사항 박스 */}
        <div className="mb-4 rounded-xl bg-bg px-4 py-3.5">
          <p className="text-left text-[13px] leading-relaxed tracking-tight text-text-secondary">
            탈퇴 시 동일 계정으로 30일 이내 재가입이 불가하며, 계정 및 모든 데이터는 복구되지 않습니다.
          </p>
        </div>

        {/* 동의 체크박스 */}
        <button
          type="button"
          onClick={() => setAgreed((prev) => !prev)}
          className="flex items-center gap-2.5"
        >
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors ${
              agreed ? "bg-primary" : "border-2 border-border bg-white"
            }`}
          >
            {agreed && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-[13px] tracking-tight text-text-primary">
            위 내용을 확인하였습니다.
          </span>
        </button>
      </Modal>

      {/* 탈퇴 사유 선택 */}
      <div className="flex flex-1 flex-col px-5 pt-6 pb-32">
        <h2 className="mb-1.5 text-[18px] font-bold tracking-tight text-text-primary">
          탈퇴 사유를 알려주세요
        </h2>
        <p className="mb-6 text-[13px] tracking-tight text-text-secondary">
          소중한 의견을 담아 더 나은 네픽을 만들겠습니다.
        </p>

        <div className="flex flex-col gap-2.5">
          {REASONS.map((r) => (
            <ReasonOption
              key={r}
              label={r}
              selected={reason === r}
              onClick={() => setReason(r)}
            />
          ))}
        </div>

        {reason === "기타" && (
          <div className="mt-3">
            <textarea
              value={customText}
              onChange={(e) => { if (e.target.value.length <= 500) setCustomText(e.target.value); }}
              placeholder="탈퇴 사유를 입력해 주세요"
              rows={3}
              className="w-full resize-none rounded-xl border-[1.5px] border-border bg-white px-4 py-3.5 text-[14px] leading-relaxed tracking-tight text-text-primary outline-none transition-colors focus:border-primary"
            />
            <div className="mt-1.5 flex justify-end px-1">
              <span className="text-[12px]" style={{ color: customText.length >= 500 ? "#D32F2F" : "#6B7280" }}>
                {customText.length}/500
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-1/2 flex w-full max-w-107.5 -translate-x-1/2 gap-2.5 border-t border-border bg-white px-5 pb-9 pt-3">
        <button
          onClick={() => router.push("/home")}
          className="flex-1 rounded-xl border border-border py-4 text-[15px] font-semibold text-text-secondary"
        >
          이전
        </button>
        <button
          onClick={handleOpenConfirm}
          disabled={!canProceed}
          className={`flex-1 rounded-xl py-4 text-[15px] font-bold text-white transition-colors ${
            canProceed ? "bg-primary" : "bg-border"
          }`}
        >
          탈퇴하기
        </button>
      </div>
    </>
  );
}

// ── 탈퇴 사유 라디오 옵션 ─────────────────────────────────

function ReasonOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border-[1.5px] px-4 py-3.5 text-left transition-colors ${
        selected ? "border-primary/30 bg-primary/5" : "border-border bg-bg"
      }`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? "border-primary" : "border-border"
        }`}
      >
        {selected && (
          <div className="h-2.5 w-2.5 rounded-full bg-primary opacity-70" />
        )}
      </div>
      <span className={`text-[14px] tracking-tight ${selected ? "font-semibold text-text-primary" : "text-text-primary"}`}>
        {label}
      </span>
    </button>
  );
}
