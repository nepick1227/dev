import { validation } from "@/styles/tokens";

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
 * 닉네임 검증 (2~12자, 특수문자 금지)
 */
export function validateNickname(nickname: string): ValidationResult {
  const trimmed = nickname.trim();

  if (trimmed.length === 0) {
    return { isValid: false, message: "닉네임을 입력해주세요" };
  }
  if (trimmed.length < validation.nickname.min) {
    return { isValid: false, message: `닉네임은 ${validation.nickname.min}자 이상이어야 합니다` };
  }
  if (trimmed.length > validation.nickname.max) {
    return { isValid: false, message: `닉네임은 ${validation.nickname.max}자 이하여야 합니다` };
  }
  if (/[^가-힣a-zA-Z0-9_.]/.test(trimmed)) {
    return { isValid: false, message: "닉네임에 사용할 수 없는 문자가 포함되어 있습니다" };
  }

  return { isValid: true, message: "사용 가능한 닉네임입니다" };
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
  if (!validation.imageTypes.includes(file.type as (typeof validation.imageTypes)[number])) {
    return {
      isValid: false,
      message: "JPG, PNG, WebP, HEIC 형식의 이미지만 업로드할 수 있습니다",
    };
  }
  if (file.size > validation.imageSize) {
    return { isValid: false, message: "이미지 크기는 5MB 이하여야 합니다" };
  }

  return { isValid: true, message: "" };
}

/**
 * 생년월일 검증 (과거 날짜, 만 14세 이상)
 */
export function validateBirthDate(birthDate: string): ValidationResult {
  if (!birthDate) {
    return { isValid: false, message: "생년월일을 선택해주세요" };
  }

  const birth = new Date(birthDate);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();

  if (birth > now) {
    return { isValid: false, message: "올바른 생년월일을 입력해주세요" };
  }
  if (age < 14) {
    return { isValid: false, message: "만 14세 이상만 가입할 수 있습니다" };
  }

  return { isValid: true, message: "" };
}
