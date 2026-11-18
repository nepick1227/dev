"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Spinner from "@/components/ui/Spinner";
import { CloseIcon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import type { MonthlyMenuClaimResult, MonthlyMenuStatus } from "@/lib/monthly-menu";
import CloseConfirmModal from "./close-confirm-modal";
import CollagePreview from "./collage-preview";
import MenuEditView from "./menu-edit-view";
import MonthlyMenuFooter, { type MonthlyMenuStep } from "./monthly-menu-footer";
import MonthlyMenuLauncher from "./monthly-menu-launcher";
import RecordSelectionView from "./record-selection-view";
import { PHOTO_LOAD_ERROR, useMonthlyMenuCollage } from "./use-monthly-menu-collage";

interface MonthlyMenuEventProps {
  autoOpen?: boolean;
  showLauncher?: boolean;
}

export default function MonthlyMenuEvent({
  autoOpen = false,
  showLauncher = false,
}: MonthlyMenuEventProps) {
  const autoOpenHandled = useRef(false);
  const [status, setStatus] = useState<MonthlyMenuStatus | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<MonthlyMenuStep>("select");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [menus, setMenus] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

  const handleClaimed = useCallback((claim: MonthlyMenuClaimResult) => {
    setStatus((current) => current ? {
      ...current,
      remainingGenerations: claim.remainingGenerations,
      isUnlimited: claim.isUnlimited,
      canGenerate: claim.isUnlimited || claim.remainingGenerations > 0,
    } : current);
  }, []);
  const { collage, isBuilding, isSharing, build, reset, share } = useMonthlyMenuCollage(handleClaimed);

  const fetchStatus = useCallback(async () => {
    setIsStatusLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch("/api/monthly-menu", { cache: "no-store" });
      if (!response.ok) return;
      const nextStatus = await response.json() as MonthlyMenuStatus;
      setStatus(nextStatus);

      if (autoOpen && nextStatus.shouldAutoOpen && !autoOpenHandled.current) {
        autoOpenHandled.current = true;
        setIsOpen(true);
        void fetch("/api/monthly-menu", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "seen" }),
        });
      }
    } finally {
      setIsStatusLoading(false);
    }
  }, [autoOpen]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const selectedRecords = useMemo(() => {
    const byId = new Map(status?.records.map((record) => [record.id, record]));
    return selectedIds.flatMap((id) => byId.get(id) ?? []);
  }, [selectedIds, status]);

  const canGenerate = Boolean(status?.canGenerate);

  const startOver = useCallback(() => {
    reset();
    setStep("select");
    setSelectedIds([]);
    setMenus({});
    setError("");
  }, [reset]);

  const open = useCallback(() => {
    startOver();
    setIsOpen(true);
  }, [startOver]);

  const close = useCallback(() => {
    setIsCloseConfirmOpen(false);
    setIsOpen(false);
    setError("");
  }, []);

  /** 만든 메뉴판이 있으면 닫기 전에 다시 볼 수 없다고 확인한다 */
  const requestClose = useCallback(() => {
    if (isBuilding) return;
    if (collage) {
      setIsCloseConfirmOpen(true);
      return;
    }
    close();
  }, [close, collage, isBuilding]);

  const toggleRecord = useCallback((recordId: number) => {
    setError("");
    setSelectedIds((current) => {
      if (current.includes(recordId)) return current.filter((id) => id !== recordId);
      if (current.length >= 3) return current;
      return [...current, recordId];
    });
  }, []);

  const changeMenu = useCallback((recordId: number, menu: string) => {
    setMenus((current) => ({ ...current, [recordId]: menu }));
  }, []);

  const makeCollage = useCallback(async () => {
    if (!status || selectedRecords.length < 2) return;
    setError("");
    try {
      await build({
        title: status.collageTitle,
        items: selectedRecords.map((record) => ({ record, menu: menus[record.id] ?? "" })),
      });
      setStep("preview");
    } catch (buildError) {
      const message = buildError instanceof Error ? buildError.message : PHOTO_LOAD_ERROR;
      setError(message);
      // 사진 실패: signed URL(1시간) 만료일 수 있어 새 URL을 받아 둔다
      // 그 밖의 실패(횟수 초과 등): 화면의 남은 횟수를 서버 값으로 맞춘다
      void fetchStatus();
    }
  }, [build, fetchStatus, menus, selectedRecords, status]);

  if (!showLauncher && !isOpen) return null;

  return (
    <>
      {showLauncher && (
        <MonthlyMenuLauncher status={status} disabled={isStatusLoading} onOpen={open} />
      )}

      {/* PC에서는 내 픽 패널 안에서 렌더링되므로 body로 올려 패널 열고 닫기 버튼 등 지도 위 요소보다 위에 보이게 한다 */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(20,20,24,0.4)] p-4 md:bg-[rgba(20,20,24,0.45)]">
          <div className="relative flex max-h-[92dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-[20px] bg-surface shadow-[0_16px_40px_rgba(23,25,28,0.16)]">
            <header className="flex shrink-0 items-center border-b border-divider px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold text-primary">MONTHLY MENU</p>
                <h2 className="text-[20px] font-extrabold text-text-primary">
                  {status?.title ?? "지난달의 메뉴판"}
                </h2>
              </div>
              <button
                onClick={requestClose}
                className="ml-auto rounded-full p-2 hover:bg-bg"
                aria-label="닫기"
              >
                <CloseIcon size={20} color="var(--color-text-secondary)" />
              </button>
            </header>

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
              {isStatusLoading && !status ? (
                <div className="flex min-h-72 items-center justify-center">
                  <Spinner size={28} />
                </div>
              ) : !status ? (
                <p className="py-16 text-center text-[14px] text-text-secondary">
                  전월 기록을 불러오지 못했어요. 잠시 후 화면을 새로고침해 주세요.
                </p>
              ) : step === "preview" && collage ? (
                <CollagePreview imageUrl={collage.objectUrl} title={status.collageTitle} />
              ) : step === "edit" ? (
                <MenuEditView
                  records={selectedRecords}
                  menus={menus}
                  onMenuChange={changeMenu}
                />
              ) : (
                <RecordSelectionView status={status} selectedIds={selectedIds} onToggle={toggleRecord} />
              )}

              {error && (
                <p className="mt-4 rounded-xl bg-primary-soft px-4 py-3 text-[13px] text-primary">
                  {error}
                </p>
              )}
            </div>

            <MonthlyMenuFooter
              step={step}
              selectedCount={selectedIds.length}
              canMake={canGenerate}
              canStartOver={canGenerate}
              hasCollage={collage !== null}
              isBuilding={isBuilding}
              isSharing={isSharing}
              onNext={() => setStep("edit")}
              onBack={() => {
                setError("");
                setStep("select");
              }}
              onBackToPreview={() => {
                setError("");
                setStep("preview");
              }}
              onMake={() => void makeCollage()}
              onEditMenus={() => setStep("edit")}
              onStartOver={startOver}
              onShare={() => void share()}
            />
          </div>
          <CloseConfirmModal
            isOpen={isCloseConfirmOpen}
            onKeepViewing={() => setIsCloseConfirmOpen(false)}
            onClose={close}
          />
        </div>,
        document.body
      )}
    </>
  );
}
