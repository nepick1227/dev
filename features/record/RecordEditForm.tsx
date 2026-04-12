"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { MapPinIcon, CameraIcon, CloseIcon } from "@/components/ui/icons";
import { validateImageFile, validateComment } from "@/utils/validation";
import { recommendationColors, recommendationLabels, recommendationEmojis, type RecommendationType } from "@/styles/tokens";
import type { RecordWithStore } from "@/types/database";

interface RecordEditFormProps {
  record: RecordWithStore;
}

/**
 * 기록 수정 폼 컴포넌트
 * 가게 정보는 수정 불가, 방문일시/추천도/코멘트/이미지만 수정 가능
 */
export default function RecordEditForm({ record }: RecordEditFormProps) {
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [visitedAt, setVisitedAt] = useState(() => record.visited_at.split("T")[0]);
  const [visitedTime, setVisitedTime] = useState(() => {
    const d = new Date(record.visited_at);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  });
  const [recommendation, setRecommendation] = useState<RecommendationType>(
    record.recommendation
  );
  const [comment, setComment] = useState(record.comment);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 이미지 미리보기 URL
  const previewUrl = useMemo(() => {
    if (newImageFile) return URL.createObjectURL(newImageFile);
    if (removeImage) return null;
    return record.image_url;
  }, [newImageFile, removeImage, record.image_url]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const commentError = comment.length > 0 ? validateComment(comment).message : "";
  const canSubmit = validateComment(comment).isValid && !isSubmitting;

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
    setNewImageFile(null);
    setRemoveImage(true);
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

        const { data: urlData } = supabase.storage
          .from("record-images")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      } else if (removeImage) {
        imageUrl = null;
      }

      const { error } = await supabase
        .from("records")
        .update({
          visited_at: new Date(`${visitedAt}T${visitedTime}`).toISOString(),
          recommendation,
          comment,
          image_url: imageUrl,
        })
        .eq("id", record.id)
        .eq("user_id", user.id);

      if (error) throw error;

      showToast("수정이 완료되었습니다");
      setTimeout(() => router.push("/mypick"), 800);
    } catch {
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
    router,
    showToast,
  ]);

  const recommendationOptions: RecommendationType[] = ["recommend", "neutral", "not_recommend"];

  return (
    <>
      <Toast message={toast.message} visible={toast.visible} />

      <div className="hide-scrollbar flex-1 overflow-y-auto px-5 pb-32 pt-6">
        {/* 가게 정보 (read-only) */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-bg p-4">
          <MapPinIcon size={18} color="#D32F2F" className="shrink-0" />
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
            방문 일시
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="flex-3 min-w-0 rounded-xl border-[1.5px] border-border bg-white px-4 py-3.5 text-[15px] tracking-tight text-text-primary outline-none transition-colors focus:border-primary"
            />
            <input
              type="time"
              value={visitedTime}
              onChange={(e) => setVisitedTime(e.target.value)}
              className="flex-2 min-w-0 rounded-xl border-[1.5px] border-border bg-white px-4 py-3.5 text-[15px] tracking-tight text-text-primary outline-none transition-colors focus:border-primary"
            />
          </div>
        </section>

        {/* 추천도 */}
        <section className="mb-6">
          <p className="mb-2.5 text-[14px] font-semibold tracking-tight text-text-primary">
            추천도
          </p>
          <div className="flex gap-3">
            {recommendationOptions.map((opt) => {
              const isSelected = recommendation === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setRecommendation(opt)}
                  className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border-[1.5px] py-3.5 transition-all duration-200"
                  style={{
                    borderColor: isSelected ? recommendationColors[opt] : "#E5E7EB",
                    background: isSelected ? `${recommendationColors[opt]}22` : "#F9FAFB",
                  }}
                >
                  <span className="text-[22px]">{recommendationEmojis[opt]}</span>
                  <span
                    className="text-[12px] font-semibold tracking-tight"
                    style={{ color: isSelected ? recommendationColors[opt] : "#9CA3AF" }}
                  >
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
          <textarea
            value={comment}
            onChange={(e) => {
              if (e.target.value.length <= 500) setComment(e.target.value);
            }}
            placeholder="이 맛집에 대한 솔직한 이야기를 남겨 주세요"
            rows={4}
            className="w-full resize-none rounded-xl border-[1.5px] border-border bg-white px-4 py-3.5 text-[15px] leading-relaxed tracking-tight text-text-primary outline-none transition-colors focus:border-primary"
          />
          <div className="mt-1.5 flex items-center justify-between px-1">
            <span className="text-[12px] text-primary">{commentError}</span>
            <span className={`text-[12px] ${comment.length >= 500 ? "text-primary" : "text-text-secondary"}`}>
              {comment.length}/500
            </span>
          </div>
        </section>

        {/* 이미지 */}
        <section className="mb-6">
          <label className="mb-2 block text-[14px] font-semibold tracking-tight text-text-primary">
            사진{" "}
            <span className="text-[12px] font-normal text-text-secondary">선택</span>
          </label>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={handleImageChange}
            className="hidden"
          />

          {previewUrl ? (
            <div className="relative w-full overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="이미지 미리보기"
                className="aspect-video w-full object-cover"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50"
                aria-label="이미지 제거"
              >
                <CloseIcon size={14} color="#fff" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-border py-8 transition-colors active:bg-bg"
            >
              <CameraIcon size={28} color="#9CA3AF" />
              <span className="text-[13px] tracking-tight text-text-secondary">
                사진을 추가해 보세요
              </span>
              <span className="text-[11px] text-text-secondary opacity-70">
                JPG, PNG, WebP, HEIC · 최대 5MB
              </span>
            </button>
          )}
        </section>
      </div>

      {/* 저장 버튼 */}
      <div className="fixed bottom-0 left-1/2 w-full max-w-107.5 -translate-x-1/2 border-t border-border bg-white px-5 pb-9 pt-3">
        <Button fullWidth isLoading={isSubmitting} disabled={!canSubmit} onClick={handleSubmit}>
          수정 완료
        </Button>
      </div>
    </>
  );
}
