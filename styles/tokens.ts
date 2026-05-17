// ── 색상 ──────────────────────────────────────────────
export const colors = {
  // 브랜드
  primary: "#D32F2F",
  primaryDark: "#B71C1C",
  primarySoft: "#FFF1F1",
  primaryBorder: "#F3B4B4",

  // 텍스트
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",

  // UI
  border: "#E5E7EB",
  background: "#FAFAFA",
  surface: "#FFFFFF",

  // 비활성
  disabledBg: "#E5E7EB",
  disabledText: "#9CA3AF",

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

export type RecommendationType = "recommend" | "neutral" | "not_recommend";

// ── 카테고리 ───────────────────────────────────────────
export const categoryLabels: Record<StoreCategory, string> = {
  restaurant: "맛집",
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
    md: "1rem",       // 16px — 본문, 입력값
    lg: "1.0625rem",  // 17px — 버튼, 주요 리스트
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
  gnbHeight: "72px",
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
  imageTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
} as const;
