"use client";

import { useRef, useCallback, useMemo, useEffect } from "react";
import { CameraIcon, TrashIcon, EditIcon } from "@/components/ui/icons";
import { validateImageFile } from "@/utils/validation";

interface ImageUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  onError?: (message: string) => void;
}

export default function ImageUpload({ value, onChange, onError }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

  useEffect(() => {
    return () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

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
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
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
            className="h-52.5 w-full object-cover"
          />
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-[0_2px_8px_rgba(17,24,39,0.10)] transition-colors"
              aria-label="이미지 변경"
            >
              <EditIcon size={18} color="#374151" />
            </button>
            <button
              onClick={handleRemove}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-[0_2px_8px_rgba(17,24,39,0.10)] transition-colors"
              aria-label="이미지 제거"
            >
              <TrashIcon size={18} color="#374151" />
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-border py-8 transition-colors active:bg-bg"
          >
            <CameraIcon size={28} color="var(--color-text-tertiary)" />
            <span className="text-[13px] tracking-tight text-text-secondary">
              사진을 추가해 보세요
            </span>
            <span className="text-[11px] text-text-secondary opacity-70">
              JPG, PNG, WebP, HEIC, HEIF · 최대 5MB
            </span>
          </button>
        </div>
      )}
    </>
  );
}
