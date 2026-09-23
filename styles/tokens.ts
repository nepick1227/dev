// ── 색상 ──────────────────────────────────────────────
export const colors = {
  // 브랜드
  primary: "#D32F2F",
  primaryDark: "#B71C1C",
  primarySoft: "#FDECEA",
  primaryBorder: "#F3B4B4",

  // 텍스트
  textPrimary: "#17191C",
  textBody: "#3A3F45",
  textSecondary: "#6E7379",
  textDescription: "#8A9097",
  textTertiary: "#9AA0A6",
  textMuted: "#B4B8BD",

  // UI
  border: "#E6E8EB",
  divider: "#EEF0F2",
  background: "#F4F5F7",
  backgroundSoft: "#F6F7F9",
  surface: "#FFFFFF",

  // 비활성
  disabledBg: "#EDEEF0",
  disabledText: "#B4B8BD",

  // 성공
  success: "#10B981",
  successText: "#047857",
  successBorder: "#34D399",
  successSoft: "#ECFDF5",

  // 에러/경고
  error: "#B71C1C",
  warning: "#F59E0B",
} as const;

// ── 추천도 레이블/이모지 ────────────────────────────────
export const recommendationLabels: Record<RecommendationType, string> = {
  recommend: "추천",
  neutral: "보통",
  not_recommend: "비추천",
};

export const recommendationEmojis: Record<RecommendationType, string> = {
  recommend: "👍",
  neutral: "😐",
  not_recommend: "👎",
};

export const recommendationColors: Record<RecommendationType, string> = {
  recommend: "#D32F2F",
  neutral: "#6E7379",
  not_recommend: "#C77700",
};

export type RecommendationType = "recommend" | "neutral" | "not_recommend";

// ── 카테고리 ───────────────────────────────────────────
export const categoryLabels: Record<StoreCategory, string> = {
  restaurant: "음식점",
  cafe: "카페",
};

export type StoreCategory = "restaurant" | "cafe";

// ── 타이포그래피 ───────────────────────────────────────
export const font = {
  family:
    "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  size: {
    xs: "0.75rem",    // 12px — 캡션, 보조 텍스트
    sm: "0.8125rem",  // 13px — 캡션 variant
    base: "0.875rem", // 14px — 본문 보조
    md: "0.9375rem",  // 15px — 주요 본문, 입력값
    lg: "0.96875rem", // 15.5px — 강조 본문
    xl: "1.125rem",   // 18px — 섹션 제목
    "2xl": "1.25rem", // 20px — 제목
    "3xl": "1.375rem",// 22px — 앱바 제목
    "4xl": "1.75rem", // 28px — 페이지 제목
    "5xl": "2rem",    // 32px — 디스플레이
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  letterSpacing: {
    tight: "-0.3px",
    tighter: "-0.5px",
  },
} as const;

// ── 레이아웃 ───────────────────────────────────────────
export const layout = {
  maxWidth: "430px",
  pagePadding: "24px",
  headerHeight: "56px",
  gnbHeight: "64px",
} as const;

// ── 스페이싱 ───────────────────────────────────────────
export const spacing = {
  xs: "4px",
  s: "8px",
  m: "12px",
  l: "16px",
  xl: "20px",
  xxl: "24px",
  xxxl: "32px",
} as const;

// ── 애니메이션 ─────────────────────────────────────────
export const animation = {
  fast: "150ms ease-out",
  normal: "300ms ease-out",
  slow: "500ms ease-out",
} as const;

// ── 유효성 검사 상수 ───────────────────────────────────
export const validation = {
  nickname: { min: 2, max: 12 },
  intro: { max: 100 },
  comment: { max: 500 },
  imageSize: 5 * 1024 * 1024,
  imageTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
} as const;
