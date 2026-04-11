"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { UserIcon, CameraIcon } from "@/components/ui/icons";
import { validateNickname, validateIntro, validateImageFile } from "@/utils/validation";
import type { Profile, ProfileUpdate } from "@/types/database";

interface ProfileEditFormProps {
  profile: Profile;
}

type NicknameStatus = "idle" | "checking" | "available" | "taken";

const GENDER_OPTIONS: { value: "male" | "female" | "unknown"; label: string }[] = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "unknown", label: "선택 안 함" },
];

export default function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── 기존 필드 ──────────────────────────────────────────
  const [nickname, setNickname] = useState(profile.nickname ?? "");
  const [intro, setIntro] = useState(profile.intro ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── 추가 필드 ──────────────────────────────────────────
  const [birthDate, setBirthDate] = useState(profile.birth_date ?? "");
  const [gender, setGender] = useState<"male" | "female" | "unknown">(
    profile.gender ?? "unknown"
  );
  const [isPublic, setIsPublic] = useState(profile.is_public ?? true);

  // ── 닉네임 중복 확인 ───────────────────────────────────
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle");

  useEffect(() => {
    const trimmed = nickname.trim();

    // 포맷이 유효하지 않으면 중복 확인 안 함
    if (!validateNickname(trimmed).isValid) {
      setNicknameStatus("idle");
      return;
    }

    // 원래 내 닉네임이면 조회 생략 (자기 자신)
    if (trimmed === (profile.nickname ?? "").trim()) {
      setNicknameStatus("idle");
      return;
    }

    setNicknameStatus("checking");

    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("nickname", trimmed)
        .maybeSingle();

      setNicknameStatus(data ? "taken" : "available");
    }, 500);

    return () => clearTimeout(timer);
  }, [nickname, profile.nickname]);

  // ── 이미지 미리보기 URL ────────────────────────────────
  // useMemo로 blob URL 중복 생성 방지, useEffect로 이전 URL 해제 (메모리 누수 방지)
  const previewUrl = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    if (removeImage) return null;
    return profile.profile_image;
  }, [imageFile, removeImage, profile.profile_image]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ── 저장 가능 여부 ─────────────────────────────────────
  const nicknameValidation = validateNickname(nickname);
  const introValidation = validateIntro(intro);

  const isNicknameOk =
    nicknameValidation.isValid &&
    nicknameStatus !== "taken" &&
    nicknameStatus !== "checking";

  const canSubmit = isNicknameOk && introValidation.isValid && !isSubmitting;

  // ── 이미지 핸들러 ──────────────────────────────────────
  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const result = validateImageFile(file);
      if (!result.isValid) {
        showToast(result.message);
        return;
      }
      setImageFile(file);
      setRemoveImage(false);
      e.target.value = "";
    },
    [showToast]
  );

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setRemoveImage(true);
  }, []);

  // ── 저장 ───────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      let profileImageUrl: string | null = profile.profile_image;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const filePath = `avatars/${profile.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-images")
          .upload(filePath, imageFile, { upsert: true });
        if (uploadError) throw new Error("이미지 업로드에 실패했습니다. 다시 시도해 주세요.");
        const { data } = supabase.storage.from("profile-images").getPublicUrl(filePath);
        profileImageUrl = data.publicUrl;
      } else if (removeImage) {
        profileImageUrl = null;
      }

      const updateData: ProfileUpdate = {
        nickname,
        intro: intro || null,
        profile_image: profileImageUrl,
        birth_date: birthDate || null,
        gender,
        is_public: isPublic,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile.id);

      if (error) throw error;

      showToast("프로필이 업데이트되었습니다");
      setTimeout(() => router.push("/profile"), 800);
    } catch {
      showToast("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canSubmit,
    nickname,
    intro,
    imageFile,
    removeImage,
    birthDate,
    gender,
    isPublic,
    profile.id,
    profile.profile_image,
    router,
    showToast,
  ]);

  return (
    <>
      <Toast message={toast.message} visible={toast.visible} />

      <div className="hide-scrollbar flex-1 overflow-y-auto px-5 pb-32 pt-6">
        {/* 프로필 이미지 편집 */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="relative">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="프로필 이미지"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-bg ring-2 ring-border">
                <UserIcon size={40} color="#9CA3AF" />
              </div>
            )}
            <button
              onClick={() => imageInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary"
              aria-label="프로필 이미지 변경"
            >
              <CameraIcon size={16} color="#fff" />
            </button>
          </div>

          {previewUrl && (
            <button
              onClick={handleRemoveImage}
              className="text-[12px] tracking-tight text-text-secondary underline underline-offset-2"
            >
              이미지 제거
            </button>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* 닉네임 */}
        <div className="mb-6">
          <label className="mb-2 block text-[14px] font-semibold tracking-tight text-text-primary">
            닉네임
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              if (e.target.value.length <= 12) setNickname(e.target.value);
            }}
            placeholder="2~12자"
            className="w-full rounded-xl border-[1.5px] border-border bg-white px-4 py-3.5 text-[15px] tracking-tight text-text-primary outline-none transition-colors focus:border-primary"
            autoComplete="off"
            maxLength={12}
          />
          <NicknameHint
            nickname={nickname}
            formatResult={nicknameValidation}
            status={nicknameStatus}
            isOriginal={nickname.trim() === (profile.nickname ?? "").trim()}
          />
        </div>

        {/* 한줄소개 */}
        <div className="mb-6">
          <label className="mb-2 block text-[14px] font-semibold tracking-tight text-text-primary">
            한줄소개{" "}
            <span className="text-[12px] font-normal text-text-secondary">선택</span>
          </label>
          <textarea
            value={intro}
            onChange={(e) => {
              if (e.target.value.length <= 100) setIntro(e.target.value);
            }}
            placeholder="자신을 소개해 보세요"
            rows={3}
            className="w-full resize-none rounded-xl border-[1.5px] border-border bg-white px-4 py-3.5 text-[15px] leading-relaxed tracking-tight text-text-primary outline-none transition-colors focus:border-primary"
          />
          <div className="mt-1.5 flex justify-end px-1">
            <span className={`text-[12px] ${intro.length >= 100 ? "text-primary" : "text-text-secondary"}`}>
              {intro.length}/100
            </span>
          </div>
        </div>

        {/* 생년월일 */}
        <div className="mb-6">
          <label className="mb-2 block text-[14px] font-semibold tracking-tight text-text-primary">
            생년월일{" "}
            <span className="text-[12px] font-normal text-text-secondary">선택</span>
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full rounded-xl border-[1.5px] border-border bg-white px-4 py-3.5 text-[15px] tracking-tight text-text-primary outline-none transition-colors focus:border-primary"
          />
        </div>

        {/* 성별 */}
        <div className="mb-6">
          <p className="mb-3 text-[14px] font-semibold tracking-tight text-text-primary">
            성별{" "}
            <span className="text-[12px] font-normal text-text-secondary">선택</span>
          </p>
          <div className="flex gap-2.5">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGender(opt.value)}
                className={`flex-1 rounded-xl border py-3 text-[14px] font-semibold tracking-tight transition-colors ${
                  gender === opt.value
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-text-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 프로필 공개 여부 */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-4">
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-text-primary">
              프로필 공개
            </p>
            <p className="mt-0.5 text-[12px] tracking-tight text-text-secondary">
              {isPublic ? "다른 사용자에게 프로필이 공개됩니다" : "나만 볼 수 있습니다"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            onClick={() => setIsPublic((prev) => !prev)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
              isPublic ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isPublic ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
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

// ── 닉네임 힌트 메시지 ────────────────────────────────────

interface NicknameHintProps {
  nickname: string;
  formatResult: { isValid: boolean; message: string };
  status: NicknameStatus;
  isOriginal: boolean;
}

function NicknameHint({ nickname, formatResult, status, isOriginal }: NicknameHintProps) {
  if (!nickname) return null;

  // 포맷 오류 우선 표시
  if (!formatResult.isValid) {
    return (
      <p className="mt-1.5 text-[12px] tracking-tight text-primary">
        {formatResult.message}
      </p>
    );
  }

  // 원래 내 닉네임이면 힌트 없음
  if (isOriginal) return null;

  if (status === "checking") {
    return (
      <p className="mt-1.5 text-[12px] tracking-tight text-text-secondary">
        중복 확인 중...
      </p>
    );
  }
  if (status === "taken") {
    return (
      <p className="mt-1.5 text-[12px] tracking-tight text-primary">
        이미 사용 중인 닉네임입니다
      </p>
    );
  }
  if (status === "available") {
    return (
      <p className="mt-1.5 text-[12px] tracking-tight text-green-700">
        사용 가능한 닉네임입니다
      </p>
    );
  }

  return null;
}
