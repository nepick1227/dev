export interface MonthlyMenuRecord {
  id: number;
  visitedAt: string;
  comment: string;
  imageUrl: string;
  storeName: string;
  /** 지번 주소 앞 두 마디 (예: "서울 성동구"). 주소가 없으면 빈 문자열 */
  storeArea: string;
}

export interface MonthlyMenuClaimResult {
  remainingGenerations: number;
  isUnlimited: boolean;
}

export const MONTHLY_MENU_MAX_GENERATIONS = 3;
export const MAX_RECOMMENDED_MENU_LENGTH = 20;

/** 예: "리나의 10월 메뉴판". 닉네임이 없으면 "10월 메뉴판" */
export function formatMonthlyMenuTitle(monthLabel: string, nickname: string | null | undefined) {
  const name = nickname?.trim();
  return name ? `${name}의 ${monthLabel} 메뉴판` : `${monthLabel} 메뉴판`;
}

export function formatStoreArea(address: string | null | undefined) {
  if (!address) return "";
  return address.trim().split(/\s+/).slice(0, 2).join(" ");
}

interface MonthWindow {
  sourceMonth: string;
  monthLabel: string;
  startIso: string;
  endIso: string;
  currentDay: number;
}

function getKoreanDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
}

export function getPreviousMonthWindow(now = new Date()): MonthWindow {
  const current = getKoreanDateParts(now);
  const sourceYear = current.month === 1 ? current.year - 1 : current.year;
  const sourceMonthNumber = current.month === 1 ? 12 : current.month - 1;
  const nextYear = sourceMonthNumber === 12 ? sourceYear + 1 : sourceYear;
  const nextMonthNumber = sourceMonthNumber === 12 ? 1 : sourceMonthNumber + 1;
  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    sourceMonth: `${sourceYear}-${pad(sourceMonthNumber)}-01`,
    monthLabel: `${sourceMonthNumber}월`,
    startIso: `${sourceYear}-${pad(sourceMonthNumber)}-01T00:00:00+09:00`,
    endIso: `${nextYear}-${pad(nextMonthNumber)}-01T00:00:00+09:00`,
    currentDay: current.day,
  };
}

export function formatMonthlyMenuDate(isoDate: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
  }).format(new Date(isoDate)).replace(/\s/g, "");
}

/** GET /api/monthly-menu 응답 */
export interface MonthlyMenuStatus {
  sourceMonth: string;
  monthLabel: string;
  /** 화면 제목. 예: "10월의 메뉴판" */
  title: string;
  /** 이미지에 그리는 제목. 예: "리나의 10월 메뉴판" */
  collageTitle: string;
  records: MonthlyMenuRecord[];
  generationCount: number;
  remainingGenerations: number;
  isUnlimited: boolean;
  canGenerate: boolean;
  shouldAutoOpen: boolean;
}
