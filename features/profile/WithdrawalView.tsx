"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pushGtmEvent } from "@/lib/analytics/gtm";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";

const REASONS = [
  "자주 사용하지 않아요",
  "원하는 기능이 없어요",
  "개인정보가 걱정돼요",
  "다른 서비스를 이용할 거예요",
  "기타",
];

interface WithdrawalViewProps {
  onCancel?: () => void;
  /** "fixed"(기본, 모바일 페이지) | "contained"(데스크탑 패널 — in-flow) */
  actionPlacement?: "fixed" | "contained";
}

export default function WithdrawalView({ onCancel, actionPlacement = "fixed" }: WithdrawalViewProps) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [reason, setReason] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canProceed =
    reason !== null && (reason !== "기타" || customText.trim().length > 0);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
      return;
    }
    router.push("/home");
  }, [onCancel, router]);

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

      pushGtmEvent("withdrawal_complete", { reason });

      // signOut은 done 페이지에서 처리 — 여기서 하면 auth 상태 변경 이벤트가 가로챔
      window.location.replace("/profile/withdrawal/done");
    } catch (err) {
      console.error("[Withdrawal]", err instanceof Error ? err.message : "unknown error");
      showToast("탈퇴 처리 중 오류가 발생했어요. 다시 시도해 주세요.");
      setIsSubmitting(false);
    }
  }, [agreed, isSubmitting, reason, customText, showToast]);

  return (
    <>
      <Toast message={toast.message} visible={toast.visible} />

      {/* 최종 확인 팝업 */}
      <Modal
        isOpen={showConfirm}
        onClose={() => { if (!isSubmitting) setShowConfirm(false); }}
        variant="dialog"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" fullWidth onClick={() => setShowConfirm(false)} disabled={isSubmitting}>
              취소
            </Button>
            <Button fullWidth onClick={handleConfirm} disabled={!agreed || isSubmitting} isLoading={isSubmitting}>
              탈퇴하기
            </Button>
          </div>
        }
      >
        <div className="text-[34px] leading-none">😢</div>
        <h2 className="mt-[14px] text-[17px] font-[800] text-text-primary">
          정말 탈퇴하시겠어요?
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.6] text-text-description">
          탈퇴 시 동일 계정으로 30일 이내 재가입이 불가하며, 계정 및 모든 데이터는 복구되지 않습니다.
        </p>

        {/* 동의 체크박스 */}
        <button
          type="button"
          onClick={() => setAgreed((prev) => !prev)}
          className="mt-[18px] flex w-full items-center gap-[9px] rounded-[12px] bg-bg-soft px-[14px] py-3 text-left"
        >
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors ${
              agreed ? "bg-primary" : "border-2 border-border bg-surface"
            }`}
          >
            {agreed && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-[13.5px] font-semibold text-text-body">
            위 내용을 확인하였습니다.
          </span>
        </button>
      </Modal>

      {/* 탈퇴 사유 선택 */}
      <div className={`app-content-narrow flex flex-1 flex-col px-5 pb-32 pt-6 md:mt-0 md:!max-w-[432px] md:flex-none md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0 ${actionPlacement === "contained" ? "md:!max-w-none md:px-5 md:pt-6" : ""}`}>
        <h2 className="mb-1.5 text-[18px] font-[800] text-text-primary">
          탈퇴 사유를 알려주세요
        </h2>
        <p className="mb-6 text-[13px] text-text-description">
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
            <Textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="탈퇴 사유를 입력해 주세요"
              rows={3}
              maxLength={500}
              currentLength={customText.length}
            />
          </div>
        )}

        {actionPlacement === "fixed" && (
          <div className="hidden pt-6 md:block">
            <Button variant="danger" fullWidth onClick={handleOpenConfirm} disabled={!canProceed}>
              탈퇴하기
            </Button>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div
        className={[
          "app-fixed-bar safe-area-pb-lg flex gap-2.5 border-t border-border bg-surface px-5 pt-3",
          actionPlacement === "fixed"
            ? "fixed bottom-0 left-1/2 -translate-x-1/2 md:hidden"
            : "relative shrink-0",
        ].join(" ")}
      >
        {actionPlacement === "contained" && (
          <Button variant="secondary" fullWidth onClick={handleCancel}>
            이전
          </Button>
        )}
        <Button variant="danger" fullWidth onClick={handleOpenConfirm} disabled={!canProceed}>
          탈퇴하기
        </Button>
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
      className={`flex h-[50px] w-full items-center gap-[11px] rounded-[13px] border-[1.5px] px-4 text-left text-[14.5px] transition-colors ${
        selected ? "border-primary bg-primary-soft" : "border-border bg-surface"
      }`}
    >
      <div
        className={`h-[18px] w-[18px] shrink-0 rounded-full border-[1.5px] transition-colors ${
          selected
            ? "border-primary bg-primary shadow-[inset_0_0_0_3px_#fff]"
            : "border-[#D8DADE] bg-transparent"
        }`}
      />
      <span className={selected ? "font-bold text-primary" : "font-semibold text-text-body"}>
        {label}
      </span>
    </button>
  );
}
