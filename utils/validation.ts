import { validation } from "@/styles/tokens";
import { containsBannedWord } from "@/banned-words";

/**
 * 입력값 검증 유틸리티
 * 프론트엔드 실시간 검증용 순수 함수입니다.
 * DB 수준 검증은 Supabase RLS와 CHECK 제약조건에서 추가로 처리됩니다.
 */

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * 닉네임 검증 (2~12자, _ . 만 특수문자 허용, 금칙어 포함 금지)
 */
export function validateNickname(nickname: string): ValidationResult {
  const trimmed = nickname.trim();

  if (trimmed.length === 0) {
    return { isValid: false, message: "닉네임을 입력해주세요" };
  }
  if (trimmed.length < validation.nickname.min) {
    return { isValid: false, message: `닉네임 ${validation.nickname.min}자 이상 입력해 주세요` };
  }
  if (trimmed.length > validation.nickname.max) {
    return { isValid: false, message: `닉네임 ${validation.nickname.max}자 이하로 입력해 주세요` };
  }
  if (/[^가-힣a-zA-Z0-9_.]/.test(trimmed)) {
    return { isValid: false, message: "특수문자는 _ 와 . 만 사용할 수 있어요" };
  }
  if (trimmed.startsWith(".") || trimmed.endsWith(".")) {
    return { isValid: false, message: ". 는 첫 글자와 마지막 글자에 사용할 수 없어요" };
  }
  if (/\.\./.test(trimmed)) {
    return { isValid: false, message: ". 는 연속해서 사용할 수 없어요" };
  }
  if (containsBannedWord(trimmed)) {
    return { isValid: false, message: "사용할 수 없는 단어가 포함되어 있어요" };
  }

  return { isValid: true, message: "사용 가능한 닉네임이에요" };
}

/**
 * 한줄소개 검증 (100자 이하)
 */
export function validateIntro(intro: string): ValidationResult {
  if (intro.length > validation.intro.max) {
    return { isValid: false, message: `한줄소개는 ${validation.intro.max}자 이하여야 합니다` };
  }
  return { isValid: true, message: "" };
}

/**
 * 코멘트 검증 (1자 이상, 500자 이하)
 */
export function validateComment(comment: string): ValidationResult {
  const trimmed = comment.trim();

  if (trimmed.length === 0) {
    return { isValid: false, message: "코멘트를 입력해주세요" };
  }
  if (trimmed.length > validation.comment.max) {
    return { isValid: false, message: `코멘트는 ${validation.comment.max}자 이하여야 합니다` };
  }

  return { isValid: true, message: "" };
}

/**
 * 이미지 파일 검증 (타입 + 크기)
 */
export function validateImageFile(file: File): ValidationResult {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const isAllowedType = validation.imageTypes.includes(file.type as (typeof validation.imageTypes)[number]);
  const isAllowedExtension = ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(extension ?? "");

  if (!isAllowedType && !isAllowedExtension) {
    return {
      isValid: false,
      message: "JPG, PNG, WebP, HEIC, HEIF 형식의 이미지만 업로드할 수 있습니다",
    };
  }
  if (file.size > validation.imageSize) {
    return { isValid: false, message: "이미지 크기는 5MB 이하여야 합니다" };
  }

  return { isValid: true, message: "" };
}
