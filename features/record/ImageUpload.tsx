"use client";

import { useRef, useCallback } from "react";
import { CameraIcon, CloseIcon } from "@/components/ui/icons";
import { validateImageFile } from "@/utils/validation";

interface ImageUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  onError?: (message: string) => void;
}

/**
 * 이미지 업로드 컴포넌트
 * MIME 타입 검사 + 5MB 이하 제한을 포함합니다.
 */
export default function ImageUpload({ value, onChange, onError }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = value ? URL.createObjectURL(value) : null;

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const result = validateImageFile(file);
      if (!result.isValid) {
        onError?.(result.message);
        e.target.value = "";
        return;
      }

      onChange(file);
      e.target.value = "";
    },
    [onChange, onError]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
    },
    [onChange]
  );

  return (
    <div>
      <label className="mb-2 block text-[14px] font-semibold tracking-tight text-text-primary">
        사진{" "}
        <span className="text-[12px] font-normal text-text-secondary">선택</span>
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileChange}
        className="hidden"
        aria-label="사진 업로드"
      />

      {value && previewUrl ? (
        <div className="relative w-full overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="업로드 이미지 미리보기"
            className="aspect-video w-full object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50"
            aria-label="이미지 제거"
          >
            <CloseIcon size={14} color="#fff" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
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
    </div>
  );
}
