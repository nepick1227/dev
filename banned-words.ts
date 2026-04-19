/**
 * 닉네임 금칙어 리스트
 * 추가/수정 시 이 파일만 편집하면 됩니다.
 *
 * 카테고리:
 *  1. 시스템 예약어  — 운영자·관리자 사칭 방지
 *  2. 욕설·비속어    — 한국어 기본 욕설
 *  3. 성적 표현      — 성적 비하·음란 표현
 *  4. 혐오 표현      — 특정 집단 비하
 */

// ── 1. 시스템 예약어 ──────────────────────────────────────
const RESERVED: string[] = [
  "nepick",
  "네픽",
  "admin",
  "administrator",
  "운영자",
  "관리자",
  "공식",
  "official",
  "staff",
  "system",
  "root",
  "bot",
  "master",
  "superuser",
];

// ── 2. 욕설·비속어 ────────────────────────────────────────
const PROFANITY: string[] = [
  "씨발",
  "씨팔",
  "ㅅㅂ",
  "시발",
  "시팔",
  "개새끼",
  "개색끼",
  "ㄱㅅㄲ",
  "병신",
  "ㅂㅅ",
  "미친놈",
  "미친년",
  "미친새끼",
  "ㅁㅊ",
  "지랄",
  "ㅈㄹ",
  "존나",
  "ㅈㄴ",
  "좆",
  "보지",
  "자지",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "nigger",
  "nigga",
];

// ── 3. 성적 표현 ──────────────────────────────────────────
const SEXUAL: string[] = [
  "섹스",
  "섹시",
  "야동",
  "포르노",
  "porn",
  "sex",
  "nude",
  "naked",
  "18+",
  "야한",
  "음란",
  "변태",
  "페티쉬",
];

// ── 4. 혐오 표현 ──────────────────────────────────────────
const HATE: string[] = [
  "김치녀",
  "한남",
  "틀딱",
  "노인충",
  "맘충",
  "급식충",
  "페미",
  "한남충",
  "여성혐오",
  "남성혐오",
];

// ── 전체 병합 ─────────────────────────────────────────────
export const BANNED_WORDS: string[] = [
  ...RESERVED,
  ...PROFANITY,
  ...SEXUAL,
  ...HATE,
];

/**
 * 닉네임에 금칙어가 포함되어 있는지 검사
 * - 대소문자 무시
 * - 공백 제거 후 검사 (ex. "씨 발" 우회 방지)
 */
export function containsBannedWord(nickname: string): boolean {
  const normalized = nickname.toLowerCase().replace(/\s/g, "");
  return BANNED_WORDS.some((word) =>
    normalized.includes(word.toLowerCase())
  );
}
