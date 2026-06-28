"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSignedImageUrl } from "@/hooks/use-signed-image-url";
import Toast from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import { MapPinIcon, CameraIcon, TrashIcon, EditIcon } from "@/components/ui/icons";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";
import { validateImageFile, validateComment } from "@/utils/validation";
import { recommendationLabels, recommendationEmojis, type RecommendationType } from "@/styles/tokens";
import type { RecordWithStore } from "@/types/database";

const RECOMMENDATION_OPTIONS: RecommendationType[] = ["recommend", "neutral", "not_recommend"];

interface RecordEditFormProps {
  record: RecordWithStore;
  onHasChanges?: (hasChanges: boolean) => void;
  onSaved?: () => void;
}

/**
 * 기록 수정 폼 컴포넌트
 * 가게 정보는 수정 불가, 방문일시/추천도/코멘트/이미지만 수정 가능
 */
export default function RecordEditForm({ record, onHasChanges, onSaved }: RecordEditFormProps) {
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [visitedAt, setVisitedAt] = useState(() => record.visited_at.split("T")[0]);
  const [visitedTime, setVisitedTime] = useState(() => {
    const d = new Date(record.visited_at);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  });
  const [recommendation, setRecommendation] = useState<RecommendationType>(record.recommendation);
  const [comment, setComment] = useState(record.comment);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageDeleteModal, setShowImageDeleteModal] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const signedRecordImageUrl = useSignedImageUrl(
    "record-images",
    newImageFile || removeImage ? null : record.image_url
  );

  const previewUrl = useMemo(() => {
    if (newImageFile) return URL.createObjectURL(newImageFile);
    if (removeImage) return null;
    return signedRecordImageUrl;
  }, [newImageFile, removeImage, signedRecordImageUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const [originalVisitedTime] = useState(() => {
    const d = new Date(record.visited_at);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });

  const hasChanges =
    visitedAt !== record.visited_at.split("T")[0] ||
    visitedTime !== originalVisitedTime ||
    recommendation !== record.recommendation ||
    comment !== record.comment ||
    newImageFile !== null ||
    removeImage;

  useEffect(() => {
    onHasChanges?.(hasChanges);
  }, [hasChanges, onHasChanges]);

  const commentError = comment.length > 0 ? validateComment(comment).message : "";
  const canSubmit = validateComment(comment).isValid && !isSubmitting && !isDeleting && hasChanges;

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const result = validateImageFile(file);
      if (!result.isValid) {
        showToast(result.message);
        return;
      }
      setNewImageFile(file);
      setRemoveImage(false);
      e.target.value = "";
    },
    [showToast]
  );

  const handleRemoveImage = useCallback(() => {
    if (newImageFile) {
      setNewImageFile(null);
    } else {
      setShowImageDeleteModal(true);
    }
  }, [newImageFile]);

  const handleConfirmImageDelete = useCallback(() => {
    setRemoveImage(true);
    setShowImageDeleteModal(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      let imageUrl: string | null = record.image_url;

      if (newImageFile) {
        const ext = newImageFile.name.split(".").pop() ?? "jpg";
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("record-images")
          .upload(filePath, newImageFile, { upsert: false });
        if (uploadError) throw uploadError;

        imageUrl = filePath;
      } else if (removeImage) {
        imageUrl = null;
      }

      const { error } = await supabase
        .from("records")
        .update({
          visited_at: new Date(`${visitedAt}T${visitedTime}:00`).toISOString(),
          recommendation,
          comment,
          image_url: imageUrl,
        })
        .eq("id", record.id)
        .eq("user_id", user.id);

      if (error) throw error;

      showToast("기록을 수정했어요!");
      setTimeout(() => {
        if (onSaved) {
          onSaved();
        } else {
          router.push("/mypick");
        }
      }, 800);
    } catch (err) {
      console.error("[RecordEdit]", err);
      showToast("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canSubmit,
    visitedAt,
    visitedTime,
    recommendation,
    comment,
    newImageFile,
    removeImage,
    record.id,
    record.image_url,
    onSaved,
    router,
    showToast,
  ]);

  const handleDelete = useCallback(async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error();

      const { error } = await supabase
        .from("records")
        .delete()
        .eq("id", record.id)
        .eq("user_id", user.id);

      if (error) throw error;

      showToast("기록이 삭제되었습니다");
      setTimeout(() => {
        if (onSaved) {
          onSaved();
        } else {
          router.push("/mypick");
        }
      }, 800);
    } catch (err) {
      console.error("[RecordDelete]", err);
      showToast("삭제에 실패했습니다. 다시 시도해 주세요.");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }, [isDeleting, record.id, onSaved, router, showToast]);

  return (
    <>
      <Toast message={toast.message} visible={toast.visible} />

      <Modal
        isOpen={showImageDeleteModal}
        onClose={() => setShowImageDeleteModal(false)}
        variant="dialog"
        title="사진을 삭제하시겠어요?"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" fullWidth onClick={() => setShowImageDeleteModal(false)}>취소</Button>
            <Button fullWidth onClick={handleConfirmImageDelete}>삭제</Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed text-text-secondary">저장 시 기존 사진이 삭제됩니다.</p>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        variant="dialog"
        title="기록을 삭제하시겠어요?"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" fullWidth onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
              취소
            </Button>
            <Button variant="danger" fullWidth onClick={handleDelete} isLoading={isDeleting} disabled={isDeleting}>
              삭제
            </Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed text-text-secondary">
          삭제된 기록은 복구할 수 없습니다.
        </p>
      </Modal>

      <div className="hide-scrollbar flex-1 overflow-y-auto pb-32">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          onChange={handleImageChange}
          className="hidden"
        />

        <div className="app-content-narrow px-5 pt-6">
          {/* 이미지 */}
          <section className="mb-6">
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="이미지 미리보기" className="h-52.5 w-full object-cover" />
                <div className="absolute right-3 top-3 flex flex-col gap-2">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-[0_2px_8px_rgba(17,24,39,0.10)] transition-colors"
                    aria-label="이미지 변경"
                  >
                    <EditIcon size={18} color="#374151" />
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-[0_2px_8px_rgba(17,24,39,0.10)] transition-colors"
                    aria-label="이미지 제거"
                  >
                    <TrashIcon size={18} color="#374151" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-border py-8 transition-colors active:bg-bg"
              >
                <CameraIcon size={28} color="var(--color-text-tertiary)" />
                <span className="text-[13px] tracking-tight text-text-secondary">사진을 추가해 보세요</span>
                <span className="text-[11px] text-text-secondary opacity-70">JPG, PNG, WebP, HEIC · 최대 5MB</span>
              </button>
            )}
          </section>

          {/* 가게 정보 (read-only) */}
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-bg p-4">
            <MapPinIcon size={18} color="var(--color-primary)" className="shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-[15px] font-semibold tracking-tight text-text-primary">
                {record.stores.name}
              </p>
              <p className="truncate text-[12px] tracking-tight text-text-secondary">
                {record.stores.road_address || record.stores.address}
              </p>
            </div>
          </div>

          {/* 방문 일시 */}
          <section className="mb-6">
            <label className="mb-2 block text-[14px] font-semibold tracking-tight text-text-primary">
              방문일시
            </label>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <DatePicker
                  value={visitedAt}
                  onChange={setVisitedAt}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex-1 min-w-0">
                <TimePicker value={visitedTime} onChange={setVisitedTime} />
              </div>
            </div>
          </section>

          {/* 추천 여부 */}
          <section className="mb-6">
            <p className="mb-2.5 text-[14px] font-semibold tracking-tight text-text-primary">
              내 입맛엔 어땠나요?
            </p>
            <div className="flex gap-3">
              {RECOMMENDATION_OPTIONS.map((opt) => {
                const isSelected = recommendation === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setRecommendation(opt)}
                    className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border-[1.5px] py-3.5 transition-all duration-200 ${
                      isSelected ? "border-primary/30 bg-primary/13" : "border-border bg-bg"
                    }`}
                  >
                    <span className="text-[22px]">{recommendationEmojis[opt]}</span>
                    <span className={`text-[12px] font-semibold tracking-tight ${isSelected ? "text-primary" : "text-text-secondary"}`}>
                      {recommendationLabels[opt]}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 코멘트 */}
          <section className="mb-6">
            <label className="mb-2 block text-[14px] font-semibold tracking-tight text-text-primary">
              코멘트
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="이 맛집에 대한 솔직한 이야기를 남겨 주세요"
              rows={4}
              maxLength={500}
              currentLength={comment.length}
              error={commentError || undefined}
            />
          </section>
        </div>
      </div>

      {/* 저장/삭제 버튼 */}
      <div className="app-fixed-bar safe-area-pb-lg fixed bottom-0 left-1/2 -translate-x-1/2 border-t border-border bg-surface px-5 pt-3">
        <div className="flex gap-2.5">
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isSubmitting || isDeleting}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-border bg-bg transition-colors active:bg-border disabled:opacity-50"
            aria-label="기록 삭제"
          >
            <TrashIcon size={20} color="var(--color-text-tertiary)" />
          </button>
          <div className="flex-1">
            <Button fullWidth isLoading={isSubmitting} disabled={!canSubmit} onClick={handleSubmit}>
              수정 완료
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
