"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pushGtmEvent } from "@/lib/analytics/gtm";
import { useSignedImageUrl } from "@/hooks/use-signed-image-url";
import { getStorageImagePath } from "@/lib/supabase/storage";
import { formatTime } from "@/utils/format";
import { CopyIcon, ShareIcon, EditIcon, TrashIcon, ChevronDownIcon, CafeIcon, RestaurantIcon } from "@/components/ui/icons";
import { RecommendationBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { RecordWithStore } from "@/types/database";

interface RecordCardProps {
  record: RecordWithStore;
  isLast?: boolean;
  onShowToast?: (message: string) => void;
  onDelete?: () => void;
  onEdit?: (recordId: number) => void;
  compact?: boolean;
  imagePriority?: boolean;
}

export default function RecordCard({
  record,
  isLast = false,
  onShowToast,
  onDelete,
  onEdit,
  compact = false,
  imagePriority = false,
}: RecordCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const recordImageUrl = useSignedImageUrl("record-images", record.image_url);
  const hasRecordImage = Boolean(record.image_url?.trim());
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const isImageLoaded = Boolean(recordImageUrl && loadedImageUrl === recordImageUrl);
  // ⋮ 메뉴를 body로 포털해 타임라인 overflow 클리핑 회피. 하단이면 위로 플립.
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; up: boolean } | null>(null);

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuOpen) { setMenuOpen(false); return; }
    const rect = menuBtnRef.current?.getBoundingClientRect();
    if (rect) {
      const MENU_W = 144;
      const MENU_H = 200;
      const up = window.innerHeight - rect.bottom < MENU_H + 12;
      setMenuPos({
        left: rect.right - MENU_W,
        top: up ? rect.top - 4 : rect.bottom + 4,
        up,
      });
    }
    setMenuOpen(true);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const opts = { capture: true } as const;
    window.addEventListener("scroll", close, opts);
    window.addEventListener("wheel", close, opts);
    window.addEventListener("touchmove", close, opts);
    return () => {
      window.removeEventListener("scroll", close, opts);
      window.removeEventListener("wheel", close, opts);
      window.removeEventListener("touchmove", close, opts);
    };
  }, [menuOpen]);

  const address = record.stores.road_address || record.stores.address;
  const commentOverflow = record.comment.length > 60 || record.comment.split("\n").length > 2;

  const handleCopyAddress = useCallback(async () => {
    setMenuOpen(false);
    try {
      await navigator.clipboard.writeText(address);
      onShowToast?.("주소가 복사되었어요");
    } catch {
      onShowToast?.("복사에 실패했어요");
    }
  }, [address, onShowToast]);

  const handleShare = useCallback(async () => {
    setMenuOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({ title: record.stores.name, text: `${record.stores.name}\n${address}` });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(address);
        onShowToast?.("주소가 복사되었어요");
      } catch {
        onShowToast?.("복사에 실패했어요");
      }
    }
  }, [record.stores.name, address, onShowToast]);

  const handleEdit = useCallback(() => {
    setMenuOpen(false);
    if (onEdit) {
      onEdit(record.id);
    } else {
      router.push(`/record/${record.id}/edit`);
    }
  }, [record.id, onEdit, router]);

  const handleDelete = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");

      const { error } = await supabase
        .from("records")
        .delete()
        .eq("id", record.id)
        .eq("user_id", user.id);
      if (error) throw error;

      // 기록 삭제 성공 후 고아가 될 이미지 정리 (실패해도 삭제 자체엔 영향 없음)
      const imagePath = getStorageImagePath(record.image_url, "record-images");
      if (imagePath) {
        const { error: rmError } = await supabase.storage.from("record-images").remove([imagePath]);
        if (rmError) console.error("[RecordCardImageCleanup]", rmError.message);
      }

      pushGtmEvent("record_delete");
      onDelete?.();
      onShowToast?.("기록을 삭제했어요");
    } catch (err) {
      console.error("[RecordCardDelete]", err instanceof Error ? err.message : "unknown error");
      onShowToast?.("삭제에 실패했어요");
    } finally {
      setConfirmDelete(false);
    }
  }, [record.id, record.image_url, onDelete, onShowToast]);

  return (
    <>
      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        variant="dialog"
        title="기록을 삭제하시겠어요?"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(false)}>취소</Button>
            <Button variant="danger" fullWidth onClick={handleDelete}>삭제</Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed text-text-secondary">삭제된 기록은 복구할 수 없습니다.</p>
      </Modal>

      <div className="flex gap-0">
        {/* 타임라인 세로선 + 카테고리 아이콘 + 시간 */}
        <div className={`flex shrink-0 flex-col items-center ${compact ? "w-10" : "w-11 md:w-10"}`}>
          <div className={[
            compact
              ? "flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border border-divider"
              : "flex h-10 w-10 items-center justify-center rounded-[12px] border border-divider md:h-[38px] md:w-[38px] md:rounded-[11px]",
            record.stores.category === "cafe" ? "bg-bg-soft" : "bg-primary-soft",
          ].join(" ")}>
            {record.stores.category === "cafe"
              ? <CafeIcon size={18} color="var(--color-text-body)" />
              : <RestaurantIcon size={18} color="var(--color-primary)" />
            }
          </div>
          <p className={`mt-1 text-center font-semibold leading-tight text-text-tertiary ${compact ? "text-[11.5px]" : "text-[12px]"}`}>
            {formatTime(record.visited_at)}
          </p>
          {!isLast && <div className={`mt-1 flex-1 bg-border ${compact ? "w-0.5" : "w-px"}`} />}
        </div>

        {/* 카드 내용 */}
        <div className={`min-w-0 flex-1 pl-3 ${isLast ? "pb-2" : "pb-[18px]"}`}>
          <div className="pt-0.5">
            {/* 가게명 + 추천 배지 + ⋮ 버튼 */}
            <div className={`flex items-center justify-between ${compact ? "h-6" : "h-7"}`}>
              <div className="flex min-w-0 items-center gap-2">
                <span className={`min-w-0 truncate font-bold text-text-primary ${compact ? "text-[14.5px]" : "text-[15.5px]"}`}>
                  {record.stores.name}
                </span>
                <RecommendationBadge type={record.recommendation} compact={compact} />
              </div>
              <div className="ml-1 shrink-0">
                <button
                  ref={menuBtnRef}
                  onClick={toggleMenu}
                  className={`-m-2 flex h-10 w-10 items-center justify-center transition-colors active:bg-bg ${compact ? "rounded-[7px]" : "rounded-full"}`}
                  aria-label="더보기"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="3" r="1.5" fill="var(--color-text-tertiary)" />
                    <circle cx="8" cy="8" r="1.5" fill="var(--color-text-tertiary)" />
                    <circle cx="8" cy="13" r="1.5" fill="var(--color-text-tertiary)" />
                  </svg>
                </button>
                {menuOpen && menuPos && createPortal(
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div
                      style={{
                        position: "fixed",
                        left: menuPos.left,
                        top: menuPos.top,
                        transform: menuPos.up ? "translateY(-100%)" : undefined,
                      }}
                      className="z-50 w-[150px] overflow-hidden rounded-[12px] bg-white p-1.5 shadow-[0_10px_26px_rgba(0,0,0,0.16)]">
                      <button onClick={handleEdit} className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-[13.5px] font-semibold text-text-body transition-colors active:bg-bg-soft">
                        <EditIcon size={18} color="var(--color-text-primary)" />
                        수정하기
                      </button>
                      <button onClick={handleCopyAddress} className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-[13.5px] font-semibold text-text-body transition-colors active:bg-bg-soft">
                        <CopyIcon size={18} color="var(--color-text-primary)" />
                        주소 복사
                      </button>
                      <button onClick={handleShare} className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-[13.5px] font-semibold text-text-body transition-colors active:bg-bg-soft">
                        <ShareIcon size={18} color="var(--color-text-primary)" />
                        공유하기
                      </button>
                      <div className="mx-3.5 h-px bg-border" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setConfirmDelete(true); }}
                        className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-[13.5px] font-semibold text-primary transition-colors active:bg-primary-soft"
                      >
                        <TrashIcon size={18} color="var(--color-primary)" />
                        삭제하기
                      </button>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>

            {/* 주소 */}
            <div className={`flex h-5 items-center ${compact ? "mt-[3px]" : "mt-1.5"}`}>
              <span className={`truncate font-semibold text-text-tertiary ${compact ? "text-[12px]" : "text-[12.5px]"}`}>
                {address.length > 28 ? address.slice(0, 28) + "…" : address}
              </span>
            </div>

            {/* 코멘트 + 이미지 */}
            <div className={`flex gap-2 ${compact ? "mt-[7px]" : "mt-3"}`}>
              <div className="min-w-0 flex-1">
                <div
                  className={`relative bg-bg-soft leading-[1.5] text-text-body whitespace-pre-wrap ${compact ? "rounded-[11px] px-3 py-2.5 text-[13px]" : "rounded-[12px] px-[13px] py-[11px] text-[13.5px]"} ${
                    !expanded && commentOverflow ? "min-h-12 max-h-16 overflow-hidden" : ""
                  } ${commentOverflow ? "pb-6" : ""} ${hasRecordImage ? "min-h-16" : ""}`}
                >
                  {record.comment}
                  {!expanded && commentOverflow && (
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-7 rounded-b-[12px] bg-linear-to-t from-bg-soft to-transparent" />
                  )}
                  {commentOverflow && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                      className="absolute bottom-1.5 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-bg-soft before:absolute before:-inset-2 before:content-['']"
                      aria-label={expanded ? "접기" : "더보기"}
                    >
                      <ChevronDownIcon
                        size={16}
                        color="var(--color-text-secondary)"
                        className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>
              </div>
              {hasRecordImage && (
                <div className="relative h-16 w-16 shrink-0 self-start overflow-hidden rounded-[10px] bg-bg-soft">
                  {!isImageLoaded && <div className="absolute inset-0 animate-pulse bg-border" />}
                  {recordImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={recordImageUrl}
                      alt={record.stores.name}
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
                      loading={imagePriority ? "eager" : "lazy"}
                      fetchPriority={imagePriority ? "high" : "auto"}
                      decoding="async"
                      onLoad={() => setLoadedImageUrl(recordImageUrl)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
