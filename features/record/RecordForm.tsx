"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import StoreSearch, { type KakaoPlace } from "./StoreSearch";
import ImageUpload from "./ImageUpload";
import { MapPinIcon, CloseIcon } from "@/components/ui/icons";
import { parseKakaoCategory } from "@/utils/format";
import { validateComment } from "@/utils/validation";
import {
  recommendationLabels,
  recommendationEmojis,
  type RecommendationType,
} from "@/styles/tokens";
import type { StoreInsert, RecordInsert } from "@/types/database";

interface RecordFormProps {
  onContentChange?: (hasContent: boolean) => void;
}

/**
 * 맛집 기록 폼 컴포넌트
 */
export default function RecordForm({ onContentChange }: RecordFormProps) {
  const router = useRouter();
  const { toast, showToast } = useToast();

  // 선택된 가게
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);

  // 기록 폼 상태
  const [visitedAt, setVisitedAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [visitedTime, setVisitedTime] = useState(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(Math.floor(now.getMinutes() / 10) * 10).padStart(2, "0");
    return `${h}:${m}`;
  });
  const [recommendation, setRecommendation] = useState<RecommendationType>("recommend");
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasContent = selectedPlace !== null || comment.trim().length > 0 || imageFile !== null;

  useEffect(() => {
    onContentChange?.(hasContent);
  }, [hasContent, onContentChange]);

  const commentError =
    comment.length > 0 ? validateComment(comment).message : "";
  const canSubmit =
    selectedPlace !== null &&
    validateComment(comment).isValid &&
    !isSubmitting;

  const handlePlaceSelect = useCallback((place: KakaoPlace) => {
    setSelectedPlace(place);
  }, []);

  const handleClearPlace = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedPlace || !recommendation || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      // 1. 이미지 업로드
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("record-images")
          .upload(filePath, imageFile, { upsert: false });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("record-images")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      // 2. 가게 upsert (kakao_id 기준)
      const storeData: StoreInsert = {
        kakao_id: selectedPlace.id,
        name: selectedPlace.place_name,
        category: parseKakaoCategory(selectedPlace.category_group_code),
        address: selectedPlace.address_name,
        road_address: selectedPlace.road_address_name || null,
        lat: parseFloat(selectedPlace.y),
        lng: parseFloat(selectedPlace.x),
        phone: selectedPlace.phone || null,
      };

      const { data: storeResult, error: storeError } = await supabase
        .from("stores")
        .upsert(storeData, { onConflict: "kakao_id" })
        .select("id")
        .single();
      if (storeError) throw storeError;

      // 3. 기록 저장
      const recordData: RecordInsert = {
        user_id: user.id,
        store_id: storeResult.id,
        visited_at: new Date(`${visitedAt}T${visitedTime}`).toISOString(),
        recommendation,
        comment,
        image_url: imageUrl,
      };

      const { error: recordError } = await supabase.from("records").insert(recordData);
      if (recordError) throw recordError;

      showToast("기록이 저장되었습니다 🎉");
      setTimeout(() => router.push("/mypick"), 800);
    } catch {
      showToast("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedPlace,
    recommendation,
    comment,
    visitedAt,
    visitedTime,
    imageFile,
    isSubmitting,
    router,
    showToast,
  ]);

  const recommendationOptions: RecommendationType[] = ["recommend", "neutral", "not_recommend"];

  return (
    <>
      <Toast message={toast.message} visible={toast.visible} />

      <div className="hide-scrollbar flex-1 overflow-y-auto px-5 pb-32">
        {/* 가게 선택 */}
        <section className="mb-6">
          <p className="mb-2 text-[14px] font-semibold tracking-tight text-text-primary">
            맛집 이름
            <span className="ml-1 text-[12px] font-medium text-primary">*필수</span>
          </p>

          {selectedPlace ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-bg p-4">
              <MapPinIcon size={18} color="#D32F2F" className="shrink-0" />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-[15px] font-semibold tracking-tight text-text-primary">
                  {selectedPlace.place_name}
                </p>
                <p className="truncate text-[12px] tracking-tight text-text-secondary">
                  {selectedPlace.road_address_name || selectedPlace.address_name}
                </p>
              </div>
              <button
                onClick={handleClearPlace}
                className="shrink-0"
                aria-label="가게 선택 취소"
              >
                <CloseIcon size={18} color="#9CA3AF" />
              </button>
            </div>
          ) : (
            <StoreSearch onSelect={handlePlaceSelect} />
          )}
        </section>

        {/* 방문 일시 */}
        <section className="mb-6">
          <label className="mb-2 block text-[14px] font-semibold tracking-tight text-text-primary">
            방문일시
            <span className="ml-1 text-[12px] font-medium text-primary">*필수</span>
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
              step="600"
              className="flex-2 min-w-0 rounded-xl border-[1.5px] border-border bg-white px-4 py-3.5 text-[15px] tracking-tight text-text-primary outline-none transition-colors focus:border-primary"
            />
          </div>
        </section>

        {/* 추천 여부 */}
        <section className="mb-6">
          <p className="mb-2.5 text-[14px] font-semibold tracking-tight text-text-primary">
            추천 여부
            <span className="ml-1 text-[12px] font-medium text-primary">*필수</span>
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
                    borderColor: isSelected ? "#D32F2F" : "#E5E7EB",
                    background: isSelected ? "#D32F2F22" : "#F9FAFB",
                  }}
                >
                  <span className="text-[22px]">{recommendationEmojis[opt]}</span>
                  <span
                    className="text-[12px] font-semibold tracking-tight"
                    style={{
                      color: isSelected ? "#D32F2F" : "#9CA3AF",
                    }}
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
            <span className="ml-1 text-[12px] font-medium text-primary">*필수</span>
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
            <span className="text-[12px] text-primary">
              {commentError}
            </span>
            <span
              className="text-[12px]"
              style={{ color: comment.length >= 500 ? "#D32F2F" : "#6B7280" }}
            >
              {comment.length}/500
            </span>
          </div>
        </section>

        {/* 이미지 */}
        <section className="mb-6">
          <ImageUpload
            value={imageFile}
            onChange={setImageFile}
            onError={showToast}
          />
        </section>
      </div>

      {/* 저장 버튼 */}
      <div className="fixed bottom-0 left-1/2 w-full max-w-107.5 -translate-x-1/2 border-t border-border bg-white px-5 pb-9 pt-3">
        <Button
          fullWidth
          isLoading={isSubmitting}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          저장하기
        </Button>
      </div>
    </>
  );
}
