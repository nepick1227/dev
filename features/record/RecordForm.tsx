"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import StoreSearch, { type KakaoPlace } from "./StoreSearch";
import ImageUpload from "./ImageUpload";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";
import { MapPinIcon, CloseIcon } from "@/components/ui/icons";
import { validateComment } from "@/utils/validation";
import {
  recommendationLabels,
  recommendationEmojis,
  type RecommendationType,
} from "@/styles/tokens";
import type { RecordInsert } from "@/types/database";

const RECOMMENDATION_OPTIONS: RecommendationType[] = ["recommend", "neutral", "not_recommend"];

interface RecordFormProps {
  onContentChange?: (hasContent: boolean) => void;
  initialPlace?: KakaoPlace | null;
  onSaved?: () => void;
  actionPlacement?: "fixed" | "contained";
}

async function resolveStoreId(place: KakaoPlace) {
  const response = await fetch("/api/stores/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kakaoId: place.id,
      query: place.place_name,
      x: place.x,
      y: place.y,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(data?.error ?? "가게 정보를 확인하지 못했습니다.");
  }

  const data = await response.json() as { storeId?: number };
  if (typeof data.storeId !== "number") {
    throw new Error("store_resolve_invalid_response");
  }

  return data.storeId;
}

function getRecordCreateErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("로그인이 필요")) {
    return "로그인이 필요합니다. 다시 로그인해 주세요.";
  }
  if (
    message.includes("가게") ||
    message.includes("장소") ||
    message.includes("카카오")
  ) {
    return message;
  }
  if (
    message.includes("record-images") ||
    message.includes("bucket") ||
    message.includes("storage") ||
    message.includes("mime") ||
    message.includes("size")
  ) {
    return "사진 업로드에 실패했습니다. 이미지 형식과 용량을 확인해 주세요.";
  }
  if (
    message.includes("row-level security") ||
    message.includes("violates") ||
    message.includes("permission")
  ) {
    return "기록 저장 권한을 확인하지 못했습니다. 다시 로그인해 주세요.";
  }

  return "저장에 실패했습니다. 다시 시도해 주세요.";
}

export default function RecordForm({
  onContentChange,
  initialPlace,
  onSaved,
  actionPlacement = "fixed",
}: RecordFormProps) {
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(initialPlace ?? null);
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

  const commentError = comment.length > 0 ? validateComment(comment).message : "";
  const canSubmit = selectedPlace !== null && validateComment(comment).isValid && !isSubmitting;

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      const storeId = await resolveStoreId(selectedPlace);

      let imagePath: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("record-images")
          .upload(filePath, imageFile, { upsert: false });
        if (uploadError) throw uploadError;

        imagePath = filePath;
      }

      // 가게 검증·이미지 업로드 사이 세션이 만료됐을 수 있어 저장 직전 사용자를 다시 확인한다.
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("로그인이 필요합니다");

      const recordData: RecordInsert = {
        user_id: currentUser.id,
        store_id: storeId,
        visited_at: new Date(`${visitedAt}T${visitedTime}:00`).toISOString(),
        recommendation,
        comment,
        image_url: imagePath,
      };

      const { error: recordError } = await supabase.from("records").insert(recordData);
      if (recordError) throw recordError;

      showToast("기록이 저장되었습니다 🎉");
      setTimeout(() => {
        if (onSaved) {
          onSaved();
        } else {
          router.push("/mypick");
        }
      }, 800);
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? err.code : undefined;
      console.error(
        "[RecordCreate]",
        err instanceof Error ? err.message : "unknown error",
        code ? `code=${code}` : ""
      );
      showToast(getRecordCreateErrorMessage(err));
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
    onSaved,
    router,
    showToast,
  ]);


  return (
    <>
      <Toast message={toast.message} visible={toast.visible} />

      <div className={`hide-scrollbar flex-1 overflow-y-auto ${actionPlacement === "fixed" ? "pb-32" : "pb-6"}`}>
        <div className="app-content-narrow px-5 pt-6">
          {/* 이미지 업로드 */}
          <section className="mb-6">
            <ImageUpload value={imageFile} onChange={setImageFile} onError={showToast} />
          </section>

          {/* 가게 선택 */}
          <section className="mb-6">
            <p className="mb-2 text-[14px] font-semibold tracking-tight text-text-primary">
              맛집 이름
              <span className="ml-1 text-[12px] font-medium text-primary">*필수</span>
            </p>

            {selectedPlace ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-bg p-4">
                <MapPinIcon size={18} color="var(--color-primary)" className="shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-[15px] font-semibold tracking-tight text-text-primary">
                    {selectedPlace.place_name}
                  </p>
                  <p className="truncate text-[12px] tracking-tight text-text-secondary">
                    {selectedPlace.road_address_name || selectedPlace.address_name}
                  </p>
                </div>
                <button onClick={handleClearPlace} className="shrink-0" aria-label="가게 선택 취소">
                  <CloseIcon size={18} color="var(--color-text-tertiary)" />
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
              <span className="ml-1 text-[12px] font-medium text-primary">*필수</span>
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
              <span className="ml-1 text-[12px] font-medium text-primary">*필수</span>
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

      {/* 저장 버튼 */}
      <div
        className={[
          "app-fixed-bar safe-area-pb-lg border-t border-border bg-surface px-5 pt-3",
          actionPlacement === "fixed"
            ? "fixed bottom-0 left-1/2 -translate-x-1/2"
            : "relative shrink-0",
        ].join(" ")}
      >
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
