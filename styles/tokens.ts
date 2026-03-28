/**
 * NePick 디자인 토큰
 * 모든 색상, 폰트, 레이아웃 상수는 이 파일에서 관리합니다.
 * Tailwind 클래스에 없는 색상은 tailwind.config.ts에 추가하세요.
 */

// ── 색상 ──────────────────────────────────────────────
export const colors = {
  // 브랜드
  primary: "#D32F2F",

  // 추천도 3단계
  recommend: "#DF6767",
  neutral: "#EA9C9C",
  notRecommend: "#FFD6D6",

  // 텍스트
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",

  // UI
  border: "#E5E7EB",
  background: "#F9FAFB",
  white: "#FFFFFF",

  // 피드백
  success: "#16A34A",
  error: "#D32F2F",
  warning: "#F59E0B",
} as const;

// ── 추천도 매핑 ────────────────────────────────────────
export const recommendationColors: Record<RecommendationType, string> = {
  recommend: colors.recommend,
  neutral: colors.neutral,
  not_recommend: colors.notRecommend,
};

export const recommendationLabels: Record<RecommendationType, string> = {
  recommend: "추천",
  neutral: "보통",
  not_recommend: "비추",
};

export const recommendationEmojis: Record<RecommendationType, string> = {
  recommend: "👍",
  neutral: "😐",
  not_recommend: "👎",
};

export type RecommendationType = "recommend" | "neutral" | "not_recommend";

// ── 타이포그래피 ───────────────────────────────────────
export const font = {
  family:
    "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  size: {
    xs: "0.75rem",   // 12px — 캡션, 보조 텍스트
    sm: "0.875rem",  // 14px — 본문 보조
    base: "1rem",    // 16px — 본문
    lg: "1.125rem",  // 18px — 소제목
    xl: "1.25rem",   // 20px — 제목
    "2xl": "1.5rem", // 24px — 페이지 타이틀
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
  maxWidth: "430px",       // 모바일 최대 너비
  pagePadding: "20px",     // 페이지 좌우 패딩
  headerHeight: "56px",    // 헤더 높이
  gnbHeight: "64px",       // 하단 탭 높이
  borderRadius: "12px",    // 기본 라운딩
  borderRadiusSm: "8px",   // 작은 라운딩
  borderRadiusLg: "16px",  // 큰 라운딩 (바텀시트 상단)
} as const;

// ── 애니메이션 ─────────────────────────────────────────
export const animation = {
  fast: "150ms ease-out",
  normal: "300ms ease-out",
  slow: "500ms ease-out",
} as const;

// ── 카테고리 ───────────────────────────────────────────
export const categoryLabels: Record<StoreCategory, string> = {
  restaurant: "맛집",
  cafe: "카페",
};

export type StoreCategory = "restaurant" | "cafe";

// ── 유효성 검사 상수 ───────────────────────────────────
export const validation = {
  nickname: { min: 2, max: 12 },
  intro: { max: 100 },
  comment: { max: 500 },
  imageSize: 5 * 1024 * 1024, // 5MB
  imageTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
} as const;
