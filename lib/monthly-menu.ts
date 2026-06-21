export interface MonthlyMenuRecord {
  id: number;
  visitedAt: string;
  comment: string;
  imageUrl: string;
  storeName: string;
}

export interface MonthlyMenuGeneratedItem extends MonthlyMenuRecord {
  caption: string;
}

export interface MonthlyMenuResult {
  title: string;
  subtitle: string;
  sourceMonth: string;
  remainingGenerations: number;
  isUnlimited: boolean;
  artworkUrl: string;
  items: MonthlyMenuGeneratedItem[];
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
