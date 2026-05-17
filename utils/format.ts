/**
 * Date → "YYYY-MM" 형식 (월별 필터용)
 */
export function formatYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * 카카오 카테고리명 → "restaurant" | "cafe"
 * 카카오 category_group_code: FD6(음식점), CE7(카페)
 */
export function parseKakaoCategory(categoryGroupCode: string): "restaurant" | "cafe" {
  return categoryGroupCode === "CE7" ? "cafe" : "restaurant";
}

/**
 * Date → "오후 2:30" 형식 (내 픽 카드 시간 표시용)
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${hour}:${m}`;
}

/**
 * Date → "2026.03.21 (토)" 형식 (내 픽 날짜 그룹 헤더용)
 */
export function formatDateGroupLabel(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${y}.${m}.${day} (${weekdays[d.getDay()]})`;
}

