/**
 * 날짜·텍스트 포맷 유틸리티
 */

/**
 * Date → "2024년 3월 5일" 형식
 */
export function formatDateKorean(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Date → "2024.03.05" 형식
 */
export function formatDateDot(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/**
 * Date → "YYYY-MM" 형식 (월별 필터용)
 */
export function formatYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * ISO 날짜 문자열 → Date 객체
 */
export function parseISODate(isoString: string): Date {
  return new Date(isoString);
}

/**
 * n글자 초과 시 "..." 말줄임
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * 카카오 카테고리명 → "restaurant" | "cafe"
 * 카카오 category_group_code: FD6(음식점), CE7(카페)
 */
export function parseKakaoCategory(categoryGroupCode: string): "restaurant" | "cafe" {
  return categoryGroupCode === "CE7" ? "cafe" : "restaurant";
}

/**
 * 숫자 → "1.2km", "300m" 형식
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${Math.round(meters)}m`;
}
