"use client";

import { useState, useCallback, useRef } from "react";
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

/**
 * 프로필 편집 폼 컴포넌트
 */
export default function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState(profile.nickname ?? "");
  const [intro, setIntro] = useState(profile.intro ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : removeImage
      ? null
      : profile.profile_image;

  const nicknameValidation = validateNickname(nickname);
  const introValidation = validateIntro(intro);
  const canSubmit =
    nicknameValidation.isValid && introValidation.isValid && !isSubmitting;

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [showToast]);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setRemoveImage(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      let profileImageUrl: string | null = profile.profile_image;

      // 이미지 업로드
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const filePath = `avatars/${profile.id}.${ext}`;
        await supabase.storage.from("avatars").upload(filePath, imageFile, { upsert: true });
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        profileImageUrl = data.publicUrl;
      } else if (removeImage) {
        profileImageUrl = null;
      }

      const updateData: ProfileUpdate = {
        nickname,
        intro: intro || null,
        profile_image: profileImageUrl,
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
          {nickname && !nicknameValidation.isValid && (
            <p className="mt-1.5 text-[12px] tracking-tight text-primary">
              {nicknameValidation.message}
            </p>
          )}
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
            <span
              className="text-[12px]"
              style={{ color: intro.length >= 100 ? "#D32F2F" : "#6B7280" }}
            >
              {intro.length}/100
            </span>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-white px-5 pb-9 pt-3">
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
