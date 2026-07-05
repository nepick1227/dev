"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSignedImageUrl } from "@/hooks/use-signed-image-url";
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
}

export default function RecordCard({
  record,
  isLast = false,
  onShowToast,
  onDelete,
  onEdit,
}: RecordCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const recordImageUrl = useSignedImageUrl("record-images", record.image_url);

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
      onShowToast?.("복사에 실패했습니다");
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
        onShowToast?.("복사에 실패했습니다");
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

      onDelete?.();
      onShowToast?.("기록이 삭제되었어요");
    } catch (err) {
      console.error("[RecordCardDelete]", err instanceof Error ? err.message : "unknown error");
      onShowToast?.("삭제에 실패했습니다");
    } finally {
      setConfirmDelete(false);
    }
  }, [record.id, onDelete, onShowToast]);

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
            <Button fullWidth onClick={handleDelete}>삭제</Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed text-text-secondary">삭제한 기록은 복구할 수 없습니다.</p>
      </Modal>

      <div className="flex gap-0">
        {/* 타임라인 세로선 + 카테고리 아이콘 + 시간 */}
        <div className="flex w-10 shrink-0 flex-col items-center">
          <div className={[
            "flex h-9 w-9 items-center justify-center rounded-full border border-border",
            record.stores.category === "cafe" ? "bg-orange-50" : "bg-violet-50",
          ].join(" ")}>
            {record.stores.category === "cafe"
              ? <CafeIcon size={18} color="#C2410C" />
              : <RestaurantIcon size={18} color="#8B5CF6" />
            }
          </div>
          <p className="mt-1 text-center text-[12px] font-medium leading-tight tracking-tight text-text-tertiary">
            {formatTime(record.visited_at)}
          </p>
          {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
        </div>

        {/* 카드 내용 */}
        <div className={`flex-1 pl-3 ${isLast ? "pb-2" : "pb-4"}`}>
          <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {/* 가게명 + 추천 배지 + ⋮ 버튼 */}
            <div className="flex h-7 items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 truncate text-[15px] font-bold tracking-tight text-text-primary">
                  {record.stores.name}
                </span>
                <RecommendationBadge type={record.recommendation} />
              </div>
              <div className="relative ml-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-colors active:bg-bg"
                  aria-label="더보기"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="3" r="1.5" fill="var(--color-text-tertiary)" />
                    <circle cx="8" cy="8" r="1.5" fill="var(--color-text-tertiary)" />
                    <circle cx="8" cy="13" r="1.5" fill="var(--color-text-tertiary)" />
                  </svg>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-2xl border border-border bg-white py-2 shadow-lg">
                      <button onClick={handleEdit} className="flex h-11 w-full items-center gap-2.5 px-3.5 text-[14px] tracking-tight text-text-primary transition-colors active:bg-bg">
                        <EditIcon size={18} color="var(--color-text-primary)" />
                        수정하기
                      </button>
                      <button onClick={handleCopyAddress} className="flex h-11 w-full items-center gap-2.5 px-3.5 text-[14px] tracking-tight text-text-primary transition-colors active:bg-bg">
                        <CopyIcon size={18} color="var(--color-text-primary)" />
                        주소 복사
                      </button>
                      <button onClick={handleShare} className="flex h-11 w-full items-center gap-2.5 px-3.5 text-[14px] tracking-tight text-text-primary transition-colors active:bg-bg">
                        <ShareIcon size={18} color="var(--color-text-primary)" />
                        공유하기
                      </button>
                      <div className="mx-3.5 h-px bg-border" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setConfirmDelete(true); }}
                        className="flex h-11 w-full items-center gap-2.5 px-3.5 text-[14px] tracking-tight text-primary transition-colors active:bg-primary-soft"
                      >
                        <TrashIcon size={18} color="var(--color-primary)" />
                        삭제하기
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 주소 */}
            <div className="mt-1.5 flex h-5 items-center">
              <span className="truncate text-[12px] tracking-tight text-text-secondary">
                {address.length > 28 ? address.slice(0, 28) + "…" : address}
              </span>
            </div>

            {/* 코멘트 + 이미지 */}
            <div className="mt-3 flex gap-2">
              <div className="min-w-0 flex-1">
                <div
                  className={`relative rounded-[13px] bg-gray-50 px-3.5 py-2.5 text-[13px] leading-relaxed tracking-tight text-text-primary whitespace-pre-wrap ${
                    !expanded && commentOverflow ? "min-h-12 max-h-16 overflow-hidden" : ""
                  } ${commentOverflow ? "pb-6" : ""}`}
                >
                  {record.comment}
                  {!expanded && commentOverflow && (
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-7 rounded-b-[13px] bg-linear-to-t from-gray-50 to-transparent" />
                  )}
                  {commentOverflow && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                      className="absolute bottom-1.5 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-50"
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
              {recordImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={recordImageUrl}
                  alt={record.stores.name}
                  className="h-16 w-16 shrink-0 self-start rounded-[10px] object-cover"
                  loading="lazy"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
